import { useDB } from '~/server/db'
import { recipes, recipeFermentables, recipeHops, recipeYeasts } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { calculateOG, estimateFGSimple } from '~/server/utils/calculations/gravity'
import {
  calculateTotalIBU,
  type HopAddition,
  type HopUse,
  type HopForm,
} from '~/server/utils/calculations/ibu'
import { calculateColorEBC } from '~/server/utils/calculations/color'
import { calculateABV } from '~/server/utils/calculations/abv'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = Number(getRouterParam(event, 'id'))

  const recipe = await db.select().from(recipes).where(eq(recipes.id, id)).get()
  if (!recipe) throw createError({ statusCode: 404, message: 'Recipe not found' })

  const fermentablesList = await db
    .select()
    .from(recipeFermentables)
    .where(eq(recipeFermentables.recipeId, id))
    .all()
  const hopsList = await db.select().from(recipeHops).where(eq(recipeHops.recipeId, id)).all()
  const yeastsList = await db.select().from(recipeYeasts).where(eq(recipeYeasts.recipeId, id)).all()

  // Calculate OG
  const og = calculateOG(
    fermentablesList.map((f) => ({
      amount: f.amount,
      yield: f.yield || 0,
      addAfterBoil: f.addAfterBoil || false,
    })),
    recipe.batchSize || 20,
    recipe.efficiency || 75,
  )

  // Calculate FG from average yeast attenuation
  const avgAttenuation =
    yeastsList.length > 0
      ? yeastsList.reduce((sum, y) => sum + (y.attenuation || 75), 0) / yeastsList.length
      : 75
  const fg = estimateFGSimple(og, avgAttenuation)

  // Calculate IBU
  const hopAdditions: HopAddition[] = hopsList.map((h) => ({
    amount: (h.amount || 0) * 1000, // kg to grams
    alpha: h.alpha || 0,
    time: h.time || 0,
    use: (h.use || 'boil').toLowerCase().replace(' ', '_') as HopUse,
    form: (h.form || 'pellet').toLowerCase() as HopForm,
  }))
  const ibu = calculateTotalIBU(hopAdditions, {
    og,
    batchSize: recipe.batchSize || 20,
    boilSize: recipe.boilSize || 25,
  })

  // Calculate Color
  const color = calculateColorEBC(
    fermentablesList.map((f) => ({
      amount: f.amount,
      color: f.color || 0,
    })),
    recipe.batchSize || 20,
  )

  // Calculate ABV
  const abv = calculateABV(og, fg)

  // Update recipe with calculated values
  await db
    .update(recipes)
    .set({ og, fg, ibu, color, abv, updatedAt: new Date().toISOString() })
    .where(eq(recipes.id, id))

  return { og, fg, ibu, color, abv }
})
