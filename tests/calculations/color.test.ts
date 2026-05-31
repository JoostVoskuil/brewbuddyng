import { describe, it, expect } from 'vitest'
import {
  srmToEBC,
  ebcToSRM,
  lovibondToSRM,
  srmToLovibond,
  calculateColorSRM,
  calculateColorEBC,
  srmToRGB,
} from '~/server/utils/calculations/color'

describe('color conversions', () => {
  it('round-trips SRM <-> EBC', () => {
    expect(ebcToSRM(srmToEBC(10))).toBeCloseTo(10, 6)
  })

  it('round-trips SRM <-> Lovibond', () => {
    expect(srmToLovibond(lovibondToSRM(8))).toBeCloseTo(8, 6)
  })
})

describe('calculateColorSRM', () => {
  it('returns 0 for empty bill or zero volume', () => {
    expect(calculateColorSRM([], 20)).toBe(0)
    expect(calculateColorSRM([{ amount: 5, color: 8 }], 0)).toBe(0)
  })

  it('darker malt yields higher SRM', () => {
    const pale = calculateColorSRM([{ amount: 5, color: 6 }], 20)
    const dark = calculateColorSRM([{ amount: 5, color: 600 }], 20)
    expect(dark).toBeGreaterThan(pale)
  })

  it('supports the three documented methods', () => {
    const bill = [{ amount: 5, color: 50 }]
    const morey = calculateColorSRM(bill, 20, 'morey')
    const mosher = calculateColorSRM(bill, 20, 'mosher')
    const daniels = calculateColorSRM(bill, 20, 'daniels')
    for (const v of [morey, mosher, daniels]) {
      expect(v).toBeGreaterThan(0)
      expect(Number.isFinite(v)).toBe(true)
    }
  })

  it('EBC result equals SRM * 1.97', () => {
    const bill = [{ amount: 5, color: 50 }]
    expect(calculateColorEBC(bill, 20)).toBeCloseTo(srmToEBC(calculateColorSRM(bill, 20)), 6)
  })
})

describe('srmToRGB', () => {
  it('produces a valid hex colour', () => {
    expect(srmToRGB(10)).toMatch(/^#[0-9a-f]{6}$/)
  })
})
