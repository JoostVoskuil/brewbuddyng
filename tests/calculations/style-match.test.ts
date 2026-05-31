import { describe, it, expect } from 'vitest'
import {
  metricFit,
  scoreStyleMatch,
  rankStyleMatches,
  type StyleRanges,
} from '../../server/utils/calculations/style-match'

describe('metricFit', () => {
  it('returns 1 inside the range', () => {
    expect(metricFit(1.05, 1.04, 1.06)).toBe(1)
    expect(metricFit(1.04, 1.04, 1.06)).toBe(1)
    expect(metricFit(1.06, 1.04, 1.06)).toBe(1)
  })

  it('decays linearly outside the range by range width', () => {
    // width = 0.02; half a width below lower bound → fit 0.5
    expect(metricFit(1.03, 1.04, 1.06)).toBeCloseTo(0.5, 5)
    // one full width above upper bound → fit 0
    expect(metricFit(1.08, 1.04, 1.06)).toBeCloseTo(0, 5)
  })

  it('never returns negative', () => {
    expect(metricFit(2.0, 1.04, 1.06)).toBe(0)
  })

  it('handles swapped bounds', () => {
    expect(metricFit(1.05, 1.06, 1.04)).toBe(1)
  })

  it('returns 0 for non-finite values', () => {
    expect(metricFit(NaN, 1.0, 1.1)).toBe(0)
  })
})

const PALE_ALE: StyleRanges = {
  og: { min: 1.045, max: 1.06 },
  fg: { min: 1.01, max: 1.015 },
  ibu: { min: 30, max: 50 },
  colorSrm: { min: 5, max: 14 },
  abv: { min: 4.5, max: 6.2 },
}

const STOUT: StyleRanges = {
  og: { min: 1.075, max: 1.115 },
  fg: { min: 1.018, max: 1.03 },
  ibu: { min: 50, max: 90 },
  colorSrm: { min: 30, max: 40 },
  abv: { min: 8, max: 12 },
}

describe('scoreStyleMatch', () => {
  it('scores a perfect in-range recipe at 1', () => {
    const m = scoreStyleMatch(
      { og: 1.05, fg: 1.012, ibu: 38, colorSrm: 8, abv: 5.2 },
      'pale',
      PALE_ALE,
    )
    expect(m.score).toBe(1)
    expect(m.inRangeCount).toBe(5)
    expect(m.evaluatedCount).toBe(5)
  })

  it('only evaluates metrics present on both sides', () => {
    const m = scoreStyleMatch({ og: 1.05, ibu: 38 }, 'pale', PALE_ALE)
    expect(m.evaluatedCount).toBe(2)
  })

  it('returns score 0 when nothing can be evaluated', () => {
    const m = scoreStyleMatch({}, 'pale', PALE_ALE)
    expect(m.evaluatedCount).toBe(0)
    expect(m.score).toBe(0)
  })
})

describe('rankStyleMatches', () => {
  it('ranks the closest style first', () => {
    const metrics = { og: 1.052, fg: 1.012, ibu: 40, colorSrm: 9, abv: 5.3 }
    const ranked = rankStyleMatches(metrics, [
      { style: 'stout', ranges: STOUT },
      { style: 'pale', ranges: PALE_ALE },
    ])
    expect(ranked[0]!.style).toBe('pale')
    expect(ranked[0]!.score).toBeGreaterThan(ranked[1]!.score)
  })

  it('drops styles with no evaluable metric', () => {
    const ranked = rankStyleMatches({ og: 1.05 }, [
      { style: 'noranges', ranges: {} },
      { style: 'pale', ranges: PALE_ALE },
    ])
    expect(ranked).toHaveLength(1)
    expect(ranked[0]!.style).toBe('pale')
  })
})
