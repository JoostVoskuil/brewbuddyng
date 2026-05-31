import { describe, it, expect } from 'vitest'
import {
  brixToOG,
  brixToFG,
  correctBrix,
  abvFromBrix,
} from '~/server/utils/calculations/refractometer'

describe('refractometer', () => {
  it('applies the wort correction factor', () => {
    expect(correctBrix(12, 1.04)).toBeCloseTo(11.538, 3)
  })

  it('converts a typical Brix reading to a plausible OG', () => {
    const og = brixToOG(12)
    expect(og).toBeGreaterThan(1.04)
    expect(og).toBeLessThan(1.06)
  })

  it('FG accounts for alcohol skewing the refractometer', () => {
    const fg = brixToFG(12, 6)
    expect(fg).toBeGreaterThan(0.99)
    expect(fg).toBeLessThan(1.02)
  })

  it('produces a positive ABV after fermentation', () => {
    expect(abvFromBrix(12, 6)).toBeGreaterThan(0)
  })
})
