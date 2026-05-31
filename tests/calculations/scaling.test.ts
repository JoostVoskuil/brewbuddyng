import { describe, it, expect } from 'vitest'
import {
  volumeScaleFactor,
  scaleAmount,
  ibuScaleFactor,
} from '~/server/utils/calculations/scaling'

describe('recipe scaling', () => {
  it('doubles amounts when doubling the batch volume', () => {
    const f = volumeScaleFactor(20, 40)
    expect(f).toBeCloseTo(2, 6)
    expect(scaleAmount(5, f)).toBeCloseTo(10, 6)
  })

  it('halves amounts when halving the batch volume', () => {
    const f = volumeScaleFactor(20, 10)
    expect(scaleAmount(4, f)).toBeCloseTo(2, 6)
  })

  it('keeps amounts unchanged when the volume is the same', () => {
    expect(volumeScaleFactor(23, 23)).toBeCloseTo(1, 6)
  })

  it('guards against non-positive volumes', () => {
    expect(volumeScaleFactor(0, 20)).toBe(1)
    expect(volumeScaleFactor(20, 0)).toBe(1)
  })

  it('rounds scaled amounts to 4 decimals', () => {
    expect(scaleAmount(1, 1 / 3)).toBeCloseTo(0.3333, 4)
  })
})

describe('target IBU adjustment', () => {
  it('scales hops up to reach a higher target IBU', () => {
    expect(ibuScaleFactor(20, 40)).toBeCloseTo(2, 6)
  })

  it('scales hops down to reach a lower target IBU', () => {
    expect(ibuScaleFactor(40, 20)).toBeCloseTo(0.5, 6)
  })

  it('returns 1 for non-positive inputs', () => {
    expect(ibuScaleFactor(0, 30)).toBe(1)
    expect(ibuScaleFactor(30, 0)).toBe(1)
  })
})
