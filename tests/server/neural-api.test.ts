import { describe, expect, it } from 'vitest'
import {
  neuralNetworkCreate,
  neuralNetworkPredictRequest,
  neuralNetworkSamplesAdd,
} from '../../server/utils/validation'
import {
  buildStoredNetwork,
  predictStoredNetwork,
  toNetworkResponse,
  trainStoredNetwork,
  type NeuralNetworkRow,
  type NeuralNetworkSampleRow,
} from '../../server/utils/nn/neural-api'
import { serializeNetwork } from '../../server/utils/calculations/neural'

function row(overrides: Partial<NeuralNetworkRow> = {}): NeuralNetworkRow {
  return {
    id: 1,
    name: 'xor',
    equipmentId: null,
    inputParams: JSON.stringify(['a', 'b']),
    outputParams: JSON.stringify(['xor']),
    hiddenLayers: JSON.stringify([2]),
    weights: null,
    trainedAt: null,
    rounds: null,
    finalError: null,
    notes: null,
    ...overrides,
  }
}

function sample(networkId: number, inputs: number[], outputs: number[]): NeuralNetworkSampleRow {
  return {
    id: Math.floor(inputs[0]! * 10 + inputs[1]!),
    networkId,
    brewId: null,
    inputs: JSON.stringify(inputs),
    outputs: JSON.stringify(outputs),
    useForTraining: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  }
}

describe('neural network API helpers and validation', () => {
  it('validates create, samples and predict payloads', () => {
    expect(
      neuralNetworkCreate.parse({
        name: 'attenuation',
        inputSize: 2,
        outputSize: 1,
        hiddenLayers: [2],
      }).name,
    ).toBe('attenuation')
    expect(
      neuralNetworkSamplesAdd.parse({ samples: [{ inputs: [1, 2], outputs: [3] }] }).samples,
    ).toHaveLength(1)
    expect(neuralNetworkPredictRequest.parse({ inputs: [1, 2] }).inputs).toEqual([1, 2])
  })

  it('maps database rows to endpoint responses', () => {
    const response = toNetworkResponse(row(), 4)
    expect(response.inputSize).toBe(2)
    expect(response.outputSize).toBe(1)
    expect(response.hiddenLayersList).toEqual([2])
    expect(response.samplesCount).toBe(4)
  })

  it('trains and predicts from persisted endpoint-shaped rows', () => {
    const networkRow = row()
    const training = trainStoredNetwork(
      networkRow,
      [
        sample(1, [0, 0], [0]),
        sample(1, [0, 1], [1]),
        sample(1, [1, 0], [1]),
        sample(1, [1, 1], [0]),
      ],
      { seed: 13, maxEpochs: 20000, targetRmse: 0.05, learningRate: 0.9, momentum: 0.2 },
    )
    const trainedRow = row({
      weights: serializeNetwork(training.network),
      finalError: training.rmse,
    })

    expect(buildStoredNetwork(trainedRow).layers).toHaveLength(2)
    expect(predictStoredNetwork(trainedRow, [0, 1])[0]).toBeGreaterThan(0.7)
    expect(predictStoredNetwork(trainedRow, [1, 1])[0]).toBeLessThan(0.3)
  })
})
