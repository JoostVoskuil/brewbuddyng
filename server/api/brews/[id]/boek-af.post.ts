import { eq } from 'drizzle-orm'
import { useDB } from '~/server/db'
import {
  brews,
  fermentables,
  hops,
  miscs,
  recipeFermentables,
  recipeHops,
  recipeMiscs,
  recipeYeasts,
  yeasts,
} from '~/server/db/schema'
import {
  appendInventoryDeductionMarker,
  hasInventoryDeductionMarker,
  planInventoryDeductions,
  type InventoryKind,
  type InventoryRequirement,
  type InventoryStockRow,
} from '~/server/utils/inventory'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid brew id' })
  }

  return db.transaction((tx) => {
    const brew = tx.select().from(brews).where(eq(brews.id, id)).get()
    if (!brew) throw createError({ statusCode: 404, message: 'Brew not found' })
    if (!brew.recipeId) {
      throw createError({ statusCode: 400, message: 'Brew has no linked recipe' })
    }
    if (hasInventoryDeductionMarker(brew.notes)) {
      throw createError({ statusCode: 409, message: 'Inventory already deducted for this brew' })
    }

    const [fermRows, hopRows, yeastRows, miscRows] = [
      tx
        .select()
        .from(recipeFermentables)
        .where(eq(recipeFermentables.recipeId, brew.recipeId))
        .all(),
      tx.select().from(recipeHops).where(eq(recipeHops.recipeId, brew.recipeId)).all(),
      tx.select().from(recipeYeasts).where(eq(recipeYeasts.recipeId, brew.recipeId)).all(),
      tx.select().from(recipeMiscs).where(eq(recipeMiscs.recipeId, brew.recipeId)).all(),
    ]

    const requirements: InventoryRequirement[] = [
      ...fermRows.map((row) => ({
        kind: 'fermentable' as const,
        ingredientId: row.fermentableId,
        name: row.name,
        amount: row.amount,
      })),
      ...hopRows.map((row) => ({
        kind: 'hop' as const,
        ingredientId: row.hopId,
        name: row.name,
        amount: row.amount,
      })),
      ...yeastRows.map((row) => ({
        kind: 'yeast' as const,
        ingredientId: row.yeastId,
        name: row.name,
        amount: row.amount,
      })),
      ...miscRows.map((row) => ({
        kind: 'misc' as const,
        ingredientId: row.miscId,
        name: row.name,
        amount: row.amount,
      })),
    ]

    const stockByKind: Record<InventoryKind, Map<number, InventoryStockRow>> = {
      fermentable: new Map(
        tx
          .select()
          .from(fermentables)
          .all()
          .map((row) => [row.id, row]),
      ),
      hop: new Map(
        tx
          .select()
          .from(hops)
          .all()
          .map((row) => [row.id, row]),
      ),
      yeast: new Map(
        tx
          .select()
          .from(yeasts)
          .all()
          .map((row) => [row.id, row]),
      ),
      misc: new Map(
        tx
          .select()
          .from(miscs)
          .all()
          .map((row) => [row.id, row]),
      ),
    }

    const plan = planInventoryDeductions(requirements, stockByKind)

    for (const deduction of plan.deductions) {
      switch (deduction.kind) {
        case 'fermentable':
          tx.update(fermentables)
            .set({ inventory: deduction.after })
            .where(eq(fermentables.id, deduction.ingredientId))
            .run()
          break
        case 'hop':
          tx.update(hops)
            .set({ inventory: deduction.after })
            .where(eq(hops.id, deduction.ingredientId))
            .run()
          break
        case 'yeast':
          tx.update(yeasts)
            .set({ inventory: deduction.after })
            .where(eq(yeasts.id, deduction.ingredientId))
            .run()
          break
        case 'misc':
          tx.update(miscs)
            .set({ inventory: deduction.after })
            .where(eq(miscs.id, deduction.ingredientId))
            .run()
          break
      }
    }

    const deductedAt = new Date().toISOString()
    tx.update(brews)
      .set({ notes: appendInventoryDeductionMarker(brew.notes, deductedAt) })
      .where(eq(brews.id, id))
      .run()

    return { deductedAt, ...plan }
  })
})
