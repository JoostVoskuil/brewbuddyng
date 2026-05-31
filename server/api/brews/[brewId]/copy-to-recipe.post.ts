import { useDB } from '~/server/db'
import {
  brews,
  recipes,
  recipeFermentables,
  recipeHops,
  recipeYeasts,
  recipeMiscs,
  recipeWaters,
} from '~/server/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Create a new recipe from an existing brew. The brew's source recipe (if any)
 * is duplicated, and the brew's measured OG/FG/efficiency override the recipe
 * values where available. This is the reverse of the recipe -> brew copy and
 * lets a brewer turn a successful brew back into a reusable recipe.
 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'brewId'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid id' })
  }

  const db = useDB()
  const brew = await db.select().from(brews).where(eq(brews.id, id)).get()
  if (!brew) throw createError({ statusCode: 404, message: 'Brew not found' })

  const now = new Date().toISOString()

  // Base recipe values come from the source recipe when present.
  let source = null
  if (brew.recipeId) {
    source = await db.select().from(recipes).where(eq(recipes.id, brew.recipeId)).get()
  }

  const [recipe] = await db
    .insert(recipes)
    .values({
      name: brew.name,
      type: source?.type ?? 'All Grain',
      batchSize: source?.batchSize ?? 0,
      boilSize: source?.boilSize ?? 0,
      boilTime: source?.boilTime ?? 60,
      efficiency: brew.efficiencyActual || source?.efficiency || 75,
      styleId: source?.styleId ?? null,
      equipmentId: source?.equipmentId ?? null,
      mashProfileId: source?.mashProfileId ?? null,
      og: brew.ogActual || source?.og || 0,
      fg: brew.fgActual || source?.fg || 0,
      ibu: source?.ibu ?? 0,
      color: source?.color ?? 0,
      abv: source?.abv ?? 0,
      notes: brew.notes ?? '',
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  if (!recipe) throw createError({ statusCode: 500, message: 'Insert failed' })
  const recipeId = recipe.id

  // Duplicate ingredient child rows from the source recipe.
  if (brew.recipeId) {
    const srcId = brew.recipeId
    const [ferms, hopRows, yeastRows, miscRows, waterRows] = await Promise.all([
      db.select().from(recipeFermentables).where(eq(recipeFermentables.recipeId, srcId)).all(),
      db.select().from(recipeHops).where(eq(recipeHops.recipeId, srcId)).all(),
      db.select().from(recipeYeasts).where(eq(recipeYeasts.recipeId, srcId)).all(),
      db.select().from(recipeMiscs).where(eq(recipeMiscs.recipeId, srcId)).all(),
      db.select().from(recipeWaters).where(eq(recipeWaters.recipeId, srcId)).all(),
    ])

    const strip = <T extends { id: number; recipeId: number }>(rows: T[]) =>
      rows.map(({ id: _id, recipeId: _r, ...rest }) => ({ ...rest, recipeId }))

    if (ferms.length) await db.insert(recipeFermentables).values(strip(ferms))
    if (hopRows.length) await db.insert(recipeHops).values(strip(hopRows))
    if (yeastRows.length) await db.insert(recipeYeasts).values(strip(yeastRows))
    if (miscRows.length) await db.insert(recipeMiscs).values(strip(miscRows))
    if (waterRows.length) await db.insert(recipeWaters).values(strip(waterRows))
  }

  setResponseStatus(event, 201)
  return { id: recipeId, name: recipe.name }
})
