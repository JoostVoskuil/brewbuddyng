import { describe, expect, it } from 'vitest'
import { planHopWizard, planMaltWizard, planWaterWizard } from '~/server/utils/calculations/wizard'
import { calculateTotalIBU } from '~/server/utils/calculations/ibu'
import { calculateOG } from '~/server/utils/calculations/gravity'

const water = {
  calcium: 20,
  magnesium: 5,
  sodium: 10,
  chloride: 25,
  sulfate: 30,
  bicarbonate: 80,
}

describe('wizard calculations', () => {
  it('plans hop additions close to the target IBU', () => {
    const additions = planHopWizard({
      targetIbu: 35,
      batchSize: 20,
      boilSize: 25,
      og: 1.05,
      alpha: 6,
      form: 'pellet',
      proportions: { bittering: 60, flavour: 30, aroma: 10 },
    })
    const total = calculateTotalIBU(
      additions.map((h) => ({
        amount: h.amount,
        alpha: h.alpha,
        time: h.time,
        use: h.use.toLowerCase() === 'aroma' ? 'aroma' : 'boil',
        form: h.form.toLowerCase() as 'pellet',
      })),
      { og: 1.05, batchSize: 20, boilSize: 25 },
    )
    expect(total).toBeCloseTo(35, 0)
  })

  it('plans a grain bill that hits target OG', () => {
    const fermentables = planMaltWizard({
      targetOg: 1.055,
      batchSize: 20,
      efficiency: 75,
      proportions: { base: 85, caramel: 10, roast: 2, specialty: 3 },
    })
    const og = calculateOG(fermentables, 20, 75)
    expect(og).toBeCloseTo(1.055, 3)
  })

  it('blends water and recommends non-negative salt additions', () => {
    const result = planWaterWizard({
      sourceA: water,
      sourceB: { calcium: 0, magnesium: 0, sodium: 0, chloride: 0, sulfate: 0, bicarbonate: 0 },
      sourceAPercent: 50,
      volumeL: 30,
      target: { calcium: 80, magnesium: 10, sodium: 25, chloride: 90, sulfate: 140, bicarbonate: 100 },
    })
    expect(result.blended.calcium).toBe(10)
    expect(Object.values(result.additions).every((value) => value >= 0)).toBe(true)
    expect(result.finalProfile.calcium).toBeGreaterThan(result.blended.calcium)
  })
})
