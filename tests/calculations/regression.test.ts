import { describe, it, expect } from 'vitest'
import { fitCurve, predict, histogram, type Point } from '~/server/utils/calculations/regression'

describe('fitCurve - linear', () => {
  it('recovers a perfect line y = 2 + 3x with r² = 1', () => {
    const points: Point[] = [
      { x: 0, y: 2 },
      { x: 1, y: 5 },
      { x: 2, y: 8 },
      { x: 3, y: 11 },
    ]
    const fit = fitCurve(points, 'linear')
    expect(fit).not.toBeNull()
    expect(fit!.coefficients[0]).toBeCloseTo(2, 6)
    expect(fit!.coefficients[1]).toBeCloseTo(3, 6)
    expect(fit!.r2).toBeCloseTo(1, 6)
    expect(predict(fit!, 'linear', 4)).toBeCloseTo(14, 6)
  })

  it('produces a lower r² for noisy data', () => {
    const points: Point[] = [
      { x: 1, y: 2 },
      { x: 2, y: 5 },
      { x: 3, y: 3 },
      { x: 4, y: 8 },
    ]
    const fit = fitCurve(points, 'linear')
    expect(fit).not.toBeNull()
    expect(fit!.r2).toBeLessThan(1)
    expect(fit!.r2).toBeGreaterThanOrEqual(0)
  })
})

describe('fitCurve - polynomial', () => {
  it('recovers a perfect parabola y = 1 + 0x + 2x²', () => {
    const points: Point[] = [
      { x: -2, y: 9 },
      { x: -1, y: 3 },
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 9 },
    ]
    const fit = fitCurve(points, 'polynomial')
    expect(fit).not.toBeNull()
    expect(fit!.coefficients[0]).toBeCloseTo(1, 5)
    expect(fit!.coefficients[2]).toBeCloseTo(2, 5)
    expect(fit!.r2).toBeCloseTo(1, 5)
  })
})

describe('fitCurve - exponential', () => {
  it('recovers y = 2·e^(0.5x)', () => {
    const a = 2
    const b = 0.5
    const points: Point[] = [0, 1, 2, 3, 4].map((x) => ({ x, y: a * Math.exp(b * x) }))
    const fit = fitCurve(points, 'exponential')
    expect(fit).not.toBeNull()
    expect(fit!.coefficients[0]).toBeCloseTo(a, 4)
    expect(fit!.coefficients[1]).toBeCloseTo(b, 4)
    expect(fit!.r2).toBeCloseTo(1, 5)
  })

  it('returns null when not enough positive y values', () => {
    const points: Point[] = [
      { x: 1, y: -1 },
      { x: 2, y: 0 },
    ]
    expect(fitCurve(points, 'exponential')).toBeNull()
  })
})

describe('fitCurve - power', () => {
  it('recovers y = 3·x^2', () => {
    const a = 3
    const b = 2
    const points: Point[] = [1, 2, 3, 4, 5].map((x) => ({ x, y: a * Math.pow(x, b) }))
    const fit = fitCurve(points, 'power')
    expect(fit).not.toBeNull()
    expect(fit!.coefficients[0]).toBeCloseTo(a, 4)
    expect(fit!.coefficients[1]).toBeCloseTo(b, 4)
    expect(fit!.r2).toBeCloseTo(1, 5)
  })
})

describe('fitCurve - guards', () => {
  it('returns null with fewer than two points', () => {
    expect(fitCurve([{ x: 1, y: 1 }], 'linear')).toBeNull()
  })

  it('ignores non-finite points', () => {
    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: NaN, y: 5 },
      { x: 2, y: 2 },
    ]
    const fit = fitCurve(points, 'linear')
    expect(fit).not.toBeNull()
    expect(fit!.coefficients[1]).toBeCloseTo(1, 6)
  })
})

describe('histogram', () => {
  it('buckets values into equal-width bins', () => {
    const bins = histogram([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5)
    expect(bins).toHaveLength(5)
    const total = bins.reduce((s, b) => s + b.count, 0)
    expect(total).toBe(10)
    expect(bins[0]!.count).toBe(2) // 1,2
    expect(bins[4]!.count).toBe(2) // 9,10 (last bin inclusive)
  })

  it('reports percentages summing to 100', () => {
    const bins = histogram([1, 1, 2, 2, 3, 3], 3)
    const totalPct = bins.reduce((s, b) => s + b.percentage, 0)
    expect(totalPct).toBeCloseTo(100, 6)
  })

  it('handles identical values with a single populated bin', () => {
    const bins = histogram([5, 5, 5, 5], 4)
    const total = bins.reduce((s, b) => s + b.count, 0)
    expect(total).toBe(4)
  })

  it('returns an empty array for no data', () => {
    expect(histogram([], 5)).toEqual([])
  })

  it('ignores non-finite values', () => {
    const bins = histogram([1, 2, NaN, 3, Infinity], 2)
    const total = bins.reduce((s, b) => s + b.count, 0)
    expect(total).toBe(3)
  })
})
