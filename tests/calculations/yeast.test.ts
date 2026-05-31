import { describe, expect, it } from 'vitest'
import {
  cascadeStep,
  pitchRateCells,
  requiredCells,
  vitalityAdjustedCells,
} from '~/server/utils/calculations/yeast'

describe('yeast propagation calculations', () => {
  it('calculates pitch-rate cells in billions', () => {
    expect(pitchRateCells(20, 12, 0.75)).toBeCloseTo(180, 6)
    expect(requiredCells(1.048, 20, false)).toBeCloseTo(179, 0)
  })

  it('scales source cells by vitality', () => {
    expect(vitalityAdjustedCells(100, 0.65)).toBeCloseTo(65, 6)
    expect(vitalityAdjustedCells(100, 1.5)).toBe(100)
    expect(vitalityAdjustedCells(100, -1)).toBe(0)
  })

  it('cascades one simple step with density cap', () => {
    const step = cascadeStep(80, 1, 1.04, 'simple')

    expect(step.endingCells).toBeCloseTo(100, 6)
    expect(step.dmeGrams).toBeCloseTo(1000, 6)
  })

  it('cascades two aerated steps', () => {
    const first = cascadeStep(25, 1, 1.04, 'aerated')
    const second = cascadeStep(first.endingCells, 2, 1.04, 'aerated')

    expect(first.endingCells).toBeCloseTo(100, 6)
    expect(second.endingCells).toBeCloseTo(300, 6)
    expect(second.dmeGrams).toBeCloseTo(2000, 6)
  })

  it('cascades three stirred steps', () => {
    const first = cascadeStep(10, 1, 1.04, 'stirred')
    const second = cascadeStep(first.endingCells, 1, 1.04, 'stirred')
    const third = cascadeStep(second.endingCells, 3, 1.04, 'stirred')

    expect(first.endingCells).toBeCloseTo(60, 6)
    expect(second.endingCells).toBeCloseTo(200, 6)
    expect(third.endingCells).toBeCloseTo(600, 6)
  })
})
