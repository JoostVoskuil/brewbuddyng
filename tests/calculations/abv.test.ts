import { describe, it, expect } from 'vitest'
import {
  calculateABV,
  calculateABW,
  realExtract,
  apparentAttenuation,
  realAttenuation,
  calculateCalories,
} from '~/server/utils/calculations/abv'

describe('ABV', () => {
  it('uses the standard 131.25 formula', () => {
    expect(calculateABV(1.05, 1.01)).toBeCloseTo(5.25, 2)
  })

  it('returns 0 for non-physical input', () => {
    expect(calculateABV(1.0, 1.0)).toBe(0)
    expect(calculateABV(0.99, 1.01)).toBe(0)
  })

  it('derives ABW from ABV', () => {
    expect(calculateABW(1.05, 1.01)).toBeCloseTo(calculateABV(1.05, 1.01) * 0.794, 6)
  })
})

describe('attenuation', () => {
  it('computes apparent attenuation', () => {
    expect(apparentAttenuation(1.05, 1.01)).toBeCloseTo(80, 0)
  })

  it('real attenuation is lower than apparent', () => {
    expect(realAttenuation(1.05, 1.01)).toBeLessThan(apparentAttenuation(1.05, 1.01))
  })

  it('guards against zero original extract', () => {
    expect(apparentAttenuation(1.0, 1.0)).toBe(0)
  })
})

describe('realExtract & calories', () => {
  it('real extract is between OG and FG plato', () => {
    const re = realExtract(1.05, 1.01)
    expect(re).toBeGreaterThan(0)
    expect(re).toBeLessThan(13)
  })

  it('returns a positive rounded calorie count', () => {
    const cal = calculateCalories(1.05, 1.01)
    expect(cal).toBeGreaterThan(0)
    expect(Number.isInteger(cal)).toBe(true)
  })
})
