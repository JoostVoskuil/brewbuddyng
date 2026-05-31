/**
 * Recipe scaling and target-bitterness adjustment.
 * Ported from BrouwHulp/BrewBuddy recipe handling (cbScaleVolume,
 * AdjustBitterness in the original Pascal sources).
 *
 * Scaling a recipe to a different batch volume keeps the recipe composition
 * (grain bill ratios, hop ratios, water salts) constant: every ingredient
 * amount scales linearly with the batch volume. The resulting OG/FG/colour stay
 * the same because both extract and volume scale together; IBU stays the same
 * because both hop amount and volume scale together.
 */

/** Linear factor to scale ingredient amounts from one batch volume to another. */
export function volumeScaleFactor(fromVolumeL: number, toVolumeL: number): number {
  if (fromVolumeL <= 0 || toVolumeL <= 0) return 1
  return toVolumeL / fromVolumeL
}

/** Scale a single ingredient amount by a factor, rounded to 4 decimals. */
export function scaleAmount(amount: number, factor: number): number {
  return Math.round((amount || 0) * factor * 10000) / 10000
}

/**
 * Factor to scale hop amounts so the recipe hits a target IBU. Because IBU is
 * linear in hop mass, the factor is simply target / current. Used by the recipe
 * editor's "adjust to target IBU" action (BrouwHulp AdjustBitterness).
 */
export function ibuScaleFactor(currentIbu: number, targetIbu: number): number {
  if (currentIbu <= 0 || targetIbu <= 0) return 1
  return targetIbu / currentIbu
}
