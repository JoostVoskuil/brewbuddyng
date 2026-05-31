import { infusionVolume } from '~/server/utils/calculations/temperature'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const targetTempC: number = body.targetTempC
  const currentTempC: number = body.currentTempC
  const grainWeightKg: number = body.grainWeightKg
  const currentWaterL: number = body.currentWaterL
  const infusionWaterTempC: number = body.infusionWaterTempC ?? 100

  const liters = infusionVolume(
    targetTempC,
    currentTempC,
    grainWeightKg,
    currentWaterL,
    infusionWaterTempC,
  )

  return {
    liters: Math.round(liters * 100) / 100,
  }
})
