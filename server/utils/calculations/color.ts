/**
 * Color calculation functions
 * Ported from BrouwHulp/BrewBuddy hulpfuncties.pas
 */

/** Convert SRM to EBC */
export function srmToEBC(srm: number): number {
  return srm * 1.97
}

/** Convert EBC to SRM */
export function ebcToSRM(ebc: number): number {
  return ebc / 1.97
}

/** Convert Lovibond to SRM */
export function lovibondToSRM(lovibond: number): number {
  return 1.3546 * lovibond - 0.76
}

/** Convert SRM to Lovibond */
export function srmToLovibond(srm: number): number {
  return (srm + 0.76) / 1.3546
}

export type ColorMethod = 'morey' | 'mosher' | 'daniels'

/** Calculate beer color in SRM using MCU (Malt Color Units) */
export function calculateColorSRM(
  fermentables: Array<{ amount: number; color: number }>, // color in EBC
  batchSize: number,
  method: ColorMethod = 'morey',
): number {
  if (batchSize <= 0) return 0

  // Calculate MCU (Malt Color Units) - sum of (weight_lb * color_lovibond) / volume_gal
  const batchGal = batchSize * 0.264172 // liters to US gallons
  let mcu = 0
  for (const f of fermentables) {
    const weightLb = f.amount * 2.20462 // kg to lbs
    const colorLovibond = srmToLovibond(ebcToSRM(f.color))
    mcu += (weightLb * colorLovibond) / batchGal
  }

  switch (method) {
    case 'morey':
      // Morey equation (most accurate for typical beers)
      return 1.4922 * Math.pow(mcu, 0.6859)
    case 'mosher':
      // Mosher equation
      return 0.3 * mcu + 4.7
    case 'daniels':
      // Daniels equation
      return 0.2 * mcu + 8.4
    default:
      return 1.4922 * Math.pow(mcu, 0.6859)
  }
}

/** Calculate beer color in EBC */
export function calculateColorEBC(
  fermentables: Array<{ amount: number; color: number }>,
  batchSize: number,
  method: ColorMethod = 'morey',
): number {
  return srmToEBC(calculateColorSRM(fermentables, batchSize, method))
}

/** Convert SRM color value to RGB hex color string */
export function srmToRGB(srm: number): string {
  // SRM to RGB mapping (standard beer color chart)
  const r = Math.round(Math.min(255, Math.max(0, 255 * Math.pow(0.975, srm))))
  const g = Math.round(Math.min(255, Math.max(0, 245 * Math.pow(0.88, srm))))
  const b = Math.round(Math.min(255, Math.max(0, 220 * Math.pow(0.7, srm))))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/** Convert EBC color value to RGB hex color string */
export function ebcToRGB(ebc: number): string {
  return srmToRGB(ebcToSRM(ebc))
}
