import { convertWort, convertBeerFromBrix, DEFAULT_BRIX_FACTOR } from '~/server/utils/calculations'

/**
 * SG / Plato / Brix converter (BrouwHulp "SG, Brix, Plato" tool).
 * Body: { value, unit: 'sg'|'plato'|'brix', beerBrix?, brixFactor? }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const brixFactor = body.brixFactor || DEFAULT_BRIX_FACTOR
  const unit: 'sg' | 'plato' | 'brix' = body.unit || 'sg'
  const value = Number(body.value)

  const wort = convertWort(value, unit, brixFactor)

  let beer = null
  if (body.beerBrix !== undefined && body.beerBrix !== null && body.beerBrix !== '') {
    const b = convertBeerFromBrix(wort.brix, Number(body.beerBrix), brixFactor)
    beer = {
      fg: Math.round(b.fg * 10000) / 10000,
      plato: Math.round(b.plato * 10) / 10,
      brix: Math.round(b.brix * 10) / 10,
      abv: Math.round(b.abv * 10) / 10,
      attenuation: Math.round(b.attenuation * 10) / 10,
    }
  }

  return {
    wort: {
      sg: Math.round(wort.sg * 10000) / 10000,
      plato: Math.round(wort.plato * 10) / 10,
      brix: Math.round(wort.brix * 10) / 10,
    },
    beer,
  }
})
