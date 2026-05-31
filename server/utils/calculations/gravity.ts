/**
 * Gravity conversion functions
 * Ported from BrouwHulp/BrewBuddy hulpfuncties.pas
 */

/** Convert Specific Gravity to Plato degrees */
export function sgToPlato(sg: number): number {
  if (sg <= 0) return 0
  return -616.868 + 1111.14 * sg - 630.272 * sg * sg + 135.997 * sg * sg * sg
}

/** Convert Plato degrees to Specific Gravity */
export function platoToSG(plato: number): number {
  if (plato <= 0) return 1.0
  return 1 + plato / (258.6 - (plato / 258.2) * 227.1)
}

/** Convert Specific Gravity to Brix */
export function sgToBrix(sg: number): number {
  return sgToPlato(sg) // At wort, Brix ≈ Plato before fermentation
}

/** Convert Brix to Specific Gravity (pre-fermentation) */
export function brixToSG(brix: number): number {
  return platoToSG(brix)
}

/** Convert SG to extract (gravity points per liter) */
export function sgToExtract(sg: number): number {
  return (sg - 1) * 1000
}

/** Convert extract (gravity points) to SG */
export function extractToSG(extract: number): number {
  return 1 + extract / 1000
}

/** Gravity points from fermentable: yield%, amount(kg), volume(L) */
export function gravityPoints(yieldPercent: number, amountKg: number, volumeL: number): number {
  if (volumeL <= 0) return 0
  return (yieldPercent / 100) * 384 * (amountKg / volumeL)
}

/** Calculate Original Gravity from a list of fermentables */
export function calculateOG(
  fermentables: Array<{ amount: number; yield: number; addAfterBoil?: boolean }>,
  batchSize: number,
  efficiency: number,
): number {
  if (batchSize <= 0) return 1.0
  let totalPoints = 0
  for (const f of fermentables) {
    const eff = f.addAfterBoil ? 100 : efficiency
    totalPoints += gravityPoints(f.yield, f.amount, batchSize) * (eff / 100)
  }
  return extractToSG(totalPoints)
}

/** Estimate Final Gravity from OG and yeast attenuation (simple) */
export function estimateFGSimple(og: number, attenuationPercent: number): number {
  const ogPoints = sgToExtract(og)
  const fgPoints = ogPoints * (1 - attenuationPercent / 100)
  return extractToSG(fgPoints)
}
