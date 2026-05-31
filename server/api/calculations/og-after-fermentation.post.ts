import { ogAfterFermentation, DEFAULT_BRIX_FACTOR } from '~/server/utils/calculations'

/**
 * "OG na gisting" tool: reconstruct OG and ABV of a finished beer from a
 * hydrometer FG reading and a refractometer Brix reading.
 * Body: { fg, brix, brixFactor? }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const brixFactor = body.brixFactor || DEFAULT_BRIX_FACTOR
  const r = ogAfterFermentation(Number(body.fg), Number(body.brix), brixFactor)
  return {
    og: Math.round(r.og * 10000) / 10000,
    abv: Math.round(r.abv * 10) / 10,
  }
})
