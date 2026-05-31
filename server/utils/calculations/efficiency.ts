/**
 * Efficiency estimation functions
 * Ported from BrouwHulp/BrewBuddy hulpfuncties.pas
 */

/** Calculate brewhouse efficiency from measured OG */
export function brewhouseEfficiency(
  measuredOG: number,
  batchSizeL: number,
  fermentables: Array<{ amount: number; yield: number; addAfterBoil?: boolean }>,
): number {
  if (batchSizeL <= 0) return 0

  // Total possible gravity points at 100% efficiency
  let maxPoints = 0
  for (const f of fermentables) {
    if (!f.addAfterBoil) {
      maxPoints += (f.yield / 100) * 384 * (f.amount / batchSizeL)
    }
  }

  if (maxPoints <= 0) return 0
  const actualPoints = (measuredOG - 1) * 1000
  return (actualPoints / maxPoints) * 100
}

/** Calculate mash efficiency (pre-boil) */
export function mashEfficiency(
  preBoilOG: number,
  preBoilVolumeL: number,
  grainBillKg: number,
  averageYield: number,
): number {
  if (grainBillKg <= 0 || averageYield <= 0) return 0
  const maxExtract = grainBillKg * (averageYield / 100) * 384
  const actualExtract = (preBoilOG - 1) * 1000 * preBoilVolumeL
  const maxExtractInVolume = maxExtract
  if (maxExtractInVolume <= 0) return 0
  return (actualExtract / maxExtractInVolume) * 100
}

/** Estimate efficiency based on equipment history (simple linear regression) */
export function estimateEfficiency(
  historicalBrews: Array<{ waterToGrainRatio: number; efficiency: number }>,
  targetWaterToGrainRatio: number,
): number {
  if (historicalBrews.length < 2) return 75 // default

  // Simple linear regression
  const n = historicalBrews.length
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0
  for (const brew of historicalBrews) {
    sumX += brew.waterToGrainRatio
    sumY += brew.efficiency
    sumXY += brew.waterToGrainRatio * brew.efficiency
    sumX2 += brew.waterToGrainRatio * brew.waterToGrainRatio
  }

  const denominator = n * sumX2 - sumX * sumX
  if (Math.abs(denominator) < 0.001) return sumY / n // all same X, return average

  const slope = (n * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / n

  const estimated = slope * targetWaterToGrainRatio + intercept
  return Math.max(50, Math.min(100, estimated)) // clamp to reasonable range
}

/** Estimate FG using regression-based attenuation prediction */
export function estimateFG(
  og: number,
  attenuationPercent: number,
  mashTempC: number = 66,
  percentCrystalMalt: number = 0,
  percentSugar: number = 0,
): number {
  // Adjust apparent attenuation based on mash temp and adjuncts
  let adjustedAttenuation = attenuationPercent

  // Higher mash temp = less attenuation (~1% per °C above 66)
  if (mashTempC > 66) {
    adjustedAttenuation -= (mashTempC - 66) * 1.0
  } else if (mashTempC < 66) {
    adjustedAttenuation += (66 - mashTempC) * 0.5
  }

  // Crystal malts reduce attenuation (~1% per 5% crystal)
  adjustedAttenuation -= percentCrystalMalt * 0.2

  // Simple sugars increase attenuation (~0.5% per 5% sugar)
  adjustedAttenuation += percentSugar * 0.1

  // Clamp
  adjustedAttenuation = Math.max(50, Math.min(95, adjustedAttenuation))

  const ogPoints = (og - 1) * 1000
  const fgPoints = ogPoints * (1 - adjustedAttenuation / 100)
  return 1 + fgPoints / 1000
}
