import { acidBaseForTargetPH, type WaterProfile } from '~/server/utils/calculations/water'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const water: WaterProfile = {
    calcium: body.calcium ?? 0,
    magnesium: body.magnesium ?? 0,
    sodium: body.sodium ?? 0,
    chloride: body.chloride ?? 0,
    sulfate: body.sulfate ?? 0,
    bicarbonate: body.bicarbonate ?? 0,
  }
  const result = acidBaseForTargetPH(
    water,
    body.grainColorEBC ?? 10,
    body.volumeL ?? 30,
    body.targetPH ?? 5.4,
    body.acid ?? 'lactic88',
  )
  return {
    currentPH: Number(result.currentPH.toFixed(2)),
    targetPH: Number(result.targetPH.toFixed(2)),
    acidMl: Number(result.acidMl.toFixed(2)),
    bakingSodaGrams: Number(result.bakingSodaGrams.toFixed(2)),
  }
})
