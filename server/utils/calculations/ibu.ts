/**
 * IBU (International Bitterness Units) calculation functions
 * Ported from BrouwHulp/BrewBuddy hulpfuncties.pas
 *
 * Supports 6 methods: Tinseth, Rager, Garetz, Daniels, Mosher, Noonan
 */

export type IBUMethod = 'tinseth' | 'rager' | 'garetz' | 'daniels' | 'mosher' | 'noonan'
export type HopUse = 'mash' | 'first_wort' | 'boil' | 'aroma' | 'whirlpool' | 'dry_hop'
export type HopForm = 'pellet' | 'plug' | 'leaf'

export interface HopAddition {
  amount: number // grams
  alpha: number // percentage (e.g. 5.5 for 5.5%)
  time: number // minutes in boil
  use: HopUse
  form: HopForm
}

interface IBUParams {
  og: number // Original Gravity of the boil
  batchSize: number // Final batch volume in liters
  boilSize?: number // Pre-boil volume in liters
}

/** Pellet utilization factor (pellets extract ~10% more) */
function pelletFactor(form: HopForm): number {
  return form === 'pellet' ? 1.1 : 1.0
}

/**
 * Look up a value from a step table by boil time.
 * Each entry is `[maxTimeInclusive, value]`, sorted ascending. The first entry
 * whose threshold is >= `time` wins; if none match, `fallback` is returned.
 */
function stepLookup(
  time: number,
  table: ReadonlyArray<readonly [number, number]>,
  fallback: number,
): number {
  for (const [threshold, value] of table) {
    if (time <= threshold) return value
  }
  return fallback
}

/** Tinseth utilization factor based on boil time */
function tinsethUtilization(boilTime: number, og: number): number {
  const bignessFactor = 1.65 * Math.pow(0.000125, og - 1)
  const boilTimeFactor = (1 - Math.exp(-0.04 * boilTime)) / 4.15
  return bignessFactor * boilTimeFactor
}

/** Calculate IBU for a single hop addition using Tinseth method */
function ibuTinseth(hop: HopAddition, params: IBUParams): number {
  const utilization = tinsethUtilization(hop.time, params.og)
  const mgPerLiter = (hop.amount * 1000 * (hop.alpha / 100) * utilization) / params.batchSize
  return mgPerLiter * pelletFactor(hop.form)
}

/** Rager utilization (%) by boil time, from Rager's published table. */
const RAGER_UTILIZATION: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [5, 5.0],
  [10, 6.0],
  [15, 8.0],
  [20, 10.1],
  [25, 12.1],
  [30, 15.3],
  [35, 18.8],
  [40, 22.8],
  [45, 26.9],
  [50, 28.1],
  [60, 30.0],
]

/** Calculate IBU for a single hop addition using Rager method */
function ibuRager(hop: HopAddition, params: IBUParams): number {
  const utilization = stepLookup(hop.time, RAGER_UTILIZATION, 30.0) / 100

  // Gravity adjustment
  let ga = 0
  if (params.og > 1.05) {
    ga = (params.og - 1.05) / 0.2
  }

  const ibu = (hop.amount * 1000 * (hop.alpha / 100) * utilization) / (params.batchSize * (1 + ga))
  return ibu * pelletFactor(hop.form)
}

/** Garetz utilization fraction by boil time (simplified table). */
const GARETZ_UTILIZATION: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [10, 0.05],
  [20, 0.1],
  [30, 0.15],
  [45, 0.2],
  [60, 0.24],
  [75, 0.27],
  [90, 0.29],
]

/** Calculate IBU using Garetz method */
function ibuGaretz(hop: HopAddition, params: IBUParams): number {
  // Simplified Garetz (concentration factor, hopping rate, temperature)
  const cf = (params.boilSize || params.batchSize) / params.batchSize // concentration factor
  const bg = cf * (params.og - 1) + 1 // boil gravity

  const utilization = stepLookup(hop.time, GARETZ_UTILIZATION, 0.3)

  // Combined adjustment factor
  const gf = bg > 1.05 ? 1 + (bg - 1.05) / 0.2 : 1 // gravity factor
  const tf = (cf * hop.amount * (hop.alpha / 100)) / (params.batchSize * 100) + 1 // temp factor approx

  const ibu = (utilization * (hop.alpha / 100) * hop.amount * 1000) / (params.batchSize * gf * tf)
  return ibu * pelletFactor(hop.form)
}

/** Calculate IBU using Daniels method */
function ibuDaniels(hop: HopAddition, params: IBUParams): number {
  // Daniels uses Rager utilization with gravity correction
  return ibuRager(hop, params)
}

/** Calculate IBU using Mosher method */
function ibuMosher(hop: HopAddition, params: IBUParams): number {
  // Mosher utilization (polynomial approximation)
  const t = hop.time
  let utilization = 0
  if (t > 0) {
    utilization = (-0.0041 * t * t + 6.162 * t + 1.37) / 100
  }
  if (utilization < 0) utilization = 0
  if (utilization > 0.3) utilization = 0.3

  const ibu = (hop.amount * 1000 * (hop.alpha / 100) * utilization) / params.batchSize
  return ibu * pelletFactor(hop.form)
}

/** Noonan utilization fraction by boil time (adjusted Tinseth-like curve). */
const NOONAN_UTILIZATION: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [9, 0.051],
  [19, 0.1],
  [29, 0.153],
  [44, 0.199],
  [59, 0.228],
  [74, 0.252],
  [89, 0.27],
]

/** Calculate IBU using Noonan method */
function ibuNoonan(hop: HopAddition, params: IBUParams): number {
  const utilization = stepLookup(hop.time, NOONAN_UTILIZATION, 0.285)

  const ibu = (hop.amount * 1000 * (hop.alpha / 100) * utilization) / params.batchSize
  return ibu * pelletFactor(hop.form)
}

/** Adjust IBU for non-boil hop uses */
function adjustForUse(ibu: number, use: HopUse): number {
  switch (use) {
    case 'mash':
      return ibu * 0.2 // ~20% utilization from mash hops
    case 'first_wort':
      return ibu * 1.1 // FWH gives ~10% more IBU
    case 'boil':
      return ibu
    case 'aroma':
      return ibu * 0.05 // minimal bitterness from flameout
    case 'whirlpool':
      return ibu * 0.1 // some bitterness from whirlpool
    case 'dry_hop':
      return 0 // no bitterness contribution
    default:
      return ibu
  }
}

/** Calculate IBU for a single hop addition */
export function calculateHopIBU(
  hop: HopAddition,
  params: IBUParams,
  method: IBUMethod = 'tinseth',
): number {
  let ibu: number

  // For non-boil hops, calculate as if boiled for `time` minutes, then adjust
  const effectiveTime = hop.use === 'boil' || hop.use === 'first_wort' ? hop.time : hop.time
  const boilHop = { ...hop, time: effectiveTime }

  switch (method) {
    case 'tinseth':
      ibu = ibuTinseth(boilHop, params)
      break
    case 'rager':
      ibu = ibuRager(boilHop, params)
      break
    case 'garetz':
      ibu = ibuGaretz(boilHop, params)
      break
    case 'daniels':
      ibu = ibuDaniels(boilHop, params)
      break
    case 'mosher':
      ibu = ibuMosher(boilHop, params)
      break
    case 'noonan':
      ibu = ibuNoonan(boilHop, params)
      break
    default:
      ibu = ibuTinseth(boilHop, params)
  }

  return adjustForUse(ibu, hop.use)
}

/** Calculate total IBU for all hop additions */
export function calculateTotalIBU(
  hops: HopAddition[],
  params: IBUParams,
  method: IBUMethod = 'tinseth',
): number {
  return hops.reduce((total, hop) => total + calculateHopIBU(hop, params, method), 0)
}

/** Calculate required hop amount (grams) for a target IBU contribution */
export function calculateHopAmount(
  targetIBU: number,
  alpha: number,
  time: number,
  use: HopUse,
  form: HopForm,
  params: IBUParams,
  method: IBUMethod = 'tinseth',
): number {
  if (targetIBU <= 0 || alpha <= 0 || params.batchSize <= 0) return 0

  if (method === 'tinseth') {
    const ibuPerGram = calculateHopIBU({ amount: 1, alpha, time, use, form }, params, method)
    return ibuPerGram > 0 ? targetIBU / ibuPerGram : 0
  }

  // Non-Tinseth methods can include small non-linear factors; keep a robust inverse.
  let low = 0
  let high = 1000 // max 1kg
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2
    const hop: HopAddition = { amount: mid, alpha, time, use, form }
    const ibu = calculateHopIBU(hop, params, method)
    if (ibu < targetIBU) {
      low = mid
    } else {
      high = mid
    }
  }
  return (low + high) / 2
}
