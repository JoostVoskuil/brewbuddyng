import { hopAlphaAfterAging, hopAlphaPercentLost } from '~/server/utils/calculations/hops'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const params = {
    alpha: body.alpha ?? 5,
    days: body.days ?? 180,
    storageFactor: body.storageFactor ?? 1,
    percentLostSixMonths: body.percentLostSixMonths ?? 35,
  }
  return {
    agedAlpha: Number(hopAlphaAfterAging(params).toFixed(2)),
    percentLost: Number(hopAlphaPercentLost(params).toFixed(1)),
  }
})
