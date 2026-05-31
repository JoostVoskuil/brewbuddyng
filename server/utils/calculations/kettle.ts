/**
 * Kettle / vessel volume-by-height (dipstick) calculations
 * Ported from BrouwHulp/BrewBuddy hulpfuncties.pas
 *
 * Lets a brewer read the liquid volume from the wetted height on a dipstick.
 * Supports a straight cylindrical vessel (by diameter) and an arbitrary vessel
 * described by a linear calibration (litres per cm with an optional dead-space
 * offset).
 */

/** Volume (litres) of liquid at the given height in a vertical cylinder. */
export function cylinderVolumeLiters(diameterCm: number, heightCm: number): number {
  if (diameterCm <= 0 || heightCm <= 0) return 0
  const radiusCm = diameterCm / 2
  const volumeCm3 = Math.PI * radiusCm * radiusCm * heightCm
  return volumeCm3 / 1000 // 1 L = 1000 cm³
}

/** Height (cm) at which a vertical cylinder holds the given volume. */
export function cylinderHeightForVolume(diameterCm: number, volumeL: number): number {
  if (diameterCm <= 0 || volumeL <= 0) return 0
  const radiusCm = diameterCm / 2
  const volumeCm3 = volumeL * 1000
  return volumeCm3 / (Math.PI * radiusCm * radiusCm)
}

/** Volume (litres) from centimetres measured down from the rim of a straight vessel. */
export function volumeFromCmUnderRim(
  heightCm: number,
  diameterCm: number,
  cmUnderRim: number,
): number {
  if (heightCm <= 0 || diameterCm <= 0 || cmUnderRim < 0 || cmUnderRim >= heightCm) return 0
  return cylinderVolumeLiters(diameterCm, heightCm - cmUnderRim)
}

/** Centimetres below the rim for a target volume in a straight vessel. */
export function cmUnderRimForVolume(heightCm: number, diameterCm: number, volumeL: number): number {
  if (heightCm <= 0 || diameterCm <= 0 || volumeL <= 0) return heightCm > 0 ? heightCm : 0
  const fillHeightCm = cylinderHeightForVolume(diameterCm, volumeL)
  return Math.max(0, heightCm - fillHeightCm)
}

/** Litres per centimetre of height for a vertical cylinder. */
export function litersPerCm(diameterCm: number): number {
  if (diameterCm <= 0) return 0
  const radiusCm = diameterCm / 2
  return (Math.PI * radiusCm * radiusCm) / 1000
}

/**
 * Volume from a linear calibration: litres = litersPerCm * (height - offsetCm).
 * offsetCm models a dead space below the dipstick zero mark.
 */
export function volumeFromCalibration(
  heightCm: number,
  litersPerCmValue: number,
  offsetCm: number = 0,
): number {
  const effective = heightCm - offsetCm
  if (effective <= 0 || litersPerCmValue <= 0) return 0
  return effective * litersPerCmValue
}
