import { calculateHopAmount, calculateTotalIBU, type HopAddition, type HopForm, type HopUse } from './ibu'
import { calculateOG } from './gravity'
import { calculateAdditions, type WaterAdditions, type WaterProfile } from './water'

export type HopWizardCategory = 'bittering' | 'flavour' | 'aroma'
export type MaltWizardCategory = 'base' | 'caramel' | 'roast' | 'specialty'

export interface HopWizardInput {
  targetIbu: number
  batchSize: number
  boilSize: number
  og: number
  alpha: number
  form?: HopForm
  proportions: Record<HopWizardCategory, number>
}

export interface HopWizardAddition {
  category: HopWizardCategory
  name: string
  amount: number
  alpha: number
  time: number
  use: 'Boil' | 'Aroma'
  form: 'Pellet' | 'Plug' | 'Leaf'
  ibu: number
}

const HOP_CATEGORY_TIMES: Record<HopWizardCategory, { time: number; use: HopUse; label: string }> = {
  bittering: { time: 60, use: 'boil', label: 'Bittering hop' },
  flavour: { time: 20, use: 'boil', label: 'Flavour hop' },
  aroma: { time: 5, use: 'aroma', label: 'Aroma hop' },
}

function normaliseProportions<T extends string>(proportions: Record<T, number>): Record<T, number> {
  const values = Object.values(proportions) as number[]
  const total = values.reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0)
  const keys = Object.keys(proportions) as T[]
  if (total <= 0) return Object.fromEntries(keys.map((key) => [key, 1 / keys.length])) as Record<T, number>
  return Object.fromEntries(keys.map((key) => [key, Math.max(0, proportions[key]) / total])) as Record<T, number>
}

function titleCase(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}`
}

export function planHopWizard(input: HopWizardInput): HopWizardAddition[] {
  const shares = normaliseProportions(input.proportions)
  const params = {
    og: input.og || 1.05,
    batchSize: input.batchSize || 20,
    boilSize: input.boilSize || input.batchSize || 20,
  }
  const form = input.form ?? 'pellet'
  return (Object.keys(HOP_CATEGORY_TIMES) as HopWizardCategory[])
    .map((category) => {
      const target = Math.max(0, input.targetIbu || 0) * shares[category]
      const band = HOP_CATEGORY_TIMES[category]
      const amount = calculateHopAmount(target, input.alpha || 5, band.time, band.use, form, params)
      const hop: HopAddition = { amount, alpha: input.alpha || 5, time: band.time, use: band.use, form }
      return {
        category,
        name: band.label,
        amount: Math.round(amount),
        alpha: input.alpha || 5,
        time: band.time,
        use: (band.use === 'aroma' ? 'Aroma' : 'Boil') as 'Boil' | 'Aroma',
        form: titleCase(form) as 'Pellet' | 'Plug' | 'Leaf',
        ibu: calculateTotalIBU([hop], params),
      }
    })
    .filter((addition) => addition.amount > 0 || addition.ibu > 0)
}

export interface MaltWizardInput {
  targetOg: number
  batchSize: number
  efficiency: number
  proportions: Record<MaltWizardCategory, number>
  yields?: Partial<Record<MaltWizardCategory, number>>
  colors?: Partial<Record<MaltWizardCategory, number>>
}

export interface MaltWizardFermentable {
  category: MaltWizardCategory
  name: string
  amount: number
  yield: number
  color: number
  grainType: string
  added: 'Mash'
  type: 'Grain'
  addAfterBoil: false
}

const DEFAULT_MALT_YIELDS: Record<MaltWizardCategory, number> = {
  base: 80,
  caramel: 74,
  roast: 68,
  specialty: 70,
}

const DEFAULT_MALT_COLORS: Record<MaltWizardCategory, number> = {
  base: 6,
  caramel: 120,
  roast: 900,
  specialty: 40,
}

const MALT_NAMES: Record<MaltWizardCategory, string> = {
  base: 'Base malt',
  caramel: 'Caramel malt',
  roast: 'Roasted malt',
  specialty: 'Specialty malt',
}

export function planMaltWizard(input: MaltWizardInput): MaltWizardFermentable[] {
  const targetOg = Math.max(1, input.targetOg || 1)
  if (targetOg <= 1 || (input.batchSize || 0) <= 0) return []
  const shares = normaliseProportions(input.proportions)
  const fermentablesFor = (totalKg: number) =>
    (Object.keys(shares) as MaltWizardCategory[]).map((category) => ({
      amount: totalKg * shares[category],
      yield: input.yields?.[category] ?? DEFAULT_MALT_YIELDS[category],
      addAfterBoil: false,
    }))

  let low = 0
  let high = Math.max(1, (targetOg - 1) * input.batchSize * 40)
  while (calculateOG(fermentablesFor(high), input.batchSize, input.efficiency || 75) < targetOg) high *= 2
  for (let i = 0; i < 32; i += 1) {
    const mid = (low + high) / 2
    if (calculateOG(fermentablesFor(mid), input.batchSize, input.efficiency || 75) < targetOg) low = mid
    else high = mid
  }

  return (Object.keys(shares) as MaltWizardCategory[])
    .map((category) => ({
      category,
      name: MALT_NAMES[category],
      amount: Math.round(high * shares[category] * 1000) / 1000,
      yield: input.yields?.[category] ?? DEFAULT_MALT_YIELDS[category],
      color: input.colors?.[category] ?? DEFAULT_MALT_COLORS[category],
      grainType: titleCase(category),
      added: 'Mash' as const,
      type: 'Grain' as const,
      addAfterBoil: false as const,
    }))
    .filter((fermentable) => fermentable.amount > 0)
}

export interface WaterWizardInput {
  sourceA: WaterProfile
  sourceB: WaterProfile
  sourceAPercent: number
  target: WaterProfile
  volumeL: number
}

export interface WaterWizardResult {
  blended: WaterProfile
  additions: WaterAdditions
  finalProfile: WaterProfile
  deltas: WaterProfile
}

export function blendWaterProfiles(a: WaterProfile, b: WaterProfile, aPercent: number): WaterProfile {
  const shareA = Math.min(100, Math.max(0, aPercent || 0)) / 100
  const shareB = 1 - shareA
  return {
    calcium: a.calcium * shareA + b.calcium * shareB,
    magnesium: a.magnesium * shareA + b.magnesium * shareB,
    sodium: a.sodium * shareA + b.sodium * shareB,
    chloride: a.chloride * shareA + b.chloride * shareB,
    sulfate: a.sulfate * shareA + b.sulfate * shareB,
    bicarbonate: a.bicarbonate * shareA + b.bicarbonate * shareB,
    ph: a.ph && b.ph ? a.ph * shareA + b.ph * shareB : (a.ph ?? b.ph),
  }
}

const EMPTY_ADDITIONS: WaterAdditions = {
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

export function planWaterWizard(input: WaterWizardInput): WaterWizardResult {
  const volumeL = Math.max(1, input.volumeL || 1)
  const blended = blendWaterProfiles(input.sourceA, input.sourceB, input.sourceAPercent)
  const additions = { ...EMPTY_ADDITIONS }
  const missingCa = Math.max(0, input.target.calcium - blended.calcium)
  const missingSo4 = Math.max(0, input.target.sulfate - blended.sulfate)
  const missingCl = Math.max(0, input.target.chloride - blended.chloride)
  const missingMg = Math.max(0, input.target.magnesium - blended.magnesium)
  const missingNa = Math.max(0, input.target.sodium - blended.sodium)
  const missingHco3 = Math.max(0, input.target.bicarbonate - blended.bicarbonate)

  additions.mgso4 = (missingMg * volumeL) / (0.099 * 1000)
  additions.caso4 = Math.max(0, (missingSo4 - (additions.mgso4 * 0.389 * 1000) / volumeL) * volumeL) / (0.558 * 1000)
  additions.cacl2 = Math.max(0, missingCl * volumeL) / (0.483 * 1000)
  const calciumAfter = blended.calcium + ((additions.caso4 * 0.233 + additions.cacl2 * 0.272) * 1000) / volumeL
  if (calciumAfter < input.target.calcium && missingCa > 0) {
    additions.cacl2 += ((input.target.calcium - calciumAfter) * volumeL) / (0.272 * 1000)
  }
  additions.nacl = (missingNa * volumeL) / (0.393 * 1000)
  additions.nahco3 = (missingHco3 * volumeL) / (0.726 * 1000)

  for (const key of Object.keys(additions) as (keyof WaterAdditions)[]) additions[key] = Math.round(additions[key] * 100) / 100
  const finalProfile = calculateAdditions(blended, additions, volumeL)
  const deltas = {
    calcium: input.target.calcium - finalProfile.calcium,
    magnesium: input.target.magnesium - finalProfile.magnesium,
    sodium: input.target.sodium - finalProfile.sodium,
    chloride: input.target.chloride - finalProfile.chloride,
    sulfate: input.target.sulfate - finalProfile.sulfate,
    bicarbonate: input.target.bicarbonate - finalProfile.bicarbonate,
    ph: input.target.ph != null && finalProfile.ph != null ? input.target.ph - finalProfile.ph : undefined,
  }
  return { blended, additions, finalProfile, deltas }
}
