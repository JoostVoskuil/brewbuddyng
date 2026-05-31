import { describe, it, expect } from 'vitest'
import {
  dissolvedCO2,
  forcedCarbonationPSI,
  forcedCarbonationBar,
  primingSugarAmount,
  co2FromPriming,
  packagingCarbonationPlan,
} from '~/server/utils/calculations/carbonation'

describe('carbonation', () => {
  it('dissolved CO2 decreases as temperature rises', () => {
    expect(dissolvedCO2(0)).toBeGreaterThan(dissolvedCO2(20))
  })

  it('forced pressure is zero when target is already dissolved', () => {
    expect(forcedCarbonationPSI(0.5, 0)).toBe(0)
  })

  it('higher target volumes need more pressure', () => {
    expect(forcedCarbonationPSI(3.5, 4)).toBeGreaterThan(forcedCarbonationPSI(3.0, 4))
  })

  it('converts PSI to bar consistently', () => {
    expect(forcedCarbonationBar(2.5, 4)).toBeCloseTo(forcedCarbonationPSI(2.5, 4) * 0.0689476, 6)
  })
})

describe('priming sugar', () => {
  it('needs sugar to reach a target above dissolved CO2', () => {
    expect(primingSugarAmount(2.4, 20, 20, 'sucrose')).toBeGreaterThan(0)
  })

  it('different sugars need different amounts', () => {
    const sucrose = primingSugarAmount(2.4, 20, 20, 'sucrose')
    const dme = primingSugarAmount(2.4, 20, 20, 'dme')
    expect(dme).toBeGreaterThan(sucrose)
  })

  it('priming sugar and CO2 are inverse operations', () => {
    const grams = primingSugarAmount(2.4, 20, 20, 'sucrose')
    expect(co2FromPriming(grams, 20, 20, 'sucrose')).toBeCloseTo(2.4, 5)
  })

  it('builds a packaging carbonation plan', () => {
    const plan = packagingCarbonationPlan(2.6, 18, 19, 'glucose')
    expect(plan.residualCO2).toBeCloseTo(dissolvedCO2(18), 6)
    expect(plan.primingSugarGrams).toBeGreaterThan(0)
    expect(plan.forcedPressureBar).toBeCloseTo(plan.forcedPressurePsi * 0.0689476, 6)
  })
})
