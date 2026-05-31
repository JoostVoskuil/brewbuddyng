import { useDB } from '~/server/db'
import { eq } from 'drizzle-orm'
import {
  recipes,
  recipeFermentables,
  recipeHops,
  recipeYeasts,
  recipeMiscs,
  yeasts,
  fermentables,
  hops,
  miscs,
} from '~/server/db/schema'
import { recipeCreate } from '~/server/utils/validation'
import { evaluateStock, type StockEntry, type StockState } from '~/server/utils/stock'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const method = getMethod(event)

  if (method === 'GET') {
    const allRecipes = await db.select().from(recipes).all()

    // Build a lowercase searchable text per recipe from its ingredient names so
    // the recipe list can be filtered by malt, hop, yeast (incl. product code)
    // and misc ingredient names — mirroring BrouwHulp's recipe filter.
    const ferms = await db.select().from(recipeFermentables).all()
    const hopsRows = await db.select().from(recipeHops).all()
    const yeastRows = await db
      .select({
        recipeId: recipeYeasts.recipeId,
        yeastId: recipeYeasts.yeastId,
        amount: recipeYeasts.amount,
        name: recipeYeasts.name,
        laboratory: yeasts.laboratory,
        productId: yeasts.productId,
        inventory: yeasts.inventory,
        alwaysOnStock: yeasts.alwaysOnStock,
      })
      .from(recipeYeasts)
      .leftJoin(yeasts, eq(recipeYeasts.yeastId, yeasts.id))
      .all()
    const miscRows = await db.select().from(recipeMiscs).all()

    // Inventory lookups for stock-state computation.
    const fermStock = new Map<number, StockEntry>()
    for (const f of await db.select().from(fermentables).all()) {
      fermStock.set(f.id, { inv: f.inventory ?? 0, always: !!f.alwaysOnStock })
    }
    const hopStock = new Map<number, StockEntry>()
    for (const h of await db.select().from(hops).all()) {
      hopStock.set(h.id, { inv: h.inventory ?? 0, always: !!h.alwaysOnStock })
    }
    const miscStock = new Map<number, StockEntry>()
    for (const m of await db.select().from(miscs).all()) {
      miscStock.set(m.id, { inv: m.inventory ?? 0, always: !!m.alwaysOnStock })
    }

    const parts = new Map<number, string[]>()
    const push = (recipeId: number, ...values: Array<string | null | undefined>) => {
      const list = parts.get(recipeId) ?? []
      for (const v of values) {
        if (v) list.push(v)
      }
      parts.set(recipeId, list)
    }
    for (const f of ferms) push(f.recipeId, f.name)
    for (const h of hopsRows) push(h.recipeId, h.name)
    for (const y of yeastRows) push(y.recipeId, y.name, y.laboratory, y.productId)
    for (const m of miscRows) push(m.recipeId, m.name)

    const stockBy = new Map<number, StockState>()
    evaluateStock(
      stockBy,
      ferms.map((f) => ({ ownerId: f.recipeId, refId: f.fermentableId, amount: f.amount })),
      fermStock,
    )
    evaluateStock(
      stockBy,
      hopsRows.map((h) => ({ ownerId: h.recipeId, refId: h.hopId, amount: h.amount })),
      hopStock,
    )
    evaluateStock(
      stockBy,
      miscRows.map((m) => ({ ownerId: m.recipeId, refId: m.miscId, amount: m.amount ?? 0 })),
      miscStock,
    )
    // Yeast amount is often 0 (count-by-package); treat any row as needing 1.
    const yeastStock = new Map<number, StockEntry>()
    for (const y of yeastRows) {
      if (y.yeastId == null) continue
      yeastStock.set(y.yeastId, { inv: y.inventory ?? 0, always: !!y.alwaysOnStock })
    }
    evaluateStock(
      stockBy,
      yeastRows.map((y) => ({
        ownerId: y.recipeId,
        refId: y.yeastId,
        amount: (y.amount ?? 0) > 0 ? (y.amount ?? 0) : 1,
      })),
      yeastStock,
    )

    return allRecipes.map((r) => ({
      ...r,
      searchText: [r.name, r.code ?? '', r.type, ...(parts.get(r.id) ?? [])]
        .join(' ')
        .toLowerCase(),
      stockState: stockBy.get(r.id) ?? 'unknown',
    }))
  }

  if (method === 'POST') {
    const body = await readValidatedBody(event, (b) => recipeCreate.parse(b))
    const now = new Date().toISOString()
    const [created] = await db
      .insert(recipes)
      .values({ ...body, createdAt: now, updatedAt: now })
      .returning()
    setResponseStatus(event, 201)
    return created
  }

  throw createError({ statusCode: 405, message: `Method ${method} not allowed` })
})
