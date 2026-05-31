export interface NeuralCsvSample {
  inputs: number[]
  outputs: number[]
  weight?: number
  useForTraining: boolean
}

export function parseNumericCsv(text: string): number[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) =>
      line
        .split(/[;,\t]/)
        .map((part) => Number(part.trim().replace(',', '.')))
        .filter((value) => Number.isFinite(value)),
    )
    .filter((row) => row.length > 0)
}

export function splitNumbers(value: string): number[] {
  return value
    .split(/[;,\s]+/)
    .map((part) => Number(part.trim().replace(',', '.')))
    .filter((number) => Number.isFinite(number))
}

export function buildCsvSamples(
  rows: number[][],
  inputSize: number,
  outputSize: number,
  trainingPercent = 80,
): NeuralCsvSample[] {
  const trainingCount = Math.round(rows.length * Math.min(100, Math.max(0, trainingPercent)) / 100)
  return rows
    .filter((row) => row.length >= inputSize + outputSize)
    .map((row, index) => ({
      inputs: row.slice(0, inputSize),
      outputs: row.slice(inputSize, inputSize + outputSize),
      useForTraining: index < trainingCount,
    }))
}
