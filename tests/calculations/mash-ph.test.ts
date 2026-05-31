import { describe, expect, it } from 'vitest'
import {
  acidMlForTargetPh,
  maltBufferCapacityMeqKgPh,
  predictMashPh,
  protonDeficit,
  zResidualAlkalinity,
  type MashPhInput,
} from '~/server/utils/calculations/mash-ph'

const paleAleMash: MashPhInput = {
  water: {
    calcium: 52,
    magnesium: 8,
    sodium: 18,
    chloride: 45,
    sulfate: 75,
    bicarbonate: 180,
    ph: 7.6,
  },
  mashVolumeL: 18,
  grist: [
    { amountKg: 4.2, colorEbc: 7, grainType: 'Base', added: 'Mash' },
    { amountKg: 0.35, colorEbc: 120, grainType: 'Crystal', added: 'Mash' },
  ],
}

describe('BrouwHulp mash pH port', () => {
  it('uses the original malt buffer-capacity regressions by grain type and EBC', () => {
    expect(maltBufferCapacityMeqKgPh({ amountKg: 1, colorEbc: 7, grainType: 'Base' })).toBeCloseTo(-34.094, 3)
    expect(maltBufferCapacityMeqKgPh({ amountKg: 1, colorEbc: 120, grainType: 'Crystal' })).toBeCloseTo(-39.621, 3)
    expect(maltBufferCapacityMeqKgPh({ amountKg: 1, colorEbc: 900, grainType: 'Roast' })).toBeCloseTo(-45.138, 3)
  })

  it('predicts a deterministic mash pH from water alkalinity and grist distribution', () => {
    const result = predictMashPh(paleAleMash)

    expect(result.predictedPh).toBeCloseTo(5.845, 3)
    expect(result.residualAlkalinityMeqL).toBeCloseTo(1.398, 3)
    expect(result.alkalinityMgLAsCaCO3).toBeCloseTo(147.5, 1)
    expect(result.protonDeficitMeq).toBeCloseTo(0.072, 3)
  })

  it('lowers the pH when lactic acid is added', () => {
    const untreated = predictMashPh(paleAleMash)
    const treated = predictMashPh({ ...paleAleMash, acids: { lactic88Ml: 3 } })

    expect(treated.predictedPh).toBeLessThan(untreated.predictedPh)
    expect(treated.predictedPh).toBeCloseTo(5.646, 3)
  })

  it('calculates acid required to hit a target pH', () => {
    const ml = acidMlForTargetPh(paleAleMash, 5.4, 'lactic88')
    const adjusted: MashPhInput = { ...paleAleMash, acids: { lactic88Ml: ml } }

    expect(ml).toBeCloseTo(6.58, 2)
    expect(protonDeficit(adjusted, 5.4)).toBeCloseTo(0, 1)
  })

  it('reports lower residual alkalinity for calcium-rich water', () => {
    const base = zResidualAlkalinity(paleAleMash.water, 5.4)
    const calciumRich = zResidualAlkalinity({ ...paleAleMash.water, calcium: 150 }, 5.4)

    expect(calciumRich).toBeLessThan(base)
  })
})
