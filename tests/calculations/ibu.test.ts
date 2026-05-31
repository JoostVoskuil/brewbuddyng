import { describe, it, expect } from 'vitest'
import {
  calculateHopAmount,
  calculateHopIBU,
  calculateTotalIBU,
  type HopAddition,
} from '~/server/utils/calculations/ibu'

const params = { og: 1.05, batchSize: 20, boilSize: 25 }

function boilHop(overrides: Partial<HopAddition> = {}): HopAddition {
  return { amount: 30, alpha: 6, time: 60, use: 'boil', form: 'pellet', ...overrides }
}

describe('calculateHopIBU', () => {
  it('produces a sensible IBU for a 60-minute boil addition (Tinseth)', () => {
    const ibu = calculateHopIBU(boilHop(), params, 'tinseth')
    expect(ibu).toBeGreaterThan(15)
    expect(ibu).toBeLessThan(45)
  })

  it('gives zero bitterness for dry hops', () => {
    expect(calculateHopIBU(boilHop({ use: 'dry_hop' }), params, 'tinseth')).toBe(0)
  })

  it('longer boil time yields more IBU', () => {
    const short = calculateHopIBU(boilHop({ time: 10 }), params, 'tinseth')
    const long = calculateHopIBU(boilHop({ time: 60 }), params, 'tinseth')
    expect(long).toBeGreaterThan(short)
  })

  it('pellets extract more than leaf', () => {
    const pellet = calculateHopIBU(boilHop({ form: 'pellet' }), params, 'tinseth')
    const leaf = calculateHopIBU(boilHop({ form: 'leaf' }), params, 'tinseth')
    expect(pellet).toBeGreaterThan(leaf)
  })

  it.each(['tinseth', 'rager', 'garetz', 'daniels', 'mosher', 'noonan'] as const)(
    'method %s returns a positive finite IBU',
    (method) => {
      const ibu = calculateHopIBU(boilHop(), params, method)
      expect(Number.isFinite(ibu)).toBe(true)
      expect(ibu).toBeGreaterThan(0)
    },
  )

  it('Rager step table is monotonic with time', () => {
    const a = calculateHopIBU(boilHop({ time: 5 }), params, 'rager')
    const b = calculateHopIBU(boilHop({ time: 30 }), params, 'rager')
    const c = calculateHopIBU(boilHop({ time: 60 }), params, 'rager')
    expect(b).toBeGreaterThan(a)
    expect(c).toBeGreaterThan(b)
  })
})

describe('calculateHopAmount', () => {
  it('round-trips Tinseth IBU contribution back to grams within 0.5 g', () => {
    const hop = boilHop({ amount: 42, alpha: 7.2, time: 45, form: 'pellet' })
    const ibu = calculateHopIBU(hop, params, 'tinseth')
    const grams = calculateHopAmount(ibu, hop.alpha, hop.time, hop.use, hop.form, params, 'tinseth')
    expect(grams).toBeCloseTo(hop.amount, 0)
  })
})

describe('calculateTotalIBU', () => {
  it('sums contributions of multiple additions', () => {
    const total = calculateTotalIBU([boilHop(), boilHop({ time: 15 })], params, 'tinseth')
    const single = calculateHopIBU(boilHop(), params, 'tinseth')
    expect(total).toBeGreaterThan(single)
  })

  it('is zero for no hops', () => {
    expect(calculateTotalIBU([], params, 'tinseth')).toBe(0)
  })
})
