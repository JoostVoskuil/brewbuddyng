import { useDB } from '~/server/db'
import { recipes, recipeFermentables, recipeHops, beerStyles } from '~/server/db/schema'

interface NumStat {
  avg: number
  min: number
  max: number
}

function stat(values: number[]): NumStat {
  const v = values.filter((x) => Number.isFinite(x) && x > 0)
  if (!v.length) return { avg: 0, min: 0, max: 0 }
  return {
    avg: v.reduce((a, b) => a + b, 0) / v.length,
    min: Math.min(...v),
    max: Math.max(...v),
  }
}

/**
 * Beer style analysis (BrouwHulp style statistics): group recipes by their
 * assigned beer style and report the OG/IBU/colour spread plus, for each
 * fermentable and hop, how often it appears (presence %) and its average share
 * of the grist / hop bill among the recipes that use it.
 */
export default defineEventHandler(async () => {
  const db = useDB()
  const allRecipes = await db.select().from(recipes).all()
  const styles = await db.select().from(beerStyles).all()
  const ferms = await db.select().from(recipeFermentables).all()
  const hopRows = await db.select().from(recipeHops).all()

  const styleName = new Map(styles.map((s) => [s.id, s.name]))

  const grainTotal = new Map<number, number>()
  const hopTotal = new Map<number, number>()
  const fermsByRecipe = new Map<number, typeof ferms>()
  const hopsByRecipe = new Map<number, typeof hopRows>()
  for (const f of ferms) {
    grainTotal.set(f.recipeId, (grainTotal.get(f.recipeId) ?? 0) + (f.amount || 0))
    const list = fermsByRecipe.get(f.recipeId) ?? []
    list.push(f)
    fermsByRecipe.set(f.recipeId, list)
  }
  for (const h of hopRows) {
    hopTotal.set(h.recipeId, (hopTotal.get(h.recipeId) ?? 0) + (h.amount || 0))
    const list = hopsByRecipe.get(h.recipeId) ?? []
    list.push(h)
    hopsByRecipe.set(h.recipeId, list)
  }

  const groups = new Map<number, typeof allRecipes>()
  for (const r of allRecipes) {
    if (r.styleId == null) continue
    const list = groups.get(r.styleId) ?? []
    list.push(r)
    groups.set(r.styleId, list)
  }

  // Aggregate one ingredient dimension (fermentables or hops) for a style group.
  function aggregate(
    groupRecipes: typeof allRecipes,
    byRecipe: Map<number, { recipeId: number; name: string; amount: number | null }[]>,
    totals: Map<number, number>,
  ) {
    const agg = new Map<string, { count: number; sumPct: number }>()
    for (const r of groupRecipes) {
      const total = totals.get(r.id) ?? 0
      const items = byRecipe.get(r.id) ?? []
      const perName = new Map<string, number>()
      for (const it of items) {
        const pct = total > 0 ? ((it.amount || 0) / total) * 100 : 0
        perName.set(it.name, (perName.get(it.name) ?? 0) + pct)
      }
      for (const [name, pct] of perName) {
        const cur = agg.get(name) ?? { count: 0, sumPct: 0 }
        cur.count += 1
        cur.sumPct += pct
        agg.set(name, cur)
      }
    }
    const n = groupRecipes.length
    return [...agg.entries()]
      .map(([name, v]) => ({
        name,
        presence: n > 0 ? (v.count / n) * 100 : 0,
        avgPercent: v.count > 0 ? v.sumPct / v.count : 0,
      }))
      .sort((a, b) => b.presence - a.presence || b.avgPercent - a.avgPercent)
  }

  const result = [...groups.entries()]
    .map(([styleId, rs]) => ({
      styleId,
      styleName: styleName.get(styleId) ?? `#${styleId}`,
      count: rs.length,
      og: stat(rs.map((r) => r.og ?? 0)),
      ibu: stat(rs.map((r) => r.ibu ?? 0)),
      color: stat(rs.map((r) => r.color ?? 0)),
      abv: stat(rs.map((r) => r.abv ?? 0)),
      fermentables: aggregate(rs, fermsByRecipe, grainTotal),
      hops: aggregate(rs, hopsByRecipe, hopTotal),
    }))
    .sort((a, b) => b.count - a.count || a.styleName.localeCompare(b.styleName))

  return result
})
