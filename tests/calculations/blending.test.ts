import { describe, it, expect } from 'vitest'
import {
  blendGravity,
  blendVolumeWeighted,
  totalBlendVolume,
} from '~/server/utils/calculations/blending'

describe('blending', () => {
  it('sums the volumes', () => {
    expect(
      totalBlendVolume([
        { sg: 1.05, volume: 10 },
        { sg: 1.07, volume: 5 },
      ]),
    ).toBe(15)
  })

  it('blends gravity by volume', () => {
    // 10 L @ 1.040 (40 pts) + 10 L @ 1.060 (60 pts) -> 50 pts -> 1.050
    expect(
      blendGravity([
        { sg: 1.04, volume: 10 },
        { sg: 1.06, volume: 10 },
      ]),
    ).toBeCloseTo(1.05, 4)
  })

  it('weights unequal volumes correctly', () => {
    // 30 L @ 1.050 + 10 L @ 1.090 -> (50*30 + 90*10)/40 = 60 -> 1.060
    expect(
      blendGravity([
        { sg: 1.05, volume: 30 },
        { sg: 1.09, volume: 10 },
      ]),
    ).toBeCloseTo(1.06, 4)
  })

  it('returns 1.0 for empty blends', () => {
    expect(blendGravity([])).toBe(1.0)
  })

  it('computes a volume-weighted property average', () => {
    // IBU 20 over 30 L + IBU 60 over 10 L -> (20*30+60*10)/40 = 30
    expect(
      blendVolumeWeighted([
        { value: 20, volume: 30 },
        { value: 60, volume: 10 },
      ]),
    ).toBeCloseTo(30, 6)
  })
})
