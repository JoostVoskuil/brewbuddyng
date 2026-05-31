import { describe, it, expect } from 'vitest'
import {
  NeuralNetwork,
  createNeuralNetwork,
  predictNetwork,
  trainNetwork,
  trainPredictor,
  hasEnoughData,
  hiddenLayerSize,
  serializeNetwork,
  deserializeNetwork,
  type TrainingSample,
} from '../../server/utils/calculations/neural'

describe('hiddenLayerSize', () => {
  it('is round((nIn+nOut)/2) with a floor of 1', () => {
    expect(hiddenLayerSize(6, 3)).toBe(5)
    expect(hiddenLayerSize(2, 1)).toBe(2)
    expect(hiddenLayerSize(1, 1)).toBe(1)
  })
})

describe('hasEnoughData', () => {
  it('requires at least 1.5x the number of connections', () => {
    // nIn=2, nOut=1 -> hidden=2, connections=2*2+2*1=6, need >= 9
    expect(hasEnoughData(8, 2, 1)).toBe(false)
    expect(hasEnoughData(9, 2, 1)).toBe(true)
  })
})

describe('NeuralNetwork', () => {
  it('learns a simple linear relationship', () => {
    // Output = average of the two inputs.
    const samples: TrainingSample[] = []
    for (let i = 0; i <= 10; i++) {
      for (let j = 0; j <= 10; j++) {
        samples.push({ inputs: [i, j], outputs: [(i + j) / 2] })
      }
    }
    const net = new NeuralNetwork(2, 1, 42)
    net.train(samples, { epochs: 2000, learningRate: 0.3 })
    expect(net.isTrained).toBe(true)
    const [p] = net.predict([4, 8])
    expect(p).toBeCloseTo(6, 0)
  })

  it('produces deterministic results for a fixed seed', () => {
    const samples: TrainingSample[] = Array.from({ length: 20 }, (_, i) => ({
      inputs: [i, i * 2],
      outputs: [i * 3],
    }))
    const a = new NeuralNetwork(2, 1, 7)
    const b = new NeuralNetwork(2, 1, 7)
    a.train(samples, { epochs: 200 })
    b.train(samples, { epochs: 200 })
    expect(a.predict([5, 10])).toEqual(b.predict([5, 10]))
  })

  it('handles a degenerate (constant) input feature', () => {
    const samples: TrainingSample[] = Array.from({ length: 30 }, (_, i) => ({
      inputs: [5, i],
      outputs: [i],
    }))
    const net = new NeuralNetwork(2, 1, 3)
    const mse = net.train(samples, { epochs: 1000 })
    expect(Number.isFinite(mse)).toBe(true)
    const [p] = net.predict([5, 15])
    expect(p).toBeGreaterThan(0)
    expect(p).toBeLessThan(30)
  })
})

describe('FANN-style multi-layer perceptron', () => {
  it('learns XOR deterministically with seeded weights', () => {
    const samples: TrainingSample[] = [
      { inputs: [0, 0], outputs: [0] },
      { inputs: [0, 1], outputs: [1] },
      { inputs: [1, 0], outputs: [1] },
      { inputs: [1, 1], outputs: [0] },
    ]
    const result = trainNetwork(
      { inputSize: 2, hiddenLayers: [2], outputSize: 1, activation: 'sigmoid' },
      samples,
      { seed: 13, maxEpochs: 20000, targetRmse: 0.04, learningRate: 0.9, momentum: 0.2 },
    )

    expect(result.rmse).toBeLessThan(0.08)
    expect(result.epochs).toBeLessThanOrEqual(20000)
    expect(predictNetwork(result.network, [0, 0])[0]).toBeLessThan(0.25)
    expect(predictNetwork(result.network, [0, 1])[0]).toBeGreaterThan(0.75)
    expect(predictNetwork(result.network, [1, 0])[0]).toBeGreaterThan(0.75)
    expect(predictNetwork(result.network, [1, 1])[0]).toBeLessThan(0.25)
  })

  it('serialises nested weights through JSON', () => {
    const network = createNeuralNetwork({ inputSize: 2, hiddenLayers: [3, 2], outputSize: 1 }, 99)
    const restored = deserializeNetwork(serializeNetwork(network))
    expect(restored.layers).toEqual(network.layers)
    expect(restored.layers).toHaveLength(3)
  })
})

describe('trainPredictor', () => {
  it('returns null when there is not enough data', () => {
    const samples: TrainingSample[] = [
      { inputs: [1, 2], outputs: [3] },
      { inputs: [2, 3], outputs: [5] },
    ]
    expect(trainPredictor(samples)).toBeNull()
  })

  it('returns a trained network when data is sufficient', () => {
    const samples: TrainingSample[] = Array.from({ length: 30 }, (_, i) => ({
      inputs: [i, i + 1],
      outputs: [i + 0.5],
    }))
    const net = trainPredictor(samples, { epochs: 500 })
    expect(net).not.toBeNull()
    expect(net!.isTrained).toBe(true)
  })

  it('returns null for empty input', () => {
    expect(trainPredictor([])).toBeNull()
  })
})
