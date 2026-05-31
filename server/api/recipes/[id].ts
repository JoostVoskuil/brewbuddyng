import { useDB } from '~/server/db'
import {
  recipes,
  recipeFermentables,
  recipeHops,
  recipeYeasts,
  recipeMiscs,
  recipeWaters,
  recipeMashSteps,
} from '~/server/db/schema'
import { recipeUpdate } from '~/server/utils/validation'
import { eq } from 'drizzle-orm'

// Maps each ingredient list on the request body to its child table.
const CHILD_TABLES = [
  { key: 'fermentables', table: recipeFermentables },
  { key: 'hops', table: recipeHops },
  { key: 'yeasts', table: recipeYeasts },
  { key: 'miscs', table: recipeMiscs },
  { key: 'waters', table: recipeWaters },
  { key: 'mashSteps', table: recipeMashSteps },
] as const

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid id' })
  }
  const method = getMethod(event)

  if (method === 'GET') {
    const recipe = await db.select().from(recipes).where(eq(recipes.id, id)).get()
    if (!recipe) throw createError({ statusCode: 404, message: 'Recipe not found' })

    const [fermentables, hops, yeasts, miscs, waters, mashSteps] = await Promise.all([
      db.select().from(recipeFermentables).where(eq(recipeFermentables.recipeId, id)).all(),
      db.select().from(recipeHops).where(eq(recipeHops.recipeId, id)).all(),
      db.select().from(recipeYeasts).where(eq(recipeYeasts.recipeId, id)).all(),
      db.select().from(recipeMiscs).where(eq(recipeMiscs.recipeId, id)).all(),
      db.select().from(recipeWaters).where(eq(recipeWaters.recipeId, id)).all(),
      db
        .select()
        .from(recipeMashSteps)
        .where(eq(recipeMashSteps.recipeId, id))
        .orderBy(recipeMashSteps.sortOrder)
        .all(),
    ])

    return { ...recipe, fermentables, hops, yeasts, miscs, waters, mashSteps }
  }

  if (method === 'PUT') {
    const body = await readValidatedBody(event, (b) => recipeUpdate.parse(b))
    const { fermentables, hops, yeasts, miscs, waters, mashSteps, ...recipeData } = body
    const childData: Record<string, unknown[] | undefined> = {
      fermentables,
      hops,
      yeasts,
      miscs,
      waters,
      mashSteps,
    }

    const [updated] = await db
      .update(recipes)
      .set({ ...recipeData, updatedAt: new Date().toISOString() })
      .where(eq(recipes.id, id))
      .returning()
    if (!updated) throw createError({ statusCode: 404, message: 'Recipe not found' })

    // Replace each provided ingredient list wholesale. Child rows never carry
    // their own id/recipeId — those are owned by the server.
    for (const { key, table } of CHILD_TABLES) {
      const rows = childData[key]
      if (rows === undefined) continue
      await db.delete(table).where(eq(table.recipeId, id))
      if (rows.length) {
        await db
          .insert(table)
          .values(rows.map((row) => ({ ...(row as object), recipeId: id })) as never)
      }
    }

    return updated
  }

  if (method === 'DELETE') {
    const [deleted] = await db.delete(recipes).where(eq(recipes.id, id)).returning()
    if (!deleted) throw createError({ statusCode: 404, message: 'Recipe not found' })
    return { success: true }
  }

  throw createError({ statusCode: 405, message: `Method ${method} not allowed` })
})
