import { describe, it, expect } from 'vitest'
import {
  acidBaseForTargetPH,
  acidForSpargeWater,
  chlorideToSulfateRatio,
  estimateMashPH,
  mashPhBand,
  strikeTemp,
  type WaterProfile,
} from '~/server/utils/calculations/water'

const highAlkalinityWater: WaterProfile = {
  calcium: 50,
  magnesium: 10,
  sodium: 15,
  chloride: 40,
  sulfate: 60,
  bicarbonate: 250,
}

const lowAlkalinityWater: WaterProfile = {
  calcium: 80,
  magnesium: 5,
  sodium: 5,
  chloride: 50,
  sulfate: 120,
  bicarbonate: 20,
}

describe('strikeTemp', () => {
  it('warms strike water above the target mash rest for cool grain', () => {
    expect(strikeTemp(5, 20, 3, 67)).toBeCloseTo(73.42, 2)
  })

  it('returns the mash target when there is no grain or water ratio', () => {
    expect(strikeTemp(0, 20, 3, 67)).toBe(67)
    expect(strikeTemp(5, 20, 0, 67)).toBe(67)
  })
})

describe('chloride/sulfate and mash pH helpers', () => {
  it('uses the BrouwHulp sulfate-to-chloride convention', () => {
    expect(chlorideToSulfateRatio({ sulfate: 200, chloride: 50 })).toBe(4)
    expect(chlorideToSulfateRatio({ sulfate: 50, chloride: 100 })).toBe(0.5)
  })

  it('classifies the 5.2-5.6 target mash pH band', () => {
    expect(mashPhBand(5.1)).toBe('low')
    expect(mashPhBand(5.2)).toBe('target')
    expect(mashPhBand(5.6)).toBe('target')
    expect(mashPhBand(5.7)).toBe('high')
  })
})

describe('sparge-water acid', () => {
  it('scales acid with residual alkalinity and sparge volume', () => {
    const small = acidForSpargeWater(highAlkalinityWater, 10, 5.6, 'lactic88')
    const large = acidForSpargeWater(highAlkalinityWater, 20, 5.6, 'lactic88')
    const low = acidForSpargeWater(lowAlkalinityWater, 10, 5.6, 'lactic88')

    expect(small.amountMl).toBeGreaterThan(0)
    expect(large.amountMl).toBeCloseTo(small.amountMl * 2, 6)
    expect(low.amountMl).toBeLessThan(small.amountMl)
  })

  it('uses smaller volumes for stronger phosphoric acid and grams for acid malt', () => {
    const lactic = acidForSpargeWater(highAlkalinityWater, 15, 5.6, 'lactic88')
    const phosphoric = acidForSpargeWater(highAlkalinityWater, 15, 5.6, 'phosphoric75')
    const acidMalt = acidForSpargeWater(highAlkalinityWater, 15, 5.6, 'acidMalt')

    expect(phosphoric.amountMl).toBeLessThan(lactic.amountMl)
    expect(acidMalt.amountMl).toBe(0)
    expect(acidMalt.amountGrams).toBeGreaterThan(0)
  })
})

describe('acid/base to target pH', () => {
  it('recommends acid when the estimated pH is above target', () => {
    const current = estimateMashPH(highAlkalinityWater, 10, 30)
    const result = acidBaseForTargetPH(highAlkalinityWater, 10, 30, 5.4)
    expect(current).toBeGreaterThan(5.4)
    expect(result.acidMl).toBeGreaterThan(0)
    expect(result.bakingSodaGrams).toBe(0)
    expect(result.currentPH).toBeCloseTo(current, 6)
  })

  it('scales acid with mash volume', () => {
    const small = acidBaseForTargetPH(highAlkalinityWater, 10, 20, 5.4)
    const large = acidBaseForTargetPH(highAlkalinityWater, 10, 40, 5.4)
    expect(large.acidMl).toBeGreaterThan(small.acidMl)
  })

  it('recommends baking soda when target is above the estimated pH', () => {
    const current = estimateMashPH(lowAlkalinityWater, 5, 30)
    const result = acidBaseForTargetPH(lowAlkalinityWater, 5, 30, current + 0.3)
    expect(result.bakingSodaGrams).toBeGreaterThan(0)
    expect(result.acidMl).toBe(0)
  })

  it('uses a stronger acid in smaller amounts', () => {
    const lactic = acidBaseForTargetPH(highAlkalinityWater, 10, 30, 5.4, 'lactic88')
    const phosphoricWeak = acidBaseForTargetPH(highAlkalinityWater, 10, 30, 5.4, 'phosphoric10')
    expect(phosphoricWeak.acidMl).toBeGreaterThan(lactic.acidMl)
  })
})
