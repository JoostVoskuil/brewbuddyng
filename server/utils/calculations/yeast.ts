/**
 * Yeast starter calculation functions
 * Ported from BrouwHulp/BrewBuddy hulpfuncties.pas
 */

export type YeastForm = 'liquid' | 'dry' | 'slant' | 'culture' | 'frozen' | 'bottle'
export type PropagationMode = 'simple' | 'aerated' | 'stirred'

const GROWTH_FACTORS: Record<PropagationMode, number> = {
  simple: 2,
  aerated: 4,
  stirred: 6,
}

const MAX_DENSITY_MILLION_PER_ML: Record<PropagationMode, number> = {
  simple: 100,
  aerated: 150,
  stirred: 200,
}

/** Recommended pitch rate (billion cells per litre per °Plato). */
export function pitchRate(isLager: boolean): number {
  return isLager ? 1.5 : 0.75
}

/** Calculate required yeast cells (billions) from litres, °Plato and pitch rate. */
export function pitchRateCells(volumeL: number, plato: number, pitchRatePerLPerP: number): number {
  if (volumeL <= 0 || plato <= 0 || pitchRatePerLPerP <= 0) return 0
  return volumeL * plato * pitchRatePerLPerP
}

/** Calculate required yeast cells (billions) from original gravity. */
export function requiredCells(og: number, batchSizeL: number, isLager: boolean): number {
  return pitchRateCells(batchSizeL, sgToPlato(og), pitchRate(isLager))
}

/** Apply user-estimated vitality/viability to a cell count. */
export function vitalityAdjustedCells(cellsBillion: number, vitality: number): number {
  if (cellsBillion <= 0) return 0
  return cellsBillion * Math.min(1, Math.max(0, vitality))
}

/** Viable cells in a package (accounting for age). */
export function viableCells(
  initialBillion: number,
  manufactureDateDaysAgo: number,
  form: YeastForm,
): number {
  if (initialBillion <= 0) return 0
  if (form === 'dry') {
    return initialBillion * Math.max(0.5, 1 - Math.max(0, manufactureDateDaysAgo) * 0.001)
  }
  const viability = Math.max(0.05, 1 - Math.max(0, manufactureDateDaysAgo) * 0.007)
  return initialBillion * viability
}

/** Growth factor for a starter (based on Chris White's yeast book). */
export function growthFactor(
  starterVolumeML: number,
  inoculationRateBillion: number,
  _starterOG: number = 1.036,
  useStirPlate: boolean = true,
): number {
  if (starterVolumeML <= 0 || inoculationRateBillion <= 0) return 1

  const inoculationRate = (inoculationRateBillion * 1000) / starterVolumeML

  let growth: number
  if (useStirPlate) {
    if (inoculationRate < 25) growth = 2.5
    else if (inoculationRate < 50) growth = 2.0
    else if (inoculationRate < 100) growth = 1.5
    else growth = 1.2
  } else if (inoculationRate < 25) growth = 1.5
  else if (inoculationRate < 50) growth = 1.4
  else if (inoculationRate < 100) growth = 1.2
  else growth = 1.1

  return growth
}

/** One propagation step, returning billion cells and DME grams for the starter wort. */
export function cascadeStep(
  startingCells: number,
  volumeL: number,
  sg: number,
  mode: PropagationMode,
): { endingCells: number; dmeGrams: number } {
  const dmeGrams = volumeL > 0 && sg > 1 ? volumeL * ((sg - 1) / 0.04) * 1000 : 0
  if (startingCells <= 0 || volumeL <= 0)
    return { endingCells: Math.max(0, startingCells), dmeGrams }

  const growthFactorValue = GROWTH_FACTORS[mode]
  const volumeMl = volumeL * 1000
  const maxCellsByDensity = (MAX_DENSITY_MILLION_PER_ML[mode] * volumeMl) / 1000
  const potentialCells = startingCells * growthFactorValue
  const endingCells = Math.max(startingCells, Math.min(potentialCells, maxCellsByDensity))

  return { endingCells, dmeGrams }
}

/** Calculate starter size needed (in liters) for target cell count. */
export function starterSize(
  targetBillionCells: number,
  availableBillionCells: number,
  starterOG: number = 1.036,
  useStirPlate: boolean = true,
  maxSteps: number = 3,
): Array<{ volumeL: number; cellsAfter: number }> {
  const steps: Array<{ volumeL: number; cellsAfter: number }> = []
  let currentCells = availableBillionCells

  for (let step = 0; step < maxSteps && currentCells < targetBillionCells; step++) {
    const targetInoculationRate = useStirPlate ? 25 : 50
    const volumeML = (currentCells * 1000) / targetInoculationRate
    const volumeL = Math.min(5, Math.max(0.5, volumeML / 1000))

    const growth = growthFactor(volumeL * 1000, currentCells, starterOG, useStirPlate)
    currentCells *= growth

    steps.push({ volumeL: Math.round(volumeL * 10) / 10, cellsAfter: Math.round(currentCells) })
  }

  return steps
}

function sgToPlato(sg: number): number {
  if (sg <= 0) return 0
  return -616.868 + 1111.14 * sg - 630.272 * sg * sg + 135.997 * sg * sg * sg
}
