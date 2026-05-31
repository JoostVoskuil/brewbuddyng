import { describe, it, expect } from 'vitest'
import {
  alphaRemainingFraction,
  hopAlphaAfterAging,
  hopAlphaPercentLost,
} from '~/server/utils/calculations/hops'

describe('hop aging', () => {
  it('returns the full alpha at day zero', () => {
    expect(hopAlphaAfterAging({ alpha: 10, days: 0 })).toBeCloseTo(10, 6)
    expect(alphaRemainingFraction({ alpha: 10, days: 0 })).toBeCloseTo(1, 6)
  })

  it('loses the reference percentage after six months at reference storage', () => {
    // 35% lost over 182.5 days at storageFactor 1 -> 65% remaining
    expect(hopAlphaAfterAging({ alpha: 10, days: 182.5, percentLostSixMonths: 35 })).toBeCloseTo(
      6.5,
      4,
    )
  })

  it('decays slower with a lower storage factor', () => {
    const warm = hopAlphaAfterAging({ alpha: 10, days: 365, storageFactor: 1 })
    const frozen = hopAlphaAfterAging({ alpha: 10, days: 365, storageFactor: 0.25 })
    expect(frozen).toBeGreaterThan(warm)
  })

  it('compounds the loss over a full year', () => {
    // After one year (two reference periods) -> 0.65^2 of original
    expect(alphaRemainingFraction({ days: 365, alpha: 1, percentLostSixMonths: 35 })).toBeCloseTo(
      0.65 * 0.65,
      4,
    )
  })

  it('reports percent lost consistently', () => {
    const lost = hopAlphaPercentLost({ alpha: 10, days: 182.5, percentLostSixMonths: 35 })
    expect(lost).toBeCloseTo(35, 4)
  })

  it('does not decay when no loss is configured', () => {
    expect(hopAlphaAfterAging({ alpha: 8, days: 1000, percentLostSixMonths: 0 })).toBeCloseTo(8, 6)
  })
})
