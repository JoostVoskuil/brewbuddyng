import { useDB } from '~/server/db'
import {
  brews,
  brewChecklist,
  brewDivisions,
  brewMeasurements,
  brewYeastStarter,
  recipes,
  recipeMashSteps,
} from '~/server/db/schema'
import { brewUpdate, brewChecklistItemInput } from '~/server/utils/validation'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid id' })
  }
  const method = getMethod(event)

  if (method === 'GET') {
    const brew = await db.select().from(brews).where(eq(brews.id, id)).get()
    if (!brew) throw createError({ statusCode: 404, message: 'Brew not found' })

    const [measurements, checklist, yeastStarter, divisions] = await Promise.all([
      db.select().from(brewMeasurements).where(eq(brewMeasurements.brewId, id)).all(),
      db.select().from(brewChecklist).where(eq(brewChecklist.brewId, id)).all(),
      db.select().from(brewYeastStarter).where(eq(brewYeastStarter.brewId, id)).all(),
      db.select().from(brewDivisions).where(eq(brewDivisions.parentBrewId, id)).all(),
    ])

    // For the brew-day workflow, surface the recipe's mash steps and boil time
    // (BrouwHulp brew-day timing) when the brew is linked to a recipe.
    let mashSteps: Array<typeof recipeMashSteps.$inferSelect> = []
    let boilTime = 0
    if (brew.recipeId) {
      const [steps, recipe] = await Promise.all([
        db.select().from(recipeMashSteps).where(eq(recipeMashSteps.recipeId, brew.recipeId)).all(),
        db.select().from(recipes).where(eq(recipes.id, brew.recipeId)).get(),
      ])
      mashSteps = steps.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      boilTime = recipe?.boilTime ?? 0
    }

    return { ...brew, measurements, checklist, yeastStarter, divisions, mashSteps, boilTime }
  }

  if (method === 'PUT') {
    // Measurements are managed via their own endpoint; the checklist may be
    // replaced wholesale here when provided.
    const body = await readValidatedBody(event, (b) =>
      brewUpdate.extend({ checklist: brewChecklistItemInput.array().optional() }).parse(b),
    )
    const { checklist, ...brewData } = body

    const [updated] = await db.update(brews).set(brewData).where(eq(brews.id, id)).returning()
    if (!updated) throw createError({ statusCode: 404, message: 'Brew not found' })

    if (checklist !== undefined) {
      await db.delete(brewChecklist).where(eq(brewChecklist.brewId, id))
      if (checklist.length) {
        await db.insert(brewChecklist).values(checklist.map((item) => ({ ...item, brewId: id })))
      }
    }

    return updated
  }

  if (method === 'DELETE') {
    const [deleted] = await db.delete(brews).where(eq(brews.id, id)).returning()
    if (!deleted) throw createError({ statusCode: 404, message: 'Brew not found' })
    return { success: true }
  }

  throw createError({ statusCode: 405, message: `Method ${method} not allowed` })
})
