import { eq, sql } from 'drizzle-orm'
import { useDB } from '~/server/db'
import { recipes } from '~/server/db/schema'
import { recipeWaterTreatmentUpsert } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, message: 'Invalid id' })

  const body = await readValidatedBody(event, (value) => recipeWaterTreatmentUpsert.parse(value))
  const db = useDB()
  await ensureRecipeWaterTreatmentTable(db)

  const recipe = await db.select().from(recipes).where(eq(recipes.id, id)).get()
  if (!recipe) throw createError({ statusCode: 404, message: 'Recipe not found' })

  const now = new Date().toISOString()
  await db.run(sql`
    INSERT INTO recipe_water_treatment (
      recipe_id,
      source_water_id,
      target_water_id,
      source_profile,
      target_profile,
      mash_volume_l,
      sparge_volume_l,
      mash_additions,
      sparge_additions,
      acids,
      created_at,
      updated_at
    ) VALUES (
      ${id},
      ${body.sourceWaterId ?? null},
      ${body.targetWaterId ?? null},
      ${JSON.stringify(body.sourceProfile ?? null)},
      ${JSON.stringify(body.targetProfile ?? null)},
      ${body.mashVolumeL},
      ${body.spargeVolumeL},
      ${JSON.stringify(body.mashAdditions)},
      ${JSON.stringify(body.spargeAdditions)},
      ${JSON.stringify(body.acids)},
      ${now},
      ${now}
    )
    ON CONFLICT(recipe_id) DO UPDATE SET
      source_water_id = excluded.source_water_id,
      target_water_id = excluded.target_water_id,
      source_profile = excluded.source_profile,
      target_profile = excluded.target_profile,
      mash_volume_l = excluded.mash_volume_l,
      sparge_volume_l = excluded.sparge_volume_l,
      mash_additions = excluded.mash_additions,
      sparge_additions = excluded.sparge_additions,
      acids = excluded.acids,
      updated_at = excluded.updated_at
  `)

  return {
    success: true,
    recipeId: id,
    ...body,
    updatedAt: now,
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
