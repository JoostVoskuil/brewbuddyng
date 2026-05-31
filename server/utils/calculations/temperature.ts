/**
 * Temperature conversion and utility functions
 * Ported from BrouwHulp/BrewBuddy hulpfuncties.pas
 */

/** Convert Fahrenheit to Celsius */
export function fToC(f: number): number {
  return ((f - 32) * 5) / 9
}

/** Convert Celsius to Fahrenheit */
export function cToF(c: number): number {
  return (c * 9) / 5 + 32
}

/** Water density at temperature (kg/L) */
export function waterDensity(tempC: number): number {
  // Polynomial approximation valid for 0-100°C
  const t = tempC
  return 1.0 - ((t - 3.9863) * (t - 3.9863) * (t + 288.9414)) / (508929.2 * (t + 68.12963))
}

/** Hydrometer temperature correction
 * Correct a gravity reading taken at a different temperature than calibration temp
 */
export function hydrometerCorrection(
  sg: number,
  tempC: number,
  calibrationTempC: number = 20,
): number {
  // Correction factor using polynomial
  const correction =
    1.00130346 -
    0.000134722124 * tempC +
    0.00000204052596 * tempC * tempC -
    0.00000000232820948 * tempC * tempC * tempC

  const calibration =
    1.00130346 -
    0.000134722124 * calibrationTempC +
    0.00000204052596 * calibrationTempC * calibrationTempC -
    0.00000000232820948 * calibrationTempC * calibrationTempC * calibrationTempC

  return sg - calibration + correction
}

/** Freezing point of beer/wort based on gravity (°C) */
export function freezingPoint(sg: number): number {
  const plato = sgToPlato(sg)
  return -(plato / 2.2)
}

/** Calculate infusion water volume for mash step
 * Returns liters of water at infusion temp to add
 */
export function infusionVolume(
  targetTempC: number,
  currentTempC: number,
  grainWeightKg: number,
  currentWaterL: number,
  infusionWaterTempC: number = 100,
): number {
  // Heat capacity of grain relative to water
  const grainHeatCapacity = 0.4
  const totalHeatCapacity = grainWeightKg * grainHeatCapacity + currentWaterL
  const deltaT = targetTempC - currentTempC
  const waterDelta = infusionWaterTempC - targetTempC

  if (waterDelta <= 0) return 0
  return (deltaT * totalHeatCapacity) / waterDelta
}

/** Calculate decoction volume (liters of mash to pull and boil) */
export function decoctionVolume(
  targetTempC: number,
  currentTempC: number,
  mashVolumeL: number,
  grainWeightKg: number,
  boilingTempC: number = 100,
): number {
  const grainHeatCapacity = 0.4
  const mashHeatCapacity = mashVolumeL + grainWeightKg * grainHeatCapacity
  const deltaT = targetTempC - currentTempC
  const decoctionDelta = boilingTempC - currentTempC

  if (decoctionDelta <= 0) return 0
  return (deltaT * mashHeatCapacity) / decoctionDelta
}

/** Strike water temperature for initial mash-in */
export function strikeWaterTemp(
  targetMashTempC: number,
  grainTempC: number,
  waterToGrainRatio: number, // L/kg
  tunTempC?: number,
  tunWeight?: number,
  tunSpecificHeat?: number,
): number {
  const grainHeatCapacity = 0.4
  let temp =
    targetMashTempC + (grainHeatCapacity / waterToGrainRatio) * (targetMashTempC - grainTempC)

  // Account for tun heat absorption
  if (tunTempC !== undefined && tunWeight !== undefined && tunSpecificHeat !== undefined) {
    const tunFactor = (tunWeight * tunSpecificHeat) / (waterToGrainRatio * grainHeatCapacity)
    temp += tunFactor * (targetMashTempC - tunTempC)
  }

  return temp
}

// Local helper
function sgToPlato(sg: number): number {
  if (sg <= 0) return 0
  return -616.868 + 1111.14 * sg - 630.272 * sg * sg + 135.997 * sg * sg * sg
}
