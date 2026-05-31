export type GrainType =
  | 'Base'
  | 'Kilned'
  | 'Crystal'
  | 'Roast'
  | 'Sour'
  | 'Special'
  | 'No malt'
  | string

export interface MashPhWaterProfile {
  calcium: number
  magnesium: number
  sodium: number
  chloride: number
  sulfate: number
  bicarbonate: number
  ph?: number
}

export interface MashPhGristItem {
  amountKg: number
  colorEbc: number
  grainType?: GrainType
  distilledInfusionPh?: number
  acidTo57?: number
  added?: string
}

export interface MashPhAcids {
  lactic88Ml?: number
  phosphoric75Ml?: number
  acidMaltPercent?: number
}

export interface MashPhInput {
  water: MashPhWaterProfile
  mashVolumeL: number
  grist: MashPhGristItem[]
  acids?: MashPhAcids
}

export interface MashPhResult {
  predictedPh: number
  protonDeficitMeq: number
  residualAlkalinityMeqL: number
  alkalinityMgLAsCaCO3: number
  acidDeficitToTargetMeq: number
}

export const MASH_PH_SOURCE =
  'BrouwHulp/BrewBuddy TWater.MashpH, TWater.ProtonDeficit and TFermentable.BufferCapacity'

const KA1 = 0.0000004445
const KA2 = 0.0000000000468
const CA_EQ_WEIGHT = 40.078 / 2
const MG_EQ_WEIGHT = 24.305 / 2

export function partCO3(ph: number): number {
  const h = 10 ** -ph
  return (100 * KA1 * KA2) / (h * h + h * KA1 + KA1 * KA2)
}

export function partHCO3(ph: number): number {
  const h = 10 ** -ph
  return (100 * KA1 * h) / (h * h + h * KA1 + KA1 * KA2)
}

export function carbonateCharge(ph: number): number {
  return -2 * partCO3(ph) - partHCO3(ph)
}

export function alkalinityMgLAsCaCO3(water: MashPhWaterProfile): number {
  return Math.max(0, finite(water.bicarbonate) / 1.22)
}

export function zAlkalinity(water: MashPhWaterProfile, targetPh: number): number {
  const waterPh = finite(water.ph, 7)
  const deltaCNaught = -carbonateCharge(4.3) + carbonateCharge(waterPh)
  if (Math.abs(deltaCNaught) < 1e-9) return 0
  const totalCarbonate = alkalinityMgLAsCaCO3(water) / 50 / deltaCNaught
  const deltaCZ = -carbonateCharge(targetPh) + carbonateCharge(waterPh)
  return totalCarbonate * deltaCZ
}

export function zResidualAlkalinity(water: MashPhWaterProfile, targetPh: number): number {
  const calciumMeq = finite(water.calcium) / CA_EQ_WEIGHT
  const magnesiumMeq = finite(water.magnesium) / MG_EQ_WEIGHT
  return zAlkalinity(water, targetPh) - (calciumMeq / 3.5 + magnesiumMeq / 7)
}

export function maltBufferCapacityMeqKgPh(grist: MashPhGristItem): number {
  if (
    isFiniteNumber(grist.acidTo57) &&
    isFiniteNumber(grist.distilledInfusionPh) &&
    grist.distilledInfusionPh !== 5.7 &&
    Math.abs(grist.acidTo57) > 0.1
  ) {
    return grist.acidTo57 / (grist.distilledInfusionPh - 5.7)
  }

  const ebc = Math.max(0, finite(grist.colorEbc))
  switch (normaliseGrainType(grist.grainType)) {
    case 'Crystal':
      return -0.0597 * ebc - 32.457
    case 'Roast':
      return 0.0107 * ebc - 54.768
    case 'Sour':
      return -149
    case 'Base':
    case 'Kilned':
    case 'Special':
    default:
      return 0.014 * ebc - 34.192
  }
}

export function estimatedDistilledInfusionPh(grist: MashPhGristItem): number {
  if (isFiniteNumber(grist.distilledInfusionPh) && grist.distilledInfusionPh > 0)
    return grist.distilledInfusionPh
  const ebc = Math.max(0, finite(grist.colorEbc))
  switch (normaliseGrainType(grist.grainType)) {
    case 'Crystal':
      return clamp(5.55 - ebc * 0.0015, 4.65, 5.55)
    case 'Roast':
      return clamp(5.05 - ebc * 0.00035, 4.25, 5.05)
    case 'Sour':
      return 3.5
    case 'Kilned':
      return clamp(5.65 - ebc * 0.001, 5.25, 5.65)
    case 'Special':
      return clamp(5.68 - ebc * 0.001, 5.2, 5.68)
    case 'Base':
    default:
      return clamp(5.72 - ebc * 0.0006, 5.55, 5.72)
  }
}

export function maltAcidRequiredMeq(grist: MashPhGristItem, targetPh: number): number {
  const amountKg = Math.max(0, finite(grist.amountKg))
  if (!amountKg || normaliseGrainType(grist.grainType) === 'No malt') return 0
  return (
    maltBufferCapacityMeqKgPh(grist) * (targetPh - estimatedDistilledInfusionPh(grist)) * amountKg
  )
}

export function acidPotentialMeqAtPh(
  acids: MashPhAcids | undefined,
  ph: number,
  gristKg: number,
): number {
  if (!acids) return 0
  const lacticMmol = (Math.max(0, finite(acids.lactic88Ml)) * 1.214 * 0.88 * 1000) / 90.08
  const phosphoricMmol = (Math.max(0, finite(acids.phosphoric75Ml)) * 1.58 * 0.75 * 1000) / 98
  const lactic = lacticMmol * acidChargeFraction(ph, 3.08, 20, 20)
  const phosphoric = phosphoricMmol * acidChargeFraction(ph, 2.12, 7.2, 12.44)
  const acidMalt = Math.max(0, finite(acids.acidMaltPercent)) * Math.max(0, gristKg) * 6
  return lactic + phosphoric + acidMalt
}

export function acidChargeFraction(ph: number, pK1: number, pK2: number, pK3: number): number {
  const r1 = 10 ** (ph - pK1)
  const r2 = 10 ** (ph - pK2)
  const r3 = 10 ** (ph - pK3)
  const denominator = 1 / (1 + r1 + r1 * r2 + r1 * r2 * r3)
  const f2 = r1 * denominator
  const f3 = r1 * r2 * denominator
  const f4 = r1 * r2 * r3 * denominator
  return f2 + 2 * f3 + 3 * f4
}

export function protonDeficit(input: MashPhInput, ph: number): number {
  const grist = mashGrist(input.grist)
  const gristKg = grist.reduce((sum, item) => sum + Math.max(0, finite(item.amountKg)), 0)
  const waterDeficit = zResidualAlkalinity(input.water, ph) * Math.max(0, finite(input.mashVolumeL))
  const maltDeficit = grist.reduce((sum, item) => sum + maltAcidRequiredMeq(item, ph), 0)
  return waterDeficit + maltDeficit - acidPotentialMeqAtPh(input.acids, ph, gristKg)
}

export function predictMashPh(input: MashPhInput): MashPhResult {
  let ph = 5.4
  const deltaPh = 0.001
  const tolerance = 0.1
  let deficit = protonDeficit(input, ph)
  let iterations = 0

  while ((deficit < -tolerance || deficit > tolerance) && iterations < 1000) {
    ph += deficit > tolerance ? deltaPh : -deltaPh
    ph = clamp(ph, 3.8, 7)
    deficit = protonDeficit(input, ph)
    iterations += 1
  }

  const roundedPh = round(ph, 3)
  return {
    predictedPh: roundedPh,
    protonDeficitMeq: round(deficit, 3),
    residualAlkalinityMeqL: round(zResidualAlkalinity(input.water, roundedPh), 3),
    alkalinityMgLAsCaCO3: round(alkalinityMgLAsCaCO3(input.water), 1),
    acidDeficitToTargetMeq: round(
      Math.max(0, protonDeficit({ ...input, acids: undefined }, finite(input.water.ph, 5.4))),
      3,
    ),
  }
}

export function acidMlForTargetPh(
  input: MashPhInput,
  targetPh: number,
  acid: 'lactic88' | 'phosphoric75' = 'lactic88',
): number {
  const required = Math.max(0, protonDeficit({ ...input, acids: undefined }, targetPh))
  const fraction =
    acid === 'lactic88'
      ? acidChargeFraction(targetPh, 3.08, 20, 20)
      : acidChargeFraction(targetPh, 2.12, 7.2, 12.44)
  const mmolPerMl = acid === 'lactic88' ? (1.214 * 0.88 * 1000) / 90.08 : (1.58 * 0.75 * 1000) / 98
  return round(required / Math.max(0.0001, mmolPerMl * fraction), 2)
}

function mashGrist(grist: MashPhGristItem[]): MashPhGristItem[] {
  return grist.filter(
    (item) => Math.max(0, finite(item.amountKg)) > 0 && (item.added ?? 'Mash') === 'Mash',
  )
}

function normaliseGrainType(type: GrainType | undefined): string {
  const value = (type || 'Base').toLowerCase()
  if (value.includes('crystal') || value.includes('cara')) return 'Crystal'
  if (value.includes('roast') || value.includes('black') || value.includes('chocolate'))
    return 'Roast'
  if (value.includes('sour') || value.includes('acid')) return 'Sour'
  if (value.includes('kiln') || value.includes('munich') || value.includes('vienna'))
    return 'Kilned'
  if (value.includes('special')) return 'Special'
  if (value.includes('no malt') || value.includes('none')) return 'No malt'
  return 'Base'
}

function finite(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
