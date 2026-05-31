import { eq } from 'drizzle-orm'
import { useDB } from '~/server/db'
import { waters } from '~/server/db/schema'
import { suggestSalts } from '~/server/utils/calculations/water-suggestions'
import { waterSuggestionMatchProfile } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (value) => waterSuggestionMatchProfile.parse(value))
  const db = useDB()
  const [source, target] = await Promise.all([
    db.select().from(waters).where(eq(waters.id, body.sourceWaterId)).get(),
    db.select().from(waters).where(eq(waters.id, body.targetProfileId)).get(),
  ])

  if (!source) throw createError({ statusCode: 404, message: 'Source water not found' })
  if (!target) throw createError({ statusCode: 404, message: 'Target water profile not found' })

  return suggestSalts({
    sourceWater: toProfile(source),
    targetProfile: toProfile(target),
    mashVolumeL: body.mashVolumeL,
    spargeVolumeL: body.spargeVolumeL,
    gristEbcDistribution: body.gristEbcDistribution,
  })
})

function toProfile(row: typeof waters.$inferSelect) {
  return {
    calcium: row.calcium ?? 0,
    magnesium: row.magnesium ?? 0,
    sodium: row.sodium ?? 0,
    chloride: row.chloride ?? 0,
    sulfate: row.sulfate ?? 0,
    bicarbonate: row.bicarbonate ?? 0,
    ph: row.ph ?? 7,
  }
}
