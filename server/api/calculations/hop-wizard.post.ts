import {
  calculateTotalIBU,
  calculateHopAmount,
  type HopAddition,
} from '~/server/utils/calculations/ibu'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (body.mode === 'amount') {
    // Calculate required amount for target IBU
    const amount = calculateHopAmount(
      body.targetIBU,
      body.alpha,
      body.time,
      body.use || 'boil',
      body.form || 'pellet',
      { og: body.og, batchSize: body.batchSize, boilSize: body.boilSize },
      body.method || 'tinseth',
    )
    return { amount: Math.round(amount * 10) / 10 }
  }

  // Calculate IBU from hop additions
  const hops: HopAddition[] = body.hops || []
  const ibu = calculateTotalIBU(
    hops,
    {
      og: body.og,
      batchSize: body.batchSize,
      boilSize: body.boilSize,
    },
    body.method || 'tinseth',
  )

  return { ibu: Math.round(ibu * 10) / 10 }
})
