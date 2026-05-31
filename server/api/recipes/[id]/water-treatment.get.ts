import { eq, sql } from 'drizzle-orm'
import { useDB } from '~/server/db'
import { recipeFermentables, recipeMashSteps, recipes, waters } from '~/server/db/schema'

interface TreatmentRow {
  recipe_id: number
  source_water_id: number | null
  target_water_id: number | null
  source_profile: string | null
  target_profile: string | null
  mash_volume_l: number | null
  sparge_volume_l: number | null
  mash_additions: string | null
  sparge_additions: string | null
  acids: string | null
  created_at: string | null
  updated_at: string | null
}

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0)
    throw createError({ statusCode: 400, message: 'Invalid id' })

  const db = useDB()
  await ensureRecipeWaterTreatmentTable(db)

  const recipe = await db.select().from(recipes).where(eq(recipes.id, id)).get()
  if (!recipe) throw createError({ statusCode: 404, message: 'Recipe not found' })

  const [row, defaultWater, grist, mashSteps] = await Promise.all([
    db.get(sql`SELECT * FROM recipe_water_treatment WHERE recipe_id = ${id}`) as Promise<
      TreatmentRow | undefined
    >,
    db.select().from(waters).where(eq(waters.isDefault, true)).get(),
    db.select().from(recipeFermentables).where(eq(recipeFermentables.recipeId, id)).all(),
    db.select().from(recipeMashSteps).where(eq(recipeMashSteps.recipeId, id)).all(),
  ])

  const mashVolume = mashSteps.reduce((sum, step) => sum + Math.max(0, step.infuseAmount ?? 0), 0)
  const gristKg = grist.reduce((sum, item) => sum + Math.max(0, item.amount ?? 0), 0)
  const fallbackMashVolume = mashVolume > 0 ? mashVolume : gristKg > 0 ? gristKg * 3.5 : 20

  return {
    treatment: row ? mapRow(row) : null,
    defaults: {
      sourceWaterId: defaultWater?.id ?? null,
      mashVolumeL: fallbackMashVolume,
      spargeVolumeL: Math.max(0, (recipe.boilSize ?? recipe.batchSize ?? 0) - fallbackMashVolume),
    },
    recipeStyleId: recipe.styleId ?? null,
    grist: grist.map((item) => ({
      amountKg: item.amount ?? 0,
      colorEbc: item.color ?? 0,
      grainType: item.grainType ?? 'Base',
      added: item.added ?? 'Mash',
    })),
  }
})

async function ensureRecipeWaterTreatmentTable(db: ReturnType<typeof useDB>) {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS recipe_water_treatment (
      recipe_id INTEGER PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
      source_water_id INTEGER REFERENCES waters(id),
      target_water_id INTEGER REFERENCES waters(id),
      source_profile TEXT,
      target_profile TEXT,
      mash_volume_l REAL DEFAULT 0,
      sparge_volume_l REAL DEFAULT 0,
      mash_additions TEXT NOT NULL DEFAULT '{}',
      sparge_additions TEXT NOT NULL DEFAULT '{}',
      acids TEXT NOT NULL DEFAULT '{}',
      created_at TEXT DEFAULT '',
      updated_at TEXT DEFAULT ''
    )
  `)
}

function mapRow(row: TreatmentRow) {
  return {
    recipeId: row.recipe_id,
    sourceWaterId: row.source_water_id,
    targetWaterId: row.target_water_id,
    sourceProfile: parseJson(row.source_profile),
    targetProfile: parseJson(row.target_profile),
    mashVolumeL: row.mash_volume_l ?? 0,
    spargeVolumeL: row.sparge_volume_l ?? 0,
    mashAdditions: parseJson(row.mash_additions),
    spargeAdditions: parseJson(row.sparge_additions),
    acids: parseJson(row.acids),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function parseJson(value: string | null) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
