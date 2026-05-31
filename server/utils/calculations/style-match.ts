/**
 * Style-match wizard (BrouwHulp "Stijl zoeken"): score how well a set of recipe
 * metrics (OG, FG, IBU, colour, ABV) fits the published range of a beer style
 * and rank the candidate styles from best to worst match.
 *
 * All metrics are compared in their native style-guide units:
 *   - OG / FG  : specific gravity (e.g. 1.050)
 *   - IBU      : International Bittering Units
 *   - colour   : SRM (convert EBC → SRM before calling, see ebcToSRM)
 *   - ABV      : percent by volume
 */

/** Inclusive min/max range for a single style metric. */
export interface MetricRange {
  min: number
  max: number
}

/** The published ranges for a beer style. */
export interface StyleRanges {
  og?: MetricRange
  fg?: MetricRange
  ibu?: MetricRange
  colorSrm?: MetricRange
  abv?: MetricRange
}

/** The computed metrics of a recipe to match against styles. */
export interface RecipeMetrics {
  og?: number
  fg?: number
  ibu?: number
  colorSrm?: number
  abv?: number
}

/** Fit of one metric against one style range. */
export interface MetricFit {
  key: keyof RecipeMetrics
  value: number
  min: number
  max: number
  inRange: boolean
  /** 0..1 where 1 means inside the range and 0 means far outside. */
  fit: number
}

/** Result of matching a recipe to a single style. */
export interface StyleMatch<T = unknown> {
  style: T
  /** Overall match score, 0..1 (1 = every metric inside range). */
  score: number
  /** Number of evaluated metrics that fall inside the style range. */
  inRangeCount: number
  /** Number of metrics that could be evaluated. */
  evaluatedCount: number
  fits: MetricFit[]
}

/**
 * Fit of a single value against an inclusive [min, max] range.
 *
 * Returns 1 when the value is inside the range. Outside the range the fit decays
 * linearly with the distance from the nearest bound, measured in units of the
 * range width, reaching 0 at one full range width beyond the bound.
 */
export function metricFit(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0
  const lo = Math.min(min, max)
  const hi = Math.max(min, max)
  if (value >= lo && value <= hi) return 1
  const width = hi - lo
  const dist = value < lo ? lo - value : value - hi
  if (width <= 0) {
    // Degenerate range (single point): tolerate a small relative window.
    const tol = Math.max(Math.abs(hi), 1e-9) * 0.05
    return Math.max(0, 1 - dist / tol)
  }
  return Math.max(0, 1 - dist / width)
}

const METRIC_KEYS: Array<[keyof RecipeMetrics, keyof StyleRanges]> = [
  ['og', 'og'],
  ['fg', 'fg'],
  ['ibu', 'ibu'],
  ['colorSrm', 'colorSrm'],
  ['abv', 'abv'],
]

/**
 * Score how well the given recipe metrics fit a style's published ranges.
 * Only metrics that are present on BOTH the recipe and the style are evaluated;
 * the overall score is the mean fit across those metrics.
 */
export function scoreStyleMatch<T>(
  metrics: RecipeMetrics,
  style: T,
  ranges: StyleRanges,
): StyleMatch<T> {
  const fits: MetricFit[] = []
  for (const [mKey, rKey] of METRIC_KEYS) {
    const value = metrics[mKey]
    const range = ranges[rKey]
    if (value == null || !Number.isFinite(value) || !range) continue
    if (!Number.isFinite(range.min) || !Number.isFinite(range.max)) continue
    const fit = metricFit(value, range.min, range.max)
    fits.push({
      key: mKey,
      value,
      min: range.min,
      max: range.max,
      inRange: fit >= 1,
      fit,
    })
  }
  const evaluatedCount = fits.length
  const inRangeCount = fits.filter((f) => f.inRange).length
  const score = evaluatedCount === 0 ? 0 : fits.reduce((s, f) => s + f.fit, 0) / evaluatedCount
  return { style, score, inRangeCount, evaluatedCount, fits }
}

/**
 * Rank a list of styles by how well the recipe metrics fit each one's ranges.
 * Styles with no evaluable metric are excluded. Results are sorted by score
 * (descending), then by the number of metrics inside the range.
 */
export function rankStyleMatches<T>(
  metrics: RecipeMetrics,
  styles: Array<{ style: T; ranges: StyleRanges }>,
): Array<StyleMatch<T>> {
  return styles
    .map(({ style, ranges }) => scoreStyleMatch(metrics, style, ranges))
    .filter((m) => m.evaluatedCount > 0)
    .sort((a, b) => b.score - a.score || b.inRangeCount - a.inRangeCount)
}
