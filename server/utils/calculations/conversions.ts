/**
 * SG / Plato / Brix conversions and post-fermentation tools.
 *
 * Ported faithfully from the original BrewBuddy (BrouwHulp Eroica) Pascal source
 * (Source/Units/hulpfuncties.pas, Source/UserInterface/Forms/frrefractometer.pas
 * and frboilmethod.pas). Original project by Adrie Otte:
 * https://github.com/BrewBuddyOrg/BrewBuddy
 *
 * These helpers use BrouwHulp's own simple Plato relation (259 − 259/SG) and the
 * configurable Brix correction factor, so the SG/Plato/Brix converter, the
 * "OG after fermentation" tool and the boil test match the desktop application.
 */

import { brixToRI } from './refractometer'

/** Default Brix correction factor used by BrouwHulp (Settings.BrixCorrection). */
export const DEFAULT_BRIX_FACTOR = 1.03

/** Convert Specific Gravity to °Plato (BrouwHulp simple relation). */
export function sgToPlatoBH(sg: number): number {
  if (sg <= 0.5) return 0
  return 259 - 259 / sg
}

/** Convert °Plato to Specific Gravity (BrouwHulp simple relation). */
export function platoToSgBH(plato: number): number {
  if (plato >= 259) return 1.0
  return 259 / (259 - plato)
}

/** Convert Specific Gravity to °Brix using the Brix correction factor. */
export function sgToBrixBH(sg: number, brixFactor: number = DEFAULT_BRIX_FACTOR): number {
  return sgToPlatoBH(sg) * brixFactor
}

/** Convert °Brix to Specific Gravity using the Brix correction factor. */
export function brixToSgBH(brix: number, brixFactor: number = DEFAULT_BRIX_FACTOR): number {
  if (brixFactor <= 0) return 1.0
  return platoToSgBH(brix / brixFactor)
}

/**
 * Final gravity from original and final refractometer Brix readings.
 * BrouwHulp BrixToFG (hulpfuncties.pas). OBrix/FBrix are the raw readings.
 */
export function brixToFgBH(oBrix: number, fBrix: number): number {
  return (
    1.0031 -
    0.002318474 * oBrix -
    0.000007775 * oBrix * oBrix -
    0.000000034 * oBrix * oBrix * oBrix +
    0.00574 * fBrix +
    0.00003344 * fBrix * fBrix +
    0.000000086 * fBrix * fBrix * fBrix
  )
}

/**
 * Alcohol by volume from a measured SG and °Plato (or corrected Brix) of the
 * fermenting/fermented beer. BrouwHulp AlcByVol (hulpfuncties.pas).
 */
export function alcByVolBH(sg: number, plato: number): number {
  return (
    (277.8851 - 277.4 * sg + 0.9956 * plato + 0.00523 * plato * plato + 0.000015 * plato ** 3) *
    (sg / 0.79)
  )
}

/**
 * Alcohol by volume from original and final gravity. BrouwHulp ABVol
 * (hulpfuncties.pas): 486.8693 × (OG − FG) / (4.749804 − FG).
 */
export function abVolBH(og: number, fg: number): number {
  return (486.8693 * (og - fg)) / (4.749804 - fg)
}

export interface WortConversion {
  sg: number
  plato: number
  brix: number
}

/**
 * Convert a single wort measurement (given as SG, Plato or Brix) to all three.
 * Mirrors the top three fields of the BrouwHulp "SG, Brix, Plato" tool.
 */
export function convertWort(
  value: number,
  unit: 'sg' | 'plato' | 'brix',
  brixFactor: number = DEFAULT_BRIX_FACTOR,
): WortConversion {
  let sg: number
  if (unit === 'sg') sg = value
  else if (unit === 'plato') sg = platoToSgBH(value)
  else sg = brixToSgBH(value, brixFactor)
  const plato = sgToPlatoBH(sg)
  return { sg, plato, brix: plato * brixFactor }
}

export interface BeerConversion {
  fg: number
  plato: number
  brix: number
  abv: number
  /** Apparent attenuation (schijnbare vergistingsgraad), %. */
  attenuation: number
}

/**
 * Given the wort (original) Brix and a fermenting/fermented beer Brix reading,
 * derive the beer's FG, Plato, ABV and apparent attenuation. Mirrors the lower
 * three fields of the BrouwHulp "SG, Brix, Plato" tool.
 */
export function convertBeerFromBrix(
  originalBrix: number,
  beerBrix: number,
  brixFactor: number = DEFAULT_BRIX_FACTOR,
): BeerConversion {
  const fg = brixToFgBH(originalBrix, beerBrix)
  const plato = sgToPlatoBH(fg)
  const og = brixToSgBH(originalBrix, brixFactor)
  const abv = abVolBH(og, fg)
  const ogPoints = (og - 1) * 1000
  const fgPoints = (fg - 1) * 1000
  const attenuation = ogPoints > 0 ? ((ogPoints - fgPoints) / ogPoints) * 100 : 0
  return { fg, plato, brix: beerBrix, abv, attenuation }
}

export interface OgAfterFermentation {
  og: number
  abv: number
}

/**
 * Reconstruct the original gravity of a fully fermented beer from a hydrometer
 * SG reading and a refractometer Brix reading of the (degassed) beer.
 * Ported from BrouwHulp frrefractometer.pas ("OG na gisting" tool).
 */
export function ogAfterFermentation(
  fg: number,
  brix: number,
  brixFactor: number = DEFAULT_BRIX_FACTOR,
): OgAfterFermentation {
  const plato = brixFactor > 0 ? brix / brixFactor : brix
  const ri = brixToRI(brix)
  const alc = alcByVolBH(fg, plato)
  const abw = (alc * 0.794) / fg
  const realExtract = 129.8 * fg + 194.5935 + ri * (410.882 * ri - 790.8732)
  const startBrix = realExtract + abw * 2.0665
  const og = platoToSgBH(brixFactor > 0 ? startBrix / brixFactor : startBrix)
  return { og, abv: alc }
}

/**
 * Boil test (Kookproef): determine the alcohol content of a finished beer using
 * only a hydrometer. Measure exactly 100 ml of beer, record its SG at 20 °C,
 * boil off the alcohol, top back up to 100 ml with water and measure SG again.
 * Ported from BrouwHulp frboilmethod.pas: ABV = 717 × (SGafter − SGbefore).
 */
export function boilTestAbv(sgBefore: number, sgAfter: number): number {
  if (sgAfter < sgBefore) return 0
  return 717 * (sgAfter - sgBefore)
}
