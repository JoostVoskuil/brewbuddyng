import { describe, expect, it } from 'vitest'
import { buildCsvSamples, parseNumericCsv, splitNumbers } from '../composables/useNeuralCsv'

describe('neural CSV helpers', () => {
  it('parses semicolon, comma and tab separated numbers', () => {
    expect(parseNumericCsv('1;2;3\n4,5\t6')).toEqual([[1, 2, 3], [4, 5, 6]])
    expect(splitNumbers('1; 2, 3')).toEqual([1, 2, 3])
  })

  it('splits rows into input/output vectors and train validation flags', () => {
    const samples = buildCsvSamples([[1, 2, 3], [4, 5, 6], [7, 8, 9]], 2, 1, 67)
    expect(samples).toEqual([
      { inputs: [1, 2], outputs: [3], useForTraining: true },
      { inputs: [4, 5], outputs: [6], useForTraining: true },
      { inputs: [7, 8], outputs: [9], useForTraining: false },
    ])
  })
})
