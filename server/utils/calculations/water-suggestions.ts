import { predictMashPh, type MashPhGristItem } from './mash-ph'
import {
  acidForSpargeWater,
  calculateAdditions,
  chlorideToSulfateRatio,
  type WaterProfile,
} from './water'

export type SuggestionSaltKey = 'CaCl2' | 'CaSO4' | 'MgSO4' | 'NaCl' | 'NaHCO3' | 'CaCO3'
export type InternalSaltKey = 'cacl2' | 'caso4' | 'mgso4' | 'nacl' | 'nahco3' | 'caco3'

export type SuggestionSalts = Record<SuggestionSaltKey, number>
export type InternalSalts = Record<InternalSaltKey, number>

export interface WaterSuggestionInput {
  sourceWater: WaterProfile
  targetProfile: WaterProfile
  mashVolumeL: number
  spargeVolumeL?: number
  gristEbcDistribution?: MashPhGristItem[]
}

export interface WaterSuggestionResult {
  salts: SuggestionSalts
  acid: { type: 'lactic88'; mL: number }
  predictedMashPh: number
  predictedClSo4: number
  predictedProfile: WaterProfile
}

const SALT_KEYS: InternalSaltKey[] = ['cacl2', 'caso4', 'mgso4', 'nacl', 'nahco3', 'caco3']
const MAX_G_PER_L: Record<InternalSaltKey, number> = {
  cacl2: 0.4,
  caso4: 0.5,
  mgso4: 0.25,
  nacl: 0.2,
  nahco3: 0.15,
  caco3: 0.1,
}
const ZERO_ADDITIONS = {
  cacl2: 0,
  caso4: 0,
  mgso4: 0,
  nacl: 0,
  nahco3: 0,
  caco3: 0,
  hcl: 0,
  h3po4: 0,
  lacticAcid: 0,
}

export function suggestSalts(input: WaterSuggestionInput): WaterSuggestionResult {
  const volumeL = Math.max(
    0.1,
    finite(input.mashVolumeL) + Math.max(0, finite(input.spargeVolumeL)),
  )
  const salts: InternalSalts = { cacl2: 0, caso4: 0, mgso4: 0, nacl: 0, nahco3: 0, caco3: 0 }
  let current = apply(input.sourceWater, salts, volumeL)
  let currentScore = score(current, input.targetProfile)

  for (let i = 0; i < 1000; i += 1) {
    let bestKey: InternalSaltKey | null = null
    let bestProfile = current
    let bestScore = currentScore

    for (const key of SALT_KEYS) {
      const next = { ...salts, [key]: round(salts[key] + 0.1, 3) }
      if (next[key] > MAX_G_PER_L[key] * volumeL) continue
      const profile = apply(input.sourceWater, next, volumeL)
      const nextScore = score(profile, input.targetProfile)
      if (nextScore + 0.000001 < bestScore) {
        bestScore = nextScore
        bestKey = key
        bestProfile = profile
      }
    }

    if (!bestKey) break
    salts[bestKey] = round(salts[bestKey] + 0.1, 3)
    current = bestProfile
    currentScore = bestScore
  }

  const grist = input.gristEbcDistribution?.length
    ? input.gristEbcDistribution
    : [{ amountKg: 5, colorEbc: 8, grainType: 'Base', added: 'Mash' }]
  const mashPh = predictMashPh({
    water: current,
    mashVolumeL: Math.max(0.1, finite(input.mashVolumeL)),
    grist,
  }).predictedPh
  const acidMl = acidForSpargeWater(
    input.sourceWater,
    Math.max(0, finite(input.spargeVolumeL)),
    5.6,
    'lactic88',
  ).amountMl

  return {
    salts: toExternalSalts(salts),
    acid: { type: 'lactic88', mL: round(acidMl, 2) },
    predictedMashPh: mashPh,
    predictedClSo4: round(chlorideToSulfateRatio(current), 2),
    predictedProfile: roundProfile(current),
  }
}

export function targetProfileForStyle(style: {
  name?: string | null
  category?: string | null
  ibuMin?: number | null
  ibuMax?: number | null
  colorMin?: number | null
  colorMax?: number | null
}): WaterProfile {
  const text = `${style.name ?? ''} ${style.category ?? ''}`.toLowerCase()
  const ibu = (finite(style.ibuMin) + finite(style.ibuMax)) / 2
  const srm = (finite(style.colorMin) + finite(style.colorMax)) / 2

  if (text.includes('ipa') || text.includes('bitter') || text.includes('pale ale') || ibu >= 45) {
    return {
      calcium: 140,
      magnesium: 18,
      sodium: 25,
      chloride: 60,
      sulfate: 300,
      bicarbonate: 80,
      ph: 7,
    }
  }
  if (text.includes('stout') || text.includes('porter') || srm >= 25) {
    return {
      calcium: 90,
      magnesium: 8,
      sodium: 45,
      chloride: 70,
      sulfate: 80,
      bicarbonate: 180,
      ph: 7,
    }
  }
  if (text.includes('malt') || text.includes('bock') || text.includes('dubbel')) {
    return {
      calcium: 80,
      magnesium: 8,
      sodium: 25,
      chloride: 120,
      sulfate: 60,
      bicarbonate: 120,
      ph: 7,
    }
  }
  if (text.includes('pils') || text.includes('lager') || text.includes('wheat')) {
    return {
      calcium: 55,
      magnesium: 5,
      sodium: 10,
      chloride: 50,
      sulfate: 60,
      bicarbonate: 40,
      ph: 7,
    }
  }
  return {
    calcium: 75,
    magnesium: 8,
    sodium: 20,
    chloride: 80,
    sulfate: 100,
    bicarbonate: 90,
    ph: 7,
  }
}

function apply(source: WaterProfile, salts: InternalSalts, volumeL: number): WaterProfile {
  return calculateAdditions(source, { ...ZERO_ADDITIONS, ...salts }, volumeL)
}

function score(profile: WaterProfile, target: WaterProfile): number {
  const ionScore = (key: keyof WaterProfile, weight = 1) => {
    const targetValue = Math.max(1, finite(target[key]))
    const overshoot = Math.max(0, finite(profile[key]) - finite(target[key])) / targetValue
    const deficit = Math.max(0, finite(target[key]) - finite(profile[key])) / targetValue
    return weight * (deficit * deficit + overshoot * overshoot * 2.5)
  }
  return (
    ionScore('calcium', 0.8) +
    ionScore('magnesium', 0.4) +
    ionScore('sodium', 0.5) +
    ionScore('chloride') +
    ionScore('sulfate') +
    ionScore('bicarbonate', 0.6)
  )
}

function toExternalSalts(salts: InternalSalts): SuggestionSalts {
  return {
    CaCl2: round(salts.cacl2, 1),
    CaSO4: round(salts.caso4, 1),
    MgSO4: round(salts.mgso4, 1),
    NaCl: round(salts.nacl, 1),
    NaHCO3: round(salts.nahco3, 1),
    CaCO3: round(salts.caco3, 1),
  }
}

function roundProfile(profile: WaterProfile): WaterProfile {
  return {
    calcium: round(profile.calcium, 1),
    magnesium: round(profile.magnesium, 1),
    sodium: round(profile.sodium, 1),
    chloride: round(profile.chloride, 1),
    sulfate: round(profile.sulfate, 1),
    bicarbonate: round(profile.bicarbonate, 1),
    ph: round(profile.ph ?? 7, 2),
  }
}

function finite(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
