import { useDB } from '~/server/db'
import { brews, brewMeasurements } from '~/server/db/schema'
import { parseTControlLog } from '~/server/utils/recipe-io/tcontrol'
import { eq } from 'drizzle-orm'

/**
 * Import a TControl fermentation-controller log (`.lvm`) into a brew's
 * measurements (BrouwHulp "Importeer TControl"). The raw log text is sent as the
 * request body. Existing measurements for the brew are replaced with the parsed
 * samples. The brew's actual OG (falling back to 0) is used to convert the log's
 * SVG column into specific gravity.
 */
export default defineEventHandler(async (event) => {
  const db = useDB()
  const brewId = Number(getRouterParam(event, 'brewId'))
  if (!Number.isInteger(brewId) || brewId <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid brew id' })
  }

  const brew = await db.select().from(brews).where(eq(brews.id, brewId)).get()
  if (!brew) throw createError({ statusCode: 404, message: 'Brew not found' })

  const raw = await readRawBody(event, 'utf-8')
  if (!raw || !raw.trim()) {
    throw createError({ statusCode: 400, message: 'Empty request body' })
  }

  let samples
  try {
    samples = parseTControlLog(raw, brew.ogActual ?? 0)
  } catch (err) {
    throw createError({
      statusCode: 400,
      message: `Could not parse TControl log: ${(err as Error).message}`,
    })
  }

  if (samples.length === 0) {
    throw createError({ statusCode: 400, message: 'No measurements found in log' })
  }

  // Replace existing measurements with the imported samples.
  await db.delete(brewMeasurements).where(eq(brewMeasurements.brewId, brewId))
  await db.insert(brewMeasurements).values(
    samples.map((s) => ({
      brewId,
      datetime: s.datetime,
      sg: s.sg,
      tempS1: s.tempS1,
      tempS2: s.tempS2,
      co2: s.co2,
      setTemp: s.setTemp,
      coolingPower: s.coolingPower,
      coolingOn: s.coolingOn,
      heatingOn: s.heatingOn,
      seriesTag: 'tcontrol',
      notes: '',
    })),
  )

  return { imported: samples.length }
})
