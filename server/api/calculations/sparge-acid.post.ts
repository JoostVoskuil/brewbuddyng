import { spargeAcidForTargetPH, ACID_MEQ_PER_ML } from '~/server/utils/calculations/water'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const bicarbonate: number = body.bicarbonate || 0
  const volumeL: number = body.volumeL || 0
  const targetPH: number = body.targetPH || 5.8
  const acid: keyof typeof ACID_MEQ_PER_ML = body.acid in ACID_MEQ_PER_ML ? body.acid : 'lactic88'

  const result = spargeAcidForTargetPH(bicarbonate, volumeL, targetPH, acid)

  return {
    alkalinity: Math.round(result.alkalinity * 10) / 10,
    targetPH: result.targetPH,
    acidMeq: Math.round(result.acidMeq * 100) / 100,
    acidMl: Math.round(result.acidMl * 100) / 100,
  }
})
