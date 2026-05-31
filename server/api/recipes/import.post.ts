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
import { parseBeerXml } from '~/server/utils/recipe-io/beerxml'
import { parseProMash, looksLikeProMash } from '~/server/utils/recipe-io/promash'
import type { ImportedRecipe, ImportedEquipment } from '~/server/utils/recipe-io/types'
import { sql } from 'drizzle-orm'

/**
 * Import one or more recipes from an uploaded recipe file. The raw text is
 * sent as the request body. Two formats are auto-detected:
 *   - BeerXML / BrouwHulp XML (a `<RECIPES>`/`<RECIPE>` document)
 *   - ProMash text recipe export ("Recipe Report")
 * Every recipe found is inserted with its ingredient child rows. Returns the
 * ids and names of the created recipes.
 */
export default defineEventHandler(async (event) => {
  const raw = await readRawBody(event, 'utf-8')
  if (!raw || !raw.trim()) {
    throw createError({ statusCode: 400, message: 'Empty request body' })
  }

  const isXml = /<\s*RECIPES?\b/i.test(raw)
  let parsed: ImportedRecipe[]
  try {
    if (!isXml && looksLikeProMash(raw)) {
      parsed = parseProMash(raw)
    } else {
      parsed = parseBeerXml(raw)
    }
  } catch (err) {
    throw createError({
      statusCode: 400,
      message: `Could not parse recipe file: ${(err as Error).message}`,
    })
  }

  if (parsed.length === 0) {
    throw createError({ statusCode: 400, message: 'No recipes found in file' })
  }

  const db = useDB()
  const now = new Date().toISOString()
  const created: { id: number; name: string }[] = []

  /**
   * Resolve an embedded BeerXML EQUIPMENT record to an equipment id: reuse an
   * existing profile with the same name (case-insensitive) or create one.
   */
  async function resolveEquipmentId(e: ImportedEquipment): Promise<number | null> {
    const name = e.name.trim()
    if (!name) return null
    const existing = await db
      .select()
      .from(equipment)
      .where(sql`lower(${equipment.name}) = ${name.toLowerCase()}`)
      .get()
    if (existing) return existing.id
    const [row] = await db
      .insert(equipment)
      .values({
        name,
        boilSize: e.boilSize,
        batchSize: e.batchSize,
        tunVolume: e.tunVolume,
        tunWeight: e.tunWeight,
        tunSpecificHeat: e.tunSpecificHeat,
        topUpWater: e.topUpWater,
        topUpKettle: e.topUpKettle,
        trubChillerLoss: e.trubChillerLoss,
        evapRate: e.evapRate,
        boilTime: e.boilTime,
        lauterDeadspace: e.lauterDeadspace,
        hopUtilization: e.hopUtilization,
        notes: e.notes,
      })
      .returning()
    return row?.id ?? null
  }

  for (const r of parsed) {
    const equipmentId = r.equipment ? await resolveEquipmentId(r.equipment) : null
    const [recipe] = await db
      .insert(recipes)
      .values({
        name: r.name,
        type: r.type,
        batchSize: r.batchSize,
        boilSize: r.boilSize,
        boilTime: r.boilTime,
        efficiency: r.efficiency,
        equipmentId,
        notes: r.notes,
        mashName: r.mashName ?? '',
        grainTemp: r.grainTemp ?? 20,
        tunTemp: r.tunTemp ?? 20,
        spargeTemp: r.spargeTemp ?? 78,
        mashPh: r.mashPh ?? 0,
        mashNotes: r.mashNotes ?? '',
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    if (!recipe) throw createError({ statusCode: 500, message: 'Insert failed' })
    const recipeId = recipe.id

    if (r.fermentables.length) {
      await db.insert(recipeFermentables).values(r.fermentables.map((f) => ({ ...f, recipeId })))
    }
    if (r.hops.length) {
      await db.insert(recipeHops).values(r.hops.map((h) => ({ ...h, recipeId })))
    }
    if (r.yeasts.length) {
      await db.insert(recipeYeasts).values(r.yeasts.map((y) => ({ ...y, recipeId })))
    }
    if (r.miscs.length) {
      await db.insert(recipeMiscs).values(r.miscs.map((m) => ({ ...m, recipeId })))
    }
    if (r.waters.length) {
      await db.insert(recipeWaters).values(r.waters.map((w) => ({ ...w, recipeId })))
    }
    if (r.mashSteps?.length) {
      await db.insert(recipeMashSteps).values(
        r.mashSteps.map((s, i) => ({
          name: s.name,
          type: s.type,
          stepTemp: s.stepTemp,
          stepTime: s.stepTime,
          rampTime: s.rampTime,
          infuseAmount: s.infuseAmount,
          sortOrder: i,
          recipeId,
        })),
      )
    }

    created.push({ id: recipeId, name: recipe.name })
  }

  setResponseStatus(event, 201)
  return { imported: created.length, recipes: created }
})
