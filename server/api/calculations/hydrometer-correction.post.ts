import { hydrometerCorrection } from '~/server/utils/calculations/temperature'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const sg: number = body.sg
  const tempC: number = body.tempC
  const calibrationTempC: number = body.calibrationTempC ?? 20

  const corrected = hydrometerCorrection(sg, tempC, calibrationTempC)

  return {
    corrected: Math.round(corrected * 1000) / 1000,
  }
})
