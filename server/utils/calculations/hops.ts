/**
 * Hop aging / alpha-acid deterioration calculations
 * Ported from BrouwHulp/BrewBuddy hulpfuncties.pas
 *
 * Alpha acids degrade over time following an exponential decay. The rate
 * depends on how the hops are stored (temperature, packaging) and on the
 * variety's intrinsic stability (expressed here as the percentage of alpha
 * acids lost after six months at room temperature).
 */

export interface HopAgingParams {
  /** Original alpha acid content (%) */
  alpha: number
  /** Storage time in days */
  days: number
  /**
   * Storage factor: a multiplier on the decay rate.
   * 0.25 ≈ frozen + oxygen-barrier packaging
   * 0.50 ≈ cold (fridge) storage
   * 1.00 ≈ room temperature, sealed (default / reference condition)
   * 1.50–2.00 ≈ warm and/or exposed to air
   */
  storageFactor?: number
  /**
   * Percentage of alpha acids lost after 6 months at the reference condition
   * (storageFactor = 1). Roughly equivalent to the Hop Storage Index: noble
   * hops ~50%, stable high-alpha varieties ~15–20%. Default 35%.
   */
  percentLostSixMonths?: number
}

const REFERENCE_DAYS = 182.5 // 6 months

/** Fraction (0–1) of the original alpha acids remaining after aging. */
export function alphaRemainingFraction(params: HopAgingParams): number {
  const lossFraction = clamp01((params.percentLostSixMonths ?? 35) / 100)
  if (lossFraction <= 0) return 1
  // Per-day decay constant at the reference storage condition.
  const k = -Math.log(1 - lossFraction) / REFERENCE_DAYS
  const sf = params.storageFactor ?? 1
  const days = Math.max(0, params.days)
  return Math.exp(-k * sf * days)
}

/** Alpha acid content (%) remaining after the given storage period. */
export function hopAlphaAfterAging(params: HopAgingParams): number {
  return params.alpha * alphaRemainingFraction(params)
}

/** Percentage of the original alpha acids lost after the given storage period. */
export function hopAlphaPercentLost(params: HopAgingParams): number {
  return (1 - alphaRemainingFraction(params)) * 100
}

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 0.999) return 0.999
  return value
}
