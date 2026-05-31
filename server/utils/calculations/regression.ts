/**
 * Curve-fitting / regression helpers for brew analysis (X-Y graphs).
 *
 * Ported in spirit from the BrouwHulp/BrewBuddy analysis module, which fits
 * linear, polynomial, exponential and power relations between two brew
 * parameters and reports the coefficient of determination (r²).
 * Original project: https://github.com/BrewBuddyOrg/BrewBuddy
 */

export type FitType = 'linear' | 'polynomial' | 'exponential' | 'power'

export interface FitResult {
  /** Polynomial coefficients in ascending order of power: y = c0 + c1*x + c2*x^2 ... */
  coefficients: number[]
  /** Coefficient of determination (0..1), how well the model fits the data. */
  r2: number
  /** Human-readable equation, e.g. "y = 1.23 + 0.45·x". */
  equation: string
}

export interface Point {
  x: number
  y: number
}

/**
 * Solve a linear system A·c = b with Gaussian elimination (partial pivoting).
 * Returns the solution vector, or null if the matrix is singular.
 */
function solveLinearSystem(a: number[][], b: number[]): number[] | null {
  const n = b.length
  // Build augmented matrix
  const m = a.map((row, i) => [...row, b[i] ?? 0])

  for (let col = 0; col < n; col++) {
    // Partial pivot: find the row with the largest absolute value in this column
    let pivot = col
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(m[r]![col]!) > Math.abs(m[pivot]![col]!)) pivot = r
    }
    if (Math.abs(m[pivot]![col]!) < 1e-12) return null
    // Swap
    const tmp = m[col]!
    m[col] = m[pivot]!
    m[pivot] = tmp

    // Eliminate below
    for (let r = col + 1; r < n; r++) {
      const factor = m[r]![col]! / m[col]![col]!
      for (let c = col; c <= n; c++) {
        m[r]![c]! -= factor * m[col]![c]!
      }
    }
  }

  // Back-substitution
  const x = new Array<number>(n).fill(0)
  for (let row = n - 1; row >= 0; row--) {
    let sum = m[row]![n]!
    for (let c = row + 1; c < n; c++) {
      sum -= m[row]![c]! * x[c]!
    }
    x[row] = sum / m[row]![row]!
  }
  return x
}

/**
 * Fit a polynomial of the given degree using least squares.
 * Returns coefficients in ascending power order, or null if unsolvable.
 */
function fitPolynomial(points: Point[], degree: number): number[] | null {
  const n = points.length
  if (n < degree + 1) return null

  const cols = degree + 1
  // Normal equations: (X^T X) c = X^T y
  const ata: number[][] = Array.from({ length: cols }, () => new Array<number>(cols).fill(0))
  const aty: number[] = new Array<number>(cols).fill(0)

  for (const p of points) {
    const powers: number[] = []
    for (let k = 0; k < cols; k++) powers.push(Math.pow(p.x, k))
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < cols; j++) {
        ata[i]![j]! += powers[i]! * powers[j]!
      }
      aty[i]! += powers[i]! * p.y
    }
  }

  return solveLinearSystem(ata, aty)
}

/** Evaluate a polynomial (ascending coefficients) at x. */
function evalPolynomial(coefficients: number[], x: number): number {
  let result = 0
  for (let k = 0; k < coefficients.length; k++) {
    result += coefficients[k]! * Math.pow(x, k)
  }
  return result
}

/** Coefficient of determination for predicted vs actual y values. */
function rSquared(actual: number[], predicted: number[]): number {
  const n = actual.length
  if (n === 0) return 0
  const mean = actual.reduce((s, v) => s + v, 0) / n
  let ssTot = 0
  let ssRes = 0
  for (let i = 0; i < n; i++) {
    ssTot += (actual[i]! - mean) ** 2
    ssRes += (actual[i]! - predicted[i]!) ** 2
  }
  if (ssTot === 0) return 0
  return Math.max(0, 1 - ssRes / ssTot)
}

function formatNumber(value: number): string {
  if (!isFinite(value)) return '0'
  const abs = Math.abs(value)
  if (abs !== 0 && (abs < 1e-3 || abs >= 1e6)) return value.toExponential(3)
  return Number(value.toFixed(4)).toString()
}

/**
 * Fit a relationship between the X and Y values of the given points.
 *
 * - linear:       y = a + b·x
 * - polynomial:   y = a + b·x + c·x²  (second order)
 * - exponential:  y = a·e^(b·x)   (requires y > 0)
 * - power:        y = a·x^b       (requires x > 0 and y > 0)
 *
 * Returns null when there is not enough valid data to fit the model.
 */
export function fitCurve(points: Point[], type: FitType): FitResult | null {
  const valid = points.filter((p) => isFinite(p.x) && isFinite(p.y))
  if (valid.length < 2) return null

  if (type === 'linear') {
    const coeffs = fitPolynomial(valid, 1)
    if (!coeffs) return null
    const predicted = valid.map((p) => evalPolynomial(coeffs, p.x))
    const r2 = rSquared(
      valid.map((p) => p.y),
      predicted,
    )
    const [a, b] = coeffs
    return {
      coefficients: coeffs,
      r2,
      equation: `y = ${formatNumber(a!)} + ${formatNumber(b!)}·x`,
    }
  }

  if (type === 'polynomial') {
    const coeffs = fitPolynomial(valid, 2)
    if (!coeffs) return null
    const predicted = valid.map((p) => evalPolynomial(coeffs, p.x))
    const r2 = rSquared(
      valid.map((p) => p.y),
      predicted,
    )
    const [a, b, c] = coeffs
    return {
      coefficients: coeffs,
      r2,
      equation: `y = ${formatNumber(a!)} + ${formatNumber(b!)}·x + ${formatNumber(c!)}·x²`,
    }
  }

  if (type === 'exponential') {
    // y = a·e^(b·x)  ->  ln(y) = ln(a) + b·x   (linear fit on ln y)
    const usable = valid.filter((p) => p.y > 0)
    if (usable.length < 2) return null
    const linPoints = usable.map((p) => ({ x: p.x, y: Math.log(p.y) }))
    const coeffs = fitPolynomial(linPoints, 1)
    if (!coeffs) return null
    const lnA = coeffs[0]!
    const b = coeffs[1]!
    const a = Math.exp(lnA)
    const predicted = usable.map((p) => a * Math.exp(b * p.x))
    const r2 = rSquared(
      usable.map((p) => p.y),
      predicted,
    )
    return {
      coefficients: [a, b],
      r2,
      equation: `y = ${formatNumber(a)}·e^(${formatNumber(b)}·x)`,
    }
  }

  // power: y = a·x^b  ->  ln(y) = ln(a) + b·ln(x)
  const usable = valid.filter((p) => p.x > 0 && p.y > 0)
  if (usable.length < 2) return null
  const linPoints = usable.map((p) => ({ x: Math.log(p.x), y: Math.log(p.y) }))
  const coeffs = fitPolynomial(linPoints, 1)
  if (!coeffs) return null
  const lnA = coeffs[0]!
  const b = coeffs[1]!
  const a = Math.exp(lnA)
  const predicted = usable.map((p) => a * Math.pow(p.x, b))
  const r2 = rSquared(
    usable.map((p) => p.y),
    predicted,
  )
  return {
    coefficients: [a, b],
    r2,
    equation: `y = ${formatNumber(a)}·x^${formatNumber(b)}`,
  }
}

/** Predict a y value from a fit result for a given x. */
export function predict(fit: FitResult, type: FitType, x: number): number {
  if (type === 'linear' || type === 'polynomial') {
    return evalPolynomial(fit.coefficients, x)
  }
  const a = fit.coefficients[0]!
  const b = fit.coefficients[1]!
  if (type === 'exponential') return a * Math.exp(b * x)
  return a * Math.pow(x, b) // power
}

export interface HistogramBin {
  /** Lower bound of the bin (inclusive). */
  start: number
  /** Upper bound of the bin (exclusive, except the last bin which is inclusive). */
  end: number
  /** Mid-point label of the bin. */
  center: number
  /** Number of values falling in this bin. */
  count: number
  /** Percentage of the total number of values. */
  percentage: number
}

/**
 * Build a histogram of the given values divided into `intervals` equal-width bins.
 * Returns an empty array when there is no usable data.
 */
export function histogram(values: number[], intervals: number): HistogramBin[] {
  const valid = values.filter((v) => isFinite(v))
  const bins = Math.max(1, Math.floor(intervals))
  if (valid.length === 0) return []

  let min = Math.min(...valid)
  let max = Math.max(...valid)
  if (min === max) {
    // All values identical: a single bin holding everything.
    min -= 0.5
    max += 0.5
  }
  const width = (max - min) / bins

  const result: HistogramBin[] = []
  for (let i = 0; i < bins; i++) {
    const start = min + i * width
    const end = i === bins - 1 ? max : min + (i + 1) * width
    result.push({ start, end, center: (start + end) / 2, count: 0, percentage: 0 })
  }

  for (const v of valid) {
    let index = Math.floor((v - min) / width)
    if (index >= bins) index = bins - 1
    if (index < 0) index = 0
    result[index]!.count += 1
  }

  for (const bin of result) {
    bin.percentage = (bin.count / valid.length) * 100
  }
  return result
}
