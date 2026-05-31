import {
  calculateAdditions,
  residualAlkalinity,
  ionBalance,
  sulfateChlorideRatio,
  type WaterProfile,
  type WaterAdditions,
} from '~/server/utils/calculations/water'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const source: WaterProfile = body.source
  const additions: WaterAdditions = body.additions
  const volumeL: number = body.volumeL || 20

  const result = calculateAdditions(source, additions, volumeL)
  const ra = residualAlkalinity(result)
  const balance = ionBalance(result)
  const ratio = sulfateChlorideRatio(result)

  return {
    profile: result,
    residualAlkalinity: Math.round(ra * 10) / 10,
    ionBalance: Math.round(balance * 10) / 10,
    sulfateChlorideRatio: Math.round(ratio * 100) / 100,
  }
})
