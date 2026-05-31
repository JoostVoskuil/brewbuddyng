/**
 * Dilution, concentration (boil-off) and sugar-addition gravity calculations
 * Ported from BrouwHulp/BrewBuddy hulpfuncties.pas
 *
 * Gravity is handled in extract "points" = (SG - 1) * 1000. The total amount of
 * extract is conserved when adding water or boiling off, so points scale
 * inversely with volume.
 */

import { sgToExtract, extractToSG } from './gravity'

/** Gravity after adding plain water (dilution). */
export function dilutedGravity(
  currentSG: number,
  currentVolumeL: number,
  addWaterL: number,
): number {
  const newVolume = currentVolumeL + Math.max(0, addWaterL)
  if (newVolume <= 0) return 1.0
  const points = sgToExtract(currentSG) * (currentVolumeL / newVolume)
  return extractToSG(points)
}

/** Gravity after boiling off water (concentration). */
export function concentratedGravity(
  currentSG: number,
  currentVolumeL: number,
  boilOffL: number,
): number {
  const newVolume = currentVolumeL - Math.max(0, boilOffL)
  if (newVolume <= 0) return currentSG
  const points = sgToExtract(currentSG) * (currentVolumeL / newVolume)
  return extractToSG(points)
}

/** Litres of water to add to reach a (lower) target gravity. Returns 0 if unreachable. */
export function waterToReachGravity(
  currentSG: number,
  currentVolumeL: number,
  targetSG: number,
): number {
  const currentPoints = sgToExtract(currentSG)
  const targetPoints = sgToExtract(targetSG)
  if (targetPoints <= 0 || targetPoints >= currentPoints) return 0
  const targetVolume = (currentPoints * currentVolumeL) / targetPoints
  return targetVolume - currentVolumeL
}

/** Litres to boil off to reach a (higher) target gravity. Returns 0 if unreachable. */
export function boilOffToReachGravity(
  currentSG: number,
  currentVolumeL: number,
  targetSG: number,
): number {
  const currentPoints = sgToExtract(currentSG)
  const targetPoints = sgToExtract(targetSG)
  if (currentPoints <= 0 || targetPoints <= currentPoints) return 0
  const targetVolume = (currentPoints * currentVolumeL) / targetPoints
  return currentVolumeL - targetVolume
}

/**
 * Kilograms of fermentable sugar to add to raise gravity to a target.
 * yieldPercent defaults to 100 (pure sucrose, ~384 points/kg/L).
 */
export function sugarToReachGravity(
  currentSG: number,
  volumeL: number,
  targetSG: number,
  yieldPercent: number = 100,
): number {
  if (volumeL <= 0 || yieldPercent <= 0) return 0
  const deltaPoints = sgToExtract(targetSG) - sgToExtract(currentSG)
  if (deltaPoints <= 0) return 0
  // gravityPoints = (yield/100) * 384 * (kg / volume)  =>  kg = points * volume / ((yield/100)*384)
  return (deltaPoints * volumeL) / ((yieldPercent / 100) * 384)
}
