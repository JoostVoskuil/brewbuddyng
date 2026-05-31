import { useDB } from '~/server/db'
import {
  recipes,
  recipeFermentables,
  recipeHops,
  recipeYeasts,
  recipeMiscs,
  recipeWaters,
  recipeMashSteps,
  equipment,
} from '~/server/db/schema'
import { generateBeerXml } from '~/server/utils/recipe-io/beerxml'
import type { ImportedRecipe } from '~/server/utils/recipe-io/types'
import { eq } from 'drizzle-orm'

/**
 * Export a single recipe as a BeerXML 1.0 document. BrouwHulp reads the same
 * format, so this doubles as the "BrouwHulp XML" export. Returns the XML with
 * an attachment Content-Disposition so the browser downloads it.
 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid id' })
  }

  const db = useDB()
  const recipe = await db.select().from(recipes).where(eq(recipes.id, id)).get()
  if (!recipe) throw createError({ statusCode: 404, message: 'Recipe not found' })

  // Resolve the referenced equipment profile (BeerXML EQUIPMENT), if any.
  const equip = recipe.equipmentId
    ? await db.select().from(equipment).where(eq(equipment.id, recipe.equipmentId)).get()
    : undefined

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

  const imported: ImportedRecipe = {
    name: recipe.name,
    type: recipe.type ?? 'All Grain',
    batchSize: recipe.batchSize ?? 0,
    boilSize: recipe.boilSize ?? 0,
    boilTime: recipe.boilTime ?? 0,
    efficiency: recipe.efficiency ?? 0,
    notes: recipe.notes ?? '',
    fermentables: fermentables.map((f) => ({
      name: f.name,
      type: f.type ?? 'Grain',
      amount: f.amount ?? 0,
      yield: f.yield ?? 0,
      color: f.color ?? 0,
      addAfterBoil: f.addAfterBoil ?? false,
      grainType: f.grainType ?? 'Base',
      added: f.added ?? 'Mash',
    })),
    hops: hops.map((h) => ({
      name: h.name,
      amount: h.amount ?? 0,
      alpha: h.alpha ?? 0,
      time: h.time ?? 0,
      use: h.use ?? 'Boil',
      form: h.form ?? 'Pellet',
    })),
    yeasts: yeasts.map((y) => ({
      name: y.name,
      amount: y.amount ?? 0,
      attenuation: y.attenuation ?? 75,
    })),
    miscs: miscs.map((m) => ({
      name: m.name,
      type: m.type ?? 'Other',
      amount: m.amount ?? 0,
      time: m.time ?? 0,
      use: m.use ?? 'Boil',
    })),
    waters: waters.map((w) => ({
      name: w.name,
      amount: w.amount ?? 0,
      calcium: w.calcium ?? 0,
      bicarbonate: w.bicarbonate ?? 0,
      sulfate: w.sulfate ?? 0,
      chloride: w.chloride ?? 0,
      sodium: w.sodium ?? 0,
      magnesium: w.magnesium ?? 0,
    })),
    mashName: recipe.mashName ?? 'Mash',
    grainTemp: recipe.grainTemp ?? 20,
    tunTemp: recipe.tunTemp ?? 20,
    spargeTemp: recipe.spargeTemp ?? 78,
    mashPh: recipe.mashPh ?? 0,
    mashNotes: recipe.mashNotes ?? '',
    mashSteps: mashSteps.map((s) => ({
      name: s.name,
      type: s.type ?? 'Infusion',
      stepTemp: s.stepTemp ?? 65,
      stepTime: s.stepTime ?? 60,
      rampTime: s.rampTime ?? 0,
      infuseAmount: s.infuseAmount ?? 0,
    })),
    equipment: equip
      ? {
          name: equip.name,
          boilSize: equip.boilSize ?? 0,
          batchSize: equip.batchSize ?? 0,
          tunVolume: equip.tunVolume ?? 0,
          tunWeight: equip.tunWeight ?? 0,
          tunSpecificHeat: equip.tunSpecificHeat ?? 0.12,
          topUpWater: equip.topUpWater ?? 0,
          topUpKettle: equip.topUpKettle ?? 0,
          trubChillerLoss: equip.trubChillerLoss ?? 0,
          evapRate: equip.evapRate ?? 10,
          boilTime: equip.boilTime ?? 60,
          lauterDeadspace: equip.lauterDeadspace ?? 0,
          hopUtilization: equip.hopUtilization ?? 100,
          notes: equip.notes ?? '',
        }
      : undefined,
  }

  const xml = generateBeerXml(imported)
  const safeName = (recipe.name || 'recipe').replace(/[^a-z0-9._-]+/gi, '_')

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${safeName}.xml"`)
  return xml
})
