/**
 * FANN-style multi-layer perceptron for BrouwHulp neural-network parity.
 *
 * The original desktop application delegated to FANN: fully connected input,
 * hidden and output layers, sigmoid-like activations, randomized weights,
 * momentum backpropagation and RMSE-based termination. This module keeps those
 * semantics in dependency-free TypeScript and serialises weights as JSON-safe
 * nested arrays for SQLite storage.
 */

/** Margin keeping normalised values away from activation bounds (BrouwHulp iMarge). */
const MARGIN = 0.05

export type ActivationName = 'sigmoid' | 'tanh' | 'relu' | 'elliot'
export type TrainingAlgorithm = 'online' | 'batch'

export interface TrainingSample {
  inputs: number[]
  outputs: number[]
  /** Optional sample importance; defaults to 1. */
  weight?: number
}

export interface NeuralConfig {
  inputSize: number
  hiddenLayers?: number[]
  outputSize: number
  activation?: ActivationName
}

export interface TrainOptions {
  /** Maximum training epochs (BrouwHulp "training rounds"). */
  epochs?: number
  /** Alias for epochs used by API callers. */
  maxEpochs?: number
  /** Target mean-squared error; training stops early once reached. */
  targetError?: number
  /** Target root-mean-squared error; preferred for FANN-style reporting. */
  targetRmse?: number
  /** Learning rate (FANN default 0.7, BrouwHulp UI often uses 0.1). */
  learningRate?: number
  /** Learning momentum. */
  momentum?: number
  /** Seed for deterministic weight initialisation. */
  seed?: number
  /** Online stochastic backpropagation or batch gradient accumulation. */
  algorithm?: TrainingAlgorithm
  /** Optional callback receiving RMSE at the end of each epoch. */
  onEpoch?: (epoch: number, rmse: number) => void
}

export interface NormalizationRange {
  min: number[]
  max: number[]
}

export interface SerializedNeuralNetwork {
  inputSize: number
  hiddenLayers: number[]
  outputSize: number
  activation: ActivationName
  layers: number[][][]
  inputRange: NormalizationRange
  outputRange: NormalizationRange
  trained: boolean
  rmse: number
  epochs: number
}

export interface TrainResult {
  network: SerializedNeuralNetwork
  weights: number[][][]
  rmse: number
  epochs: number
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

function elliot(x: number): number {
  return x / (2 * (1 + Math.abs(x))) + 0.5
}

function activate(x: number, name: ActivationName): number {
  switch (name) {
    case 'tanh':
      return Math.tanh(x)
    case 'relu':
      return Math.max(0, x)
    case 'elliot':
      return elliot(x)
    case 'sigmoid':
    default:
      return sigmoid(x)
  }
}

function derivativeFromActivation(value: number, name: ActivationName): number {
  switch (name) {
    case 'tanh':
      return 1 - value * value
    case 'relu':
      return value > 0 ? 1 : 0
    case 'elliot': {
      const y = Math.max(0, Math.min(1, value))
      return 2 * Math.min(y, 1 - y) * Math.min(y, 1 - y)
    }
    case 'sigmoid':
    default:
      return value * (1 - value)
  }
}

/** Deterministic PRNG (mulberry32) so training is reproducible in tests. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Hidden-layer size, matching round((nIn+nOut)/2) from neuroot.pas. */
export function hiddenLayerSize(nIn: number, nOut: number): number {
  return Math.max(1, Math.round((nIn + nOut) / 2))
}

/**
 * Whether there is enough training data for the default single-hidden-layer
 * BrouwHulp predictor. Connections = nIn·hidden + hidden·nOut; BrouwHulp
 * requires at least 1.5× that many valid brews.
 */
export function hasEnoughData(numSamples: number, nIn: number, nOut: number): boolean {
  const hidden = hiddenLayerSize(nIn, nOut)
  const connections = nIn * hidden + hidden * nOut
  return numSamples >= 1.5 * connections
}

function assertVector(name: string, values: number[], length: number): void {
  if (values.length !== length || values.some((v) => !Number.isFinite(v))) {
    throw new Error(`${name} must contain ${length} finite number(s)`)
  }
}

function computeRange(values: number[][], count: number): NormalizationRange {
  const min = Array.from({ length: count }, () => Infinity)
  const max = Array.from({ length: count }, () => -Infinity)
  for (const row of values) {
    for (let i = 0; i < count; i++) {
      const v = row[i] ?? 0
      if (v < min[i]!) min[i] = v
      if (v > max[i]!) max[i] = v
    }
  }
  for (let i = 0; i < count; i++) {
    if (!Number.isFinite(min[i]!)) min[i] = 0
    if (!Number.isFinite(max[i]!)) max[i] = 0
  }
  return { min, max }
}

function normalize(value: number, min: number, max: number, activation: ActivationName): number {
  if (activation === 'tanh') {
    if (max === min) return 0
    return -1 + 2 * ((value - min) / (max - min))
  }
  if (max === min) return 0.5
  return MARGIN + (1 - 2 * MARGIN) * ((value - min) / (max - min))
}

function denormalize(value: number, min: number, max: number, activation: ActivationName): number {
  if (max === min) return min
  if (activation === 'tanh') {
    return min + ((value + 1) / 2) * (max - min)
  }
  return min + ((value - MARGIN) / (1 - 2 * MARGIN)) * (max - min)
}

function cloneLayers(layers: number[][][]): number[][][] {
  return layers.map((layer) => layer.map((neuron) => [...neuron]))
}

function randomLayers(sizes: number[], seed: number): number[][][] {
  const rng = makeRng(seed)
  const layers: number[][][] = []
  for (let l = 1; l < sizes.length; l++) {
    const previous = sizes[l - 1]!
    const current = sizes[l]!
    const scale = Math.sqrt(6 / (previous + current))
    layers.push(
      Array.from({ length: current }, () =>
        Array.from({ length: previous + 1 }, () => (rng() * 2 - 1) * scale),
      ),
    )
  }
  return layers
}

function defaultSerialized(config: NeuralConfig, seed: number): SerializedNeuralNetwork {
  const hiddenLayers = config.hiddenLayers?.length
    ? config.hiddenLayers.map((n) => Math.max(1, Math.trunc(n)))
    : [hiddenLayerSize(config.inputSize, config.outputSize)]
  const sizes = [config.inputSize, ...hiddenLayers, config.outputSize]
  return {
    inputSize: config.inputSize,
    hiddenLayers,
    outputSize: config.outputSize,
    activation: config.activation ?? 'sigmoid',
    layers: randomLayers(sizes, seed),
    inputRange: { min: Array(config.inputSize).fill(0), max: Array(config.inputSize).fill(1) },
    outputRange: { min: Array(config.outputSize).fill(0), max: Array(config.outputSize).fill(1) },
    trained: false,
    rmse: Number.POSITIVE_INFINITY,
    epochs: 0,
  }
}

function forwardNormalized(
  layers: number[][][],
  input: number[],
  activation: ActivationName,
): number[][] {
  const activations = [input]
  for (const layer of layers) {
    const previous = activations[activations.length - 1]!
    activations.push(
      layer.map((weights) => {
        let sum = weights[weights.length - 1]!
        for (let i = 0; i < previous.length; i++) sum += weights[i]! * previous[i]!
        return activate(sum, activation)
      }),
    )
  }
  return activations
}

function normalizeInputs(network: SerializedNeuralNetwork, inputs: number[]): number[] {
  assertVector('inputs', inputs, network.inputSize)
  return inputs.map((v, i) =>
    normalize(v, network.inputRange.min[i]!, network.inputRange.max[i]!, network.activation),
  )
}

function normalizeOutputs(network: SerializedNeuralNetwork, outputs: number[]): number[] {
  assertVector('outputs', outputs, network.outputSize)
  return outputs.map((v, i) =>
    normalize(v, network.outputRange.min[i]!, network.outputRange.max[i]!, network.activation),
  )
}

export function createNeuralNetwork(config: NeuralConfig, seed = 1): SerializedNeuralNetwork {
  if (!Number.isInteger(config.inputSize) || config.inputSize <= 0) {
    throw new Error('inputSize must be a positive integer')
  }
  if (!Number.isInteger(config.outputSize) || config.outputSize <= 0) {
    throw new Error('outputSize must be a positive integer')
  }
  return defaultSerialized(config, seed)
}

export function serializeNetwork(network: SerializedNeuralNetwork): string {
  return JSON.stringify(network)
}

export function deserializeNetwork(
  value: string | SerializedNeuralNetwork,
): SerializedNeuralNetwork {
  if (typeof value !== 'string') return { ...value, layers: cloneLayers(value.layers) }
  const parsed = JSON.parse(value) as SerializedNeuralNetwork
  return { ...parsed, layers: cloneLayers(parsed.layers) }
}

export function predictNetwork(network: SerializedNeuralNetwork, inputs: number[]): number[] {
  const normalized = normalizeInputs(network, inputs)
  const activations = forwardNormalized(network.layers, normalized, network.activation)
  const output = activations[activations.length - 1]!
  return output.map((v, i) =>
    denormalize(v, network.outputRange.min[i]!, network.outputRange.max[i]!, network.activation),
  )
}

export function trainNetwork(
  configOrNetwork: NeuralConfig | SerializedNeuralNetwork,
  samples: TrainingSample[],
  options: TrainOptions = {},
): TrainResult {
  if (!samples.length) throw new Error('At least one training sample is required')

  const isSerialized = 'layers' in configOrNetwork
  const seed = options.seed ?? 1
  const network = isSerialized
    ? deserializeNetwork(configOrNetwork)
    : createNeuralNetwork(configOrNetwork, seed)

  for (const sample of samples) {
    assertVector('sample.inputs', sample.inputs, network.inputSize)
    assertVector('sample.outputs', sample.outputs, network.outputSize)
  }

  network.inputRange = computeRange(
    samples.map((s) => s.inputs),
    network.inputSize,
  )
  network.outputRange = computeRange(
    samples.map((s) => s.outputs),
    network.outputSize,
  )

  const maxEpochs = options.maxEpochs ?? options.epochs ?? 5000
  const targetRmse = options.targetRmse ?? Math.sqrt(options.targetError ?? 0.0001)
  const learningRate = options.learningRate ?? 0.7
  const momentum = options.momentum ?? 0.1
  const algorithm = options.algorithm ?? 'online'
  const deltas = network.layers.map((layer) => layer.map((neuron) => Array(neuron.length).fill(0)))
  const batchGradients = network.layers.map((layer) =>
    layer.map((neuron) => Array(neuron.length).fill(0) as number[]),
  )

  let rmse = Number.POSITIVE_INFINITY
  let completedEpochs = 0

  for (let epoch = 1; epoch <= maxEpochs; epoch++) {
    let squaredError = 0
    let weightedOutputs = 0

    if (algorithm === 'batch') {
      for (const layer of batchGradients) for (const row of layer) row.fill(0)
    }

    for (const sample of samples) {
      const sampleWeight = Math.max(0, sample.weight ?? 1)
      if (sampleWeight === 0) continue
      const input = normalizeInputs(network, sample.inputs)
      const target = normalizeOutputs(network, sample.outputs)
      const activations = forwardNormalized(network.layers, input, network.activation)
      const output = activations[activations.length - 1]!
      const layerErrors = network.layers.map((layer) => Array(layer.length).fill(0) as number[])
      const lastLayerIndex = network.layers.length - 1

      for (let o = 0; o < network.outputSize; o++) {
        const error = output[o]! - target[o]!
        squaredError += sampleWeight * error * error
        weightedOutputs += sampleWeight
        layerErrors[lastLayerIndex]![o] =
          sampleWeight * error * derivativeFromActivation(output[o]!, network.activation)
      }

      for (let l = lastLayerIndex - 1; l >= 0; l--) {
        const nextLayer = network.layers[l + 1]!
        const activ = activations[l + 1]!
        for (let j = 0; j < network.layers[l]!.length; j++) {
          let sum = 0
          for (let k = 0; k < nextLayer.length; k++) {
            sum += layerErrors[l + 1]![k]! * nextLayer[k]![j]!
          }
          layerErrors[l]![j] = sum * derivativeFromActivation(activ[j]!, network.activation)
        }
      }

      for (let l = 0; l < network.layers.length; l++) {
        const previous = activations[l]!
        const layer = network.layers[l]!
        for (let n = 0; n < layer.length; n++) {
          const weights = layer[n]!
          for (let w = 0; w < weights.length; w++) {
            const source = w === weights.length - 1 ? 1 : previous[w]!
            const gradient = layerErrors[l]![n]! * source
            if (algorithm === 'batch') {
              batchGradients[l]![n]![w]! += gradient
            } else {
              const change = -learningRate * gradient + momentum * deltas[l]![n]![w]!
              deltas[l]![n]![w] = change
              weights[w] = weights[w]! + change
            }
          }
        }
      }
    }

    if (algorithm === 'batch') {
      const denom = Math.max(1, weightedOutputs / network.outputSize)
      for (let l = 0; l < network.layers.length; l++) {
        const layer = network.layers[l]!
        for (let n = 0; n < layer.length; n++) {
          const weights = layer[n]!
          for (let w = 0; w < weights.length; w++) {
            const gradient = batchGradients[l]![n]![w]! / denom
            const change = -learningRate * gradient + momentum * deltas[l]![n]![w]!
            deltas[l]![n]![w] = change
            weights[w] = weights[w]! + change
          }
        }
      }
    }

    rmse = Math.sqrt(squaredError / Math.max(1, weightedOutputs))
    completedEpochs = epoch
    options.onEpoch?.(epoch, rmse)
    if (rmse <= targetRmse) break
  }

  network.trained = true
  network.rmse = rmse
  network.epochs = (network.epochs ?? 0) + completedEpochs
  return { network, weights: cloneLayers(network.layers), rmse, epochs: completedEpochs }
}

/**
 * Backwards-compatible wrapper used by existing calculation tests and brew
 * prediction code. It exposes a single-hidden-layer predictor with the historic
 * BrouwHulp hidden-size heuristic.
 */
export class NeuralNetwork {
  readonly nIn: number
  readonly nOut: number
  readonly hidden: number
  private network: SerializedNeuralNetwork

  constructor(nIn: number, nOut: number, seed = 1) {
    this.nIn = nIn
    this.nOut = nOut
    this.hidden = hiddenLayerSize(nIn, nOut)
    this.network = createNeuralNetwork(
      { inputSize: nIn, hiddenLayers: [this.hidden], outputSize: nOut, activation: 'elliot' },
      seed,
    )
  }

  get isTrained(): boolean {
    return this.network.trained
  }

  get mse(): number {
    return this.network.rmse * this.network.rmse
  }

  train(samples: TrainingSample[], options: TrainOptions = {}): number {
    const result = trainNetwork(this.network, samples, options)
    this.network = result.network
    return result.rmse * result.rmse
  }

  predict(inputs: number[]): number[] {
    return predictNetwork(this.network, inputs)
  }

  toJSON(): SerializedNeuralNetwork {
    return deserializeNetwork(this.network)
  }
}

/**
 * Convenience helper: build and train a network on the given samples. Returns
 * null when there is not enough data for the default BrouwHulp network shape.
 */
export function trainPredictor(
  samples: TrainingSample[],
  options: TrainOptions = {},
): NeuralNetwork | null {
  if (samples.length === 0) return null
  const nIn = samples[0]!.inputs.length
  const nOut = samples[0]!.outputs.length
  if (!hasEnoughData(samples.length, nIn, nOut)) return null
  const net = new NeuralNetwork(nIn, nOut, options.seed ?? 1)
  net.train(samples, options)
  return net
}
