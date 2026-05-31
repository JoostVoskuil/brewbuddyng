import {
  calculateOG,
  estimateFGSimple,
  calculateABV,
  calculateColorEBC,
} from '~/server/utils/calculations'

interface WizardFermentable {
  name: string
  yield: number
  color: number
  percent: number
  addAfterBoil?: boolean
}

/**
 * Grist wizard (BrouwHulp TFrmGristWizard): given a percentage split of the
 * grain bill plus a target OG, batch size, efficiency and attenuation, derive
 * the required weights and the resulting OG, FG, ABV, colour and attenuation.
 * Body: { fermentables, batchSize, targetOg, efficiency, attenuation }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const ferms: WizardFermentable[] = body.fermentables || []
  const batchSize = Number(body.batchSize) || 20
  const targetOg = Number(body.targetOg) || 1.05
  const efficiency = Number(body.efficiency) || 75
  const attenuation = Number(body.attenuation) || 75

  const sum = ferms.reduce((a, f) => a + (Number(f.percent) || 0), 0)
  const targetPoints = (targetOg - 1) * 1000

  let totalWeight = 0
  let k = 0
  if (sum > 0 && batchSize > 0) {
    for (const f of ferms) {
      const eff = f.addAfterBoil ? 100 : efficiency
      const pct = ((Number(f.percent) || 0) / sum) * 100
      k += ((Number(f.yield) || 0) / 100) * (384 / batchSize) * (eff / 100) * (pct / 100)
    }
    if (k > 0) totalWeight = targetPoints / k
  }

  const weighted = ferms.map((f) => {
    const pct = sum > 0 ? ((Number(f.percent) || 0) / sum) * 100 : 0
    return {
      name: f.name,
      yield: Number(f.yield) || 0,
      color: Number(f.color) || 0,
      percent: Math.round(pct * 10) / 10,
      amount: Math.round((pct / 100) * totalWeight * 1000) / 1000,
      addAfterBoil: !!f.addAfterBoil,
    }
  })

  const og = calculateOG(weighted, batchSize, efficiency)
  const fg = estimateFGSimple(og, attenuation)
  const abv = calculateABV(og, fg)
  const color = calculateColorEBC(weighted, batchSize)
  const ogPoints = (og - 1) * 1000
  const fgPoints = (fg - 1) * 1000
  const svg = ogPoints > 0 ? ((ogPoints - fgPoints) / ogPoints) * 100 : 0

  return {
    fermentables: weighted,
    totalWeight: Math.round(totalWeight * 1000) / 1000,
    og: Math.round(og * 10000) / 10000,
    fg: Math.round(fg * 10000) / 10000,
    abv: Math.round(abv * 10) / 10,
    color: Math.round(color),
    attenuation: Math.round(svg * 10) / 10,
  }
})
