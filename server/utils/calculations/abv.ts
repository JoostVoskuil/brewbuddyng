/**
 * ABV (Alcohol By Volume) calculation functions
 * Ported from BrouwHulp/BrewBuddy hulpfuncties.pas
 */

import { sgToPlato } from './gravity'

/** Calculate Alcohol By Volume from OG and FG */
export function calculateABV(og: number, fg: number): number {
  if (og <= 1.0 || fg <= 0) return 0
  // Standard formula (most common)
  return (og - fg) * 131.25
}

/** Calculate ABV using alternate (more precise) formula */
export function calculateABVAlternate(og: number, fg: number): number {
  if (og <= 1.0 || fg <= 0) return 0
  // More accurate formula from Balling
  const re = realExtract(og, fg)
  const oe = sgToPlato(og)
  if (oe <= 0) return 0
  const abw = (oe - re) / (2.0665 - 0.010665 * oe)
  return abw * (fg / 0.794)
}

/** Calculate Alcohol By Weight */
export function calculateABW(og: number, fg: number): number {
  return calculateABV(og, fg) * 0.794
}

/** Calculate Real Extract (°P) from OG and FG */
export function realExtract(og: number, fg: number): number {
  const oe = sgToPlato(og)
  const ae = sgToPlato(fg)
  // Balling formula
  return 0.1808 * oe + 0.8192 * ae
}

/** Calculate apparent attenuation percentage */
export function apparentAttenuation(og: number, fg: number): number {
  const ogPoints = (og - 1) * 1000
  const fgPoints = (fg - 1) * 1000
  if (ogPoints <= 0) return 0
  return ((ogPoints - fgPoints) / ogPoints) * 100
}

/** Calculate real attenuation percentage */
export function realAttenuation(og: number, fg: number): number {
  const oe = sgToPlato(og)
  const re = realExtract(og, fg)
  if (oe <= 0) return 0
  return ((oe - re) / oe) * 100
}

/** Calculate calories per 330ml serving */
export function calculateCalories(og: number, fg: number): number {
  const re = realExtract(og, fg)
  const abw = calculateABW(og, fg)
  // Formula from http://www.beersmith.com
  const calories = (6.9 * abw + 4.0 * (re - 0.1)) * fg * 3.55
  return Math.round(calories)
}
