import type { neuralNetworkSamples, neuralNetworks } from '~/server/db/schema'
import {
  createNeuralNetwork,
  deserializeNetwork,
  predictNetwork,
  trainNetwork,
  type ActivationName,
  type SerializedNeuralNetwork,
  type TrainingSample,
} from '~/server/utils/calculations/neural'

export type NeuralNetworkRow = typeof neuralNetworks.$inferSelect
export type NeuralNetworkSampleRow = typeof neuralNetworkSamples.$inferSelect

export interface NeuralNetworkResponse extends NeuralNetworkRow {
  inputSize: number
  outputSize: number
  inputParamsList: string[]
  outputParamsList: string[]
  hiddenLayersList: number[]
  samplesCount?: number
}

export function parseJsonArray<T>(value: string | null | undefined, fallback: T[]): T[] {
  if (!value) return fallback
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? (parsed as T[]) : fallback
  } catch {
    return fallback
  }
}

export function toNetworkResponse(
  row: NeuralNetworkRow,
  samplesCount?: number,
): NeuralNetworkResponse {
  const inputParamsList = parseJsonArray<string>(row.inputParams, [])
  const outputParamsList = parseJsonArray<string>(row.outputParams, [])
  const hiddenLayersList = parseJsonArray<number>(row.hiddenLayers, [8])
  return {
    ...row,
    inputSize: inputParamsList.length,
    outputSize: outputParamsList.length,
    inputParamsList,
    outputParamsList,
    hiddenLayersList,
    ...(samplesCount === undefined ? {} : { samplesCount }),
  }
}

export function buildStoredNetwork(
  row: NeuralNetworkRow,
  fallbackActivation: ActivationName = 'sigmoid',
  seed = 1,
): SerializedNeuralNetwork {
  if (row.weights) return deserializeNetwork(row.weights)
  const inputSize = parseJsonArray<string>(row.inputParams, []).length
  const outputSize = parseJsonArray<string>(row.outputParams, []).length
  const hiddenLayers = parseJsonArray<number>(row.hiddenLayers, [8])
  return createNeuralNetwork({ inputSize, outputSize, hiddenLayers, activation: fallbackActivation }, seed)
}

export function sampleRowToTrainingSample(row: NeuralNetworkSampleRow): TrainingSample {
  return {
    inputs: parseJsonArray<number>(row.inputs, []),
    outputs: parseJsonArray<number>(row.outputs, []),
  }
}

export function trainStoredNetwork(
  row: NeuralNetworkRow,
  samples: NeuralNetworkSampleRow[],
  options: {
    maxEpochs?: number
    targetRmse?: number
    learningRate?: number
    momentum?: number
    seed?: number
    activation?: ActivationName
    onEpoch?: (epoch: number, rmse: number) => void
  } = {},
) {
  const network = buildStoredNetwork(row, options.activation, options.seed)
  return trainNetwork(network, samples.map(sampleRowToTrainingSample), {
    maxEpochs: options.maxEpochs,
    targetRmse: options.targetRmse,
    learningRate: options.learningRate,
    momentum: options.momentum,
    seed: options.seed,
    onEpoch: options.onEpoch,
  })
}

export function predictStoredNetwork(row: NeuralNetworkRow, inputs: number[]) {
  return predictNetwork(buildStoredNetwork(row), inputs)
}
