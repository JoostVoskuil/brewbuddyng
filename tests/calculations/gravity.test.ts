import { describe, it, expect } from 'vitest'
import {
  sgToPlato,
  platoToSG,
  sgToExtract,
  extractToSG,
  gravityPoints,
  calculateOG,
  estimateFGSimple,
} from '~/server/utils/calculations/gravity'

describe('gravity conversions', () => {
  it('round-trips SG <-> Plato within tolerance', () => {
    const plato = sgToPlato(1.048)
    expect(plato).toBeCloseTo(11.9, 0)
    expect(platoToSG(plato)).toBeCloseTo(1.048, 2)
  })

  it('returns safe values for non-physical input', () => {
    expect(sgToPlato(0)).toBe(0)
    expect(platoToSG(0)).toBe(1.0)
  })

  it('converts SG to/from extract points', () => {
    expect(sgToExtract(1.05)).toBeCloseTo(50, 6)
    expect(extractToSG(50)).toBeCloseTo(1.05, 6)
  })

  it('computes gravity points from a fermentable', () => {
    // 5 kg at 80% yield into 20 L
    expect(gravityPoints(80, 5, 20)).toBeCloseTo(76.8, 1)
    expect(gravityPoints(80, 5, 0)).toBe(0)
  })
})

describe('calculateOG', () => {
  it('returns 1.0 for an empty grain bill', () => {
    expect(calculateOG([], 20, 75)).toBe(1.0)
  })

  it('scales with efficiency', () => {
    const bill = [{ amount: 5, yield: 80 }]
    const low = calculateOG(bill, 20, 60)
    const high = calculateOG(bill, 20, 80)
    expect(high).toBeGreaterThan(low)
  })

  it('treats post-boil additions at 100% efficiency', () => {
    const withSugar = calculateOG([{ amount: 1, yield: 100, addAfterBoil: true }], 20, 50)
    const withGrain = calculateOG([{ amount: 1, yield: 100, addAfterBoil: false }], 20, 50)
    expect(withSugar).toBeGreaterThan(withGrain)
  })

  it('guards against zero batch size', () => {
    expect(calculateOG([{ amount: 5, yield: 80 }], 0, 75)).toBe(1.0)
  })
})

describe('estimateFGSimple', () => {
  it('drops gravity according to attenuation', () => {
    const fg = estimateFGSimple(1.05, 75)
    expect(fg).toBeCloseTo(1.0125, 3)
  })

  it('returns OG when attenuation is zero', () => {
    expect(estimateFGSimple(1.05, 0)).toBeCloseTo(1.05, 6)
  })
})
