import { eq } from 'drizzle-orm'
import { useDB } from '~/server/db'
import { beerStyles, waters } from '~/server/db/schema'
import { suggestSalts, targetProfileForStyle } from '~/server/utils/calculations/water-suggestions'
import { waterSuggestionMatchStyle } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (value) => waterSuggestionMatchStyle.parse(value))
  const db = useDB()
  const [source, style] = await Promise.all([
    db.select().from(waters).where(eq(waters.id, body.sourceWaterId)).get(),
    db.select().from(beerStyles).where(eq(beerStyles.id, body.styleId)).get(),
  ])

  if (!source) throw createError({ statusCode: 404, message: 'Source water not found' })
  if (!style) throw createError({ statusCode: 404, message: 'Style not found' })

  const targetProfile = targetProfileForStyle(style)
  return {
    targetProfile,
    ...suggestSalts({
      sourceWater: toProfile(source),
      targetProfile,
      mashVolumeL: body.mashVolumeL,
      spargeVolumeL: body.spargeVolumeL,
      gristEbcDistribution: body.gristEbcDistribution,
    }),
  }
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
