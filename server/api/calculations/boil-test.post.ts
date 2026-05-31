import { boilTestAbv } from '~/server/utils/calculations'

/**
 * Boil test (Kookproef): determine ABV of a finished beer with a hydrometer.
 * Body: { sgBefore, sgAfter }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const abv = boilTestAbv(Number(body.sgBefore), Number(body.sgAfter))
  return { abv: Math.round(abv * 100) / 100 }
})
