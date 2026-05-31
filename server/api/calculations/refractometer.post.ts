import {
  brixToOG,
  brixToFG,
  abvFromBrix,
  attenuationFromBrix,
} from '~/server/utils/calculations/refractometer'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const wcf = body.wcf || 1.04

  const og = brixToOG(body.ogBrix, wcf)
  const fg = body.currentBrix ? brixToFG(body.ogBrix, body.currentBrix, wcf) : 0
  const abv = body.currentBrix ? abvFromBrix(body.ogBrix, body.currentBrix, wcf) : 0
  const attenuation = body.currentBrix ? attenuationFromBrix(body.ogBrix, body.currentBrix, wcf) : 0

  return {
    og: Math.round(og * 10000) / 10000,
    fg: fg ? Math.round(fg * 10000) / 10000 : null,
    abv: abv ? Math.round(abv * 10) / 10 : null,
    attenuation: attenuation ? Math.round(attenuation * 10) / 10 : null,
  }
})
