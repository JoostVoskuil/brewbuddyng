/**
 * Blending calculations — combine two or more worts/beers and compute the
 * resulting (virtual) gravity and other volume-weighted properties.
 * Ported from BrouwHulp/BrewBuddy hulpfuncties.pas
 */

import { sgToExtract, extractToSG } from './gravity'

export interface BlendPart {
  /** Specific gravity of this portion */
  sg: number
  /** Volume of this portion (litres) */
  volume: number
}

/** Total volume of all parts. */
export function totalBlendVolume(parts: BlendPart[]): number {
  return parts.reduce((sum, p) => sum + Math.max(0, p.volume), 0)
}

/** Resulting specific gravity when blending the given parts by volume. */
export function blendGravity(parts: BlendPart[]): number {
  const totalVolume = totalBlendVolume(parts)
  if (totalVolume <= 0) return 1.0
  let totalPoints = 0
  for (const p of parts) {
    totalPoints += sgToExtract(p.sg) * Math.max(0, p.volume)
  }
  return extractToSG(totalPoints / totalVolume)
}

/**
 * Volume-weighted average of an arbitrary property (e.g. IBU, colour, ABV).
 * Use this for properties that mix linearly by volume.
 */
export function blendVolumeWeighted(parts: Array<{ value: number; volume: number }>): number {
  const totalVolume = parts.reduce((sum, p) => sum + Math.max(0, p.volume), 0)
  if (totalVolume <= 0) return 0
  const weighted = parts.reduce((sum, p) => sum + p.value * Math.max(0, p.volume), 0)
  return weighted / totalVolume
}
