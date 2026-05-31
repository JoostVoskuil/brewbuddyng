/**
 * Refractometer calculation functions
 * Ported from BrouwHulp/BrewBuddy hulpfuncties.pas
 */

/** Convert Brix reading to Refractive Index */
export function brixToRI(brix: number): number {
  return 1.33302 + 0.001427193 * brix + 0.000005791157 * brix * brix
}

/** Correct Brix reading with wort correction factor */
export function correctBrix(brixReading: number, wcf: number = 1.04): number {
  return brixReading / wcf
}

/** Calculate OG from refractometer Brix reading */
export function brixToOG(brix: number, wcf: number = 1.04): number {
  const corrected = correctBrix(brix, wcf)
  return (
    1.000019 +
    0.003865613 * corrected +
    0.00001318441 * corrected * corrected +
    0.00000006922 * corrected * corrected * corrected
  )
}

/** Calculate FG from OG Brix and current Brix readings (during/after fermentation) */
export function brixToFG(ogBrix: number, currentBrix: number, wcf: number = 1.04): number {
  const oBrix = correctBrix(ogBrix, wcf)
  const cBrix = correctBrix(currentBrix, wcf)

  // Sean Terrill's cubic formula
  const fg =
    1.0 -
    0.0044993 * oBrix +
    0.011774 * cBrix +
    0.00027581 * oBrix * oBrix -
    0.0012717 * cBrix * cBrix -
    0.00000728 * oBrix * oBrix * oBrix +
    0.000063293 * cBrix * cBrix * cBrix

  return fg
}

/** Calculate Real Extract from SG and Brix readings */
export function realExtractFromBrix(
  ogBrix: number,
  currentBrix: number,
  wcf: number = 1.04,
): number {
  const oBrix = correctBrix(ogBrix, wcf)
  const cBrix = correctBrix(currentBrix, wcf)
  // From Novotný formula
  return 0.1808 * oBrix + 0.8192 * cBrix
}

/** Calculate ABV from refractometer readings */
export function abvFromBrix(ogBrix: number, currentBrix: number, wcf: number = 1.04): number {
  const og = brixToOG(ogBrix, wcf)
  const fg = brixToFG(ogBrix, currentBrix, wcf)
  return (og - fg) * 131.25
}

/** Calculate apparent attenuation from refractometer */
export function attenuationFromBrix(
  ogBrix: number,
  currentBrix: number,
  wcf: number = 1.04,
): number {
  const og = brixToOG(ogBrix, wcf)
  const fg = brixToFG(ogBrix, currentBrix, wcf)
  const ogPoints = (og - 1) * 1000
  const fgPoints = (fg - 1) * 1000
  if (ogPoints <= 0) return 0
  return ((ogPoints - fgPoints) / ogPoints) * 100
}
