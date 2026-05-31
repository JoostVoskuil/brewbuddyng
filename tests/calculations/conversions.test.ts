import { describe, it, expect } from 'vitest'
import {
  sgToPlatoBH,
  platoToSgBH,
  sgToBrixBH,
  brixToSgBH,
  brixToFgBH,
  convertWort,
  convertBeerFromBrix,
  ogAfterFermentation,
  boilTestAbv,
} from '~/server/utils/calculations/conversions'

describe('SG/Plato/Brix conversions (BrouwHulp)', () => {
  it('converts SG to Plato with the simple relation', () => {
    // 259 − 259/1.074 ≈ 17.85
    expect(sgToPlatoBH(1.074)).toBeCloseTo(17.85, 1)
  })

  it('round-trips Plato <-> SG', () => {
    const sg = platoToSgBH(17.85)
    expect(sg).toBeCloseTo(1.074, 3)
  })

  it('applies the Brix correction factor to wort Brix', () => {
    // Manual example: SG 1.074 -> 17.8 °Plato -> 18.4 °Brix (factor 1.03)
    expect(sgToBrixBH(1.074, 1.03)).toBeCloseTo(18.4, 1)
    expect(brixToSgBH(18.4, 1.03)).toBeCloseTo(1.074, 3)
  })

  it('convertWort returns all three units from a Brix reading', () => {
    const w = convertWort(18.4, 'brix', 1.03)
    expect(w.sg).toBeCloseTo(1.074, 3)
    expect(w.plato).toBeCloseTo(17.85, 1)
    expect(w.brix).toBeCloseTo(18.4, 1)
  })
})

describe('brixToFgBH', () => {
  it('matches the manual example (18.4 -> 9.8 gives FG 1.017)', () => {
    expect(brixToFgBH(18.4, 9.8)).toBeCloseTo(1.017, 3)
  })
})

describe('convertBeerFromBrix', () => {
  it('derives FG, Plato and ABV for the manual example', () => {
    const b = convertBeerFromBrix(18.4, 9.8, 1.03)
    expect(b.fg).toBeCloseTo(1.017, 3)
    expect(b.plato).toBeGreaterThan(4)
    expect(b.plato).toBeLessThan(4.6)
    expect(b.abv).toBeCloseTo(7.4, 1)
    expect(b.attenuation).toBeGreaterThan(70)
    expect(b.attenuation).toBeLessThan(85)
  })
})

describe('ogAfterFermentation', () => {
  it('reconstructs OG and ABV from hydrometer + refractometer of finished beer', () => {
    const r = ogAfterFermentation(1.017, 9.8, 1.03)
    expect(r.og).toBeGreaterThan(1.06)
    expect(r.og).toBeLessThan(1.085)
    expect(r.abv).toBeGreaterThan(6)
    expect(r.abv).toBeLessThan(9)
  })
})

describe('boilTestAbv', () => {
  it('uses ABV = 717 * (SGafter - SGbefore)', () => {
    expect(boilTestAbv(1.01, 1.02)).toBeCloseTo(7.17, 2)
  })

  it('returns 0 when after < before', () => {
    expect(boilTestAbv(1.02, 1.01)).toBe(0)
  })
})
