import { useDB } from '~/server/db'
import { brews, recipes } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import {
  trainPredictor,
  hasEnoughData,
  type TrainingSample,
} from '~/server/utils/calculations'

/**
 * Predict the likely outcome (actual OG, FG and mash efficiency) of a brew using
 * a neural network trained on the brewery's own history (BrouwHulp's neural-
 * network prediction feature). The network learns from previously completed
 * brews that share the same equipment as the target brew; when too few such
 * brews exist it falls back to all completed brews. Returns `trained: false`
 * with the number of usable brews when there is not enough data yet.
 *
 * Inputs (recipe design + process):  OG target, IBU, colour (EBC), batch size,
 *                                    boil time, efficiency setting.
 * Outputs (measured results):        actual OG, actual FG, actual efficiency.
 */
const INPUT_KEYS = ['og', 'ibu', 'color', 'batchSize', 'boilTime', 'efficiency'] as const

/** A brew is usable for training when all three actual results were recorded. */
function brewActuals(brew: typeof brews.$inferSelect): number[] | null {
  const og = brew.ogActual ?? 0
  const fg = brew.fgActual ?? 0
  const eff = brew.efficiencyActual ?? 0
  if (og <= 1 || fg <= 0.9 || eff <= 0) return null
  return [og, fg, eff]
}

function recipeFeatures(recipe: typeof recipes.$inferSelect): number[] {
  return INPUT_KEYS.map((k) => (recipe[k] as number) ?? 0)
}

export default defineEventHandler(async (event) => {
  const db = useDB()
  const brewId = Number(getRouterParam(event, 'brewId'))
  if (!Number.isInteger(brewId) || brewId <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid brew id' })
  }

  const brew = await db.select().from(brews).where(eq(brews.id, brewId)).get()
  if (!brew) throw createError({ statusCode: 404, message: 'Brew not found' })
  if (!brew.recipeId) {
    return { trained: false, usableBrews: 0, reason: 'no-recipe' as const }
  }
  const recipe = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, brew.recipeId))
    .get()
  if (!recipe) {
    return { trained: false, usableBrews: 0, reason: 'no-recipe' as const }
  }

  // Gather all completed brews with valid actuals and a linked recipe.
  const allBrews = await db.select().from(brews).all()
  const allRecipes = await db.select().from(recipes).all()
  const recipeById = new Map(allRecipes.map((r) => [r.id, r]))

  type Row = { equipmentId: number | null; sample: TrainingSample }
  const rows: Row[] = []
  for (const b of allBrews) {
    if (!b.recipeId) continue
    const r = recipeById.get(b.recipeId)
    if (!r) continue
    const outputs = brewActuals(b)
    if (!outputs) continue
    rows.push({ equipmentId: r.equipmentId, sample: { inputs: recipeFeatures(r), outputs } })
  }

  // Prefer brews on the same equipment; fall back to all when too few.
  const sameEquipment = rows.filter((row) => row.equipmentId === recipe.equipmentId)
  const nIn = INPUT_KEYS.length
  const nOut = 3
  let scope: 'equipment' | 'all' = 'equipment'
  let chosen = sameEquipment
  if (!hasEnoughData(sameEquipment.length, nIn, nOut)) {
    chosen = rows
    scope = 'all'
  }

  const samples = chosen.map((row) => row.sample)
  const net = trainPredictor(samples, { epochs: 4000, seed: 1 })
  if (!net) {
    return { trained: false, usableBrews: samples.length, reason: 'insufficient-data' as const }
  }

  const prediction = net.predict(recipeFeatures(recipe))
  const ogPredicted = prediction[0] ?? 0
  const fgPredicted = prediction[1] ?? 0
  const efficiencyPredicted = prediction[2] ?? 0
  // ABV from predicted OG/FG (same simple formula used elsewhere in the app).
  const abvPredicted = (ogPredicted - fgPredicted) * 131.25

  return {
    trained: true,
    scope,
    usableBrews: samples.length,
    mse: net.mse,
    predictions: {
      og: ogPredicted,
      fg: fgPredicted,
      efficiency: efficiencyPredicted,
      abv: abvPredicted,
    },
  }
})
