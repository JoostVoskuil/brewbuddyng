import { useDB } from '~/server/db'
import { beerStyles } from '~/server/db/schema'
import {
  rankStyleMatches,
  type RecipeMetrics,
  type StyleRanges,
} from '~/server/utils/calculations/style-match'

/**
 * Style-match wizard endpoint (BrouwHulp "Stijl zoeken"): given a set of recipe
 * metrics, rank all stored beer styles by how well the recipe fits each one's
 * published OG/FG/IBU/colour/ABV ranges. Colour is matched in SRM.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const metrics: RecipeMetrics = {
    og: num(body.og),
    fg: num(body.fg),
    ibu: num(body.ibu),
    colorSrm: num(body.colorSrm),
    abv: num(body.abv),
  }
  const limit = Number.isFinite(body.limit) ? Math.max(1, Math.floor(body.limit)) : 10

  const db = useDB()
  const styles = await db.select().from(beerStyles).all()

  const candidates = styles.map((s) => ({
    style: {
      id: s.id,
      name: s.name,
      category: s.category,
      categoryNumber: s.categoryNumber,
      styleLetter: s.styleLetter,
      styleGuide: s.styleGuide,
    },
    ranges: {
      og: { min: s.ogMin ?? 0, max: s.ogMax ?? 0 },
      fg: { min: s.fgMin ?? 0, max: s.fgMax ?? 0 },
      ibu: { min: s.ibuMin ?? 0, max: s.ibuMax ?? 0 },
      colorSrm: { min: s.colorMin ?? 0, max: s.colorMax ?? 0 },
      abv: { min: s.abvMin ?? 0, max: s.abvMax ?? 0 },
    } satisfies StyleRanges,
  }))

  const ranked = rankStyleMatches(metrics, candidates)
  return ranked.slice(0, limit).map((m) => ({
    style: m.style,
    score: Number(m.score.toFixed(4)),
    inRangeCount: m.inRangeCount,
    evaluatedCount: m.evaluatedCount,
    fits: m.fits,
  }))
})

function num(v: unknown): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : undefined
}
