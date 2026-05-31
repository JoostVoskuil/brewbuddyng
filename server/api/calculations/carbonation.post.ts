import {
  forcedCarbonationPSI,
  forcedCarbonationBar,
  primingSugarAmount,
  dissolvedCO2,
} from '~/server/utils/calculations/carbonation'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (body.mode === 'forced') {
    const psi = forcedCarbonationPSI(body.volumesCO2, body.tempC)
    const bar = forcedCarbonationBar(body.volumesCO2, body.tempC)
    return {
      psi: Math.round(psi * 10) / 10,
      bar: Math.round(bar * 100) / 100,
      dissolved: Math.round(dissolvedCO2(body.tempC) * 100) / 100,
    }
  }

  // Priming mode
  const sugar = primingSugarAmount(
    body.volumesCO2,
    body.tempC,
    body.beerVolumeL,
    body.sugarType || 'sucrose',
  )
  return {
    sugarGrams: Math.round(sugar * 10) / 10,
    sugarPerBottle: Math.round((sugar / (body.beerVolumeL / 0.33)) * 10) / 10,
    dissolved: Math.round(dissolvedCO2(body.tempC) * 100) / 100,
  }
})
