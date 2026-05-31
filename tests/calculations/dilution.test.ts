import { describe, it, expect } from 'vitest'
import {
  dilutedGravity,
  concentratedGravity,
  waterToReachGravity,
  boilOffToReachGravity,
  sugarToReachGravity,
} from '~/server/utils/calculations/dilution'

describe('dilution & concentration', () => {
  it('halves the gravity points when doubling the volume', () => {
    // 1.050 (50 points) in 20 L, add 20 L water -> 25 points -> 1.025
    expect(dilutedGravity(1.05, 20, 20)).toBeCloseTo(1.025, 4)
  })

  it('keeps gravity unchanged when adding no water', () => {
    expect(dilutedGravity(1.05, 20, 0)).toBeCloseTo(1.05, 6)
  })

  it('raises gravity when boiling off water', () => {
    // 1.040 (40 points) in 25 L, boil off 5 L -> 40*25/20 = 50 -> 1.050
    expect(concentratedGravity(1.04, 25, 5)).toBeCloseTo(1.05, 4)
  })

  it('finds the water needed to reach a lower gravity', () => {
    // From 1.050/20 L to 1.025 -> need to reach 40 L -> add 20 L
    expect(waterToReachGravity(1.05, 20, 1.025)).toBeCloseTo(20, 4)
  })

  it('returns 0 water when target is not lower', () => {
    expect(waterToReachGravity(1.05, 20, 1.06)).toBe(0)
  })

  it('finds the boil-off needed to reach a higher gravity', () => {
    // From 1.040/25 L to 1.050 -> reach 20 L -> boil off 5 L
    expect(boilOffToReachGravity(1.04, 25, 1.05)).toBeCloseTo(5, 4)
  })
})

describe('sugar addition', () => {
  it('computes sugar to raise gravity', () => {
    // raise 1.050 -> 1.060 in 20 L = +10 points over 20 L = 200 point-litres
    // kg = 200 / 384 ≈ 0.5208 kg for pure sucrose
    expect(sugarToReachGravity(1.05, 20, 1.06)).toBeCloseTo(0.5208, 3)
  })

  it('returns 0 when target gravity is not higher', () => {
    expect(sugarToReachGravity(1.05, 20, 1.04)).toBe(0)
  })
})
