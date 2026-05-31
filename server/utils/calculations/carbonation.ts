/**
 * Carbonation calculation functions
 * Ported from BrouwHulp/BrewBuddy hulpfuncties.pas
 */

export type PrimingSugar = 'sucrose' | 'glucose' | 'honey' | 'dme' | 'molasses'

/** CO₂ volumes dissolved at given temperature (°C) */
export function dissolvedCO2(tempC: number): number {
  // Henry's law approximation for CO₂ dissolved in beer at 1 atm
  return 3.0378 - 0.050062 * tempC + 0.00026555 * tempC * tempC
}

/** Calculate forced carbonation pressure (PSI) for target CO₂ volumes at temperature */
export function forcedCarbonationPSI(volumesCO2: number, tempC: number): number {
  // Formula: P = (volumes - dissolved) / (kH * T_factor)
  // Using simplified Zahm & Nagel approximation
  const dissolved = dissolvedCO2(tempC)
  if (volumesCO2 <= dissolved) return 0

  // Pressure in PSI using the standard CO2 equilibrium table approximation
  const tempF = (tempC * 9) / 5 + 32
  const psi =
    -16.6999 -
    0.0101059 * tempF * tempF +
    0.00116512 * tempF * tempF * tempF +
    0.173354 * tempF * volumesCO2 +
    4.24267 * volumesCO2 -
    0.0684226 * volumesCO2 * volumesCO2

  return Math.max(0, psi)
}

/** Calculate forced carbonation pressure in Bar */
export function forcedCarbonationBar(volumesCO2: number, tempC: number): number {
  return forcedCarbonationPSI(volumesCO2, tempC) * 0.0689476
}

/** Priming factor: grams of sugar per liter per volume CO₂ */
function primingFactor(sugar: PrimingSugar): number {
  switch (sugar) {
    case 'sucrose':
      return 4.0 // table sugar
    case 'glucose':
      return 4.4 // corn sugar / dextrose
    case 'honey':
      return 5.3 // ~80% fermentable sugar
    case 'dme':
      return 5.8 // dry malt extract
    case 'molasses':
      return 6.3 // molasses
    default:
      return 4.0
  }
}

/** Calculate priming sugar amount (grams) for bottles */
export function primingSugarAmount(
  volumesCO2: number,
  tempC: number,
  beerVolumeL: number,
  sugar: PrimingSugar = 'sucrose',
): number {
  const dissolved = dissolvedCO2(tempC)
  const neededVolumes = volumesCO2 - dissolved
  if (neededVolumes <= 0) return 0
  return neededVolumes * beerVolumeL * primingFactor(sugar)
}

/** Calculate CO₂ volumes from priming sugar amount */
export function co2FromPriming(
  sugarGrams: number,
  tempC: number,
  beerVolumeL: number,
  sugar: PrimingSugar = 'sucrose',
): number {
  const dissolved = dissolvedCO2(tempC)
  const factor = primingFactor(sugar)
  if (beerVolumeL <= 0 || factor <= 0) return dissolved
  return dissolved + sugarGrams / (beerVolumeL * factor)
}

export interface PackagingCarbonationPlan {
  residualCO2: number
  primingSugarGrams: number
  forcedPressurePsi: number
  forcedPressureBar: number
}

/** Calculate the full bottling/kegging carbonation plan for the packaging tab. */
export function packagingCarbonationPlan(
  targetVolumesCO2: number,
  beerTempC: number,
  beerVolumeL: number,
  sugar: PrimingSugar = 'sucrose',
): PackagingCarbonationPlan {
  return {
    residualCO2: dissolvedCO2(beerTempC),
    primingSugarGrams: primingSugarAmount(targetVolumesCO2, beerTempC, beerVolumeL, sugar),
    forcedPressurePsi: forcedCarbonationPSI(targetVolumesCO2, beerTempC),
    forcedPressureBar: forcedCarbonationBar(targetVolumesCO2, beerTempC),
  }
}

/** Typical carbonation ranges by style */
export const carbonationRanges: Record<string, [number, number]> = {
  'British Ales': [1.5, 2.0],
  'Belgian Ales': [2.0, 4.5],
  'American Ales': [2.2, 2.8],
  'German Lagers': [2.4, 2.8],
  'German Wheat': [3.0, 4.5],
  'Porter/Stout': [1.5, 2.3],
  Barleywine: [1.5, 2.3],
  IPA: [2.2, 2.8],
  Pilsner: [2.4, 2.8],
}
