/**
 * Water chemistry calculation functions
 * Ported from BrouwHulp/BrewBuddy hulpfuncties.pas
 */

export interface WaterProfile {
  calcium: number // Ca²⁺ (mg/L)
  magnesium: number // Mg²⁺ (mg/L)
  sodium: number // Na⁺ (mg/L)
  chloride: number // Cl⁻ (mg/L)
  sulfate: number // SO₄²⁻ (mg/L)
  bicarbonate: number // HCO₃⁻ (mg/L)
  ph?: number
}

/**
 * Calculate infusion strike-water temperature for the first mash rest.
 * Formula uses the common metric infusion approximation: Tᵥ = Tₘ + 0.41/R × (Tₘ − Tg),
 * where R is mash thickness in L/kg.
 */
export function strikeTemp(
  grainKg: number,
  grainTempC: number,
  mashRatioLPerKg: number,
  mashTempC: number,
): number {
  if (grainKg <= 0 || mashRatioLPerKg <= 0) return mashTempC
  return mashTempC + (0.41 / mashRatioLPerKg) * (mashTempC - grainTempC)
}

export interface WaterAdditions {
  cacl2: number // Calcium Chloride (grams)
  caso4: number // Gypsum - Calcium Sulfate (grams)
  mgso4: number // Epsom Salt - Magnesium Sulfate (grams)
  nacl: number // Table Salt - Sodium Chloride (grams)
  nahco3: number // Baking Soda - Sodium Bicarbonate (grams)
  caco3: number // Chalk - Calcium Carbonate (grams)
  hcl: number // Hydrochloric Acid (mL)
  h3po4: number // Phosphoric Acid (mL)
  lacticAcid: number // Lactic Acid (mL)
}

/** Calculate Residual Alkalinity (ZRA - Zweig Residual Alkalinity) */
export function residualAlkalinity(water: WaterProfile): number {
  const alkalinity = (water.bicarbonate / 61) * 50 // convert to CaCO3 equivalents
  const ra = alkalinity - water.calcium / 1.4 - water.magnesium / 1.7
  return ra
}

/** Calculate ion balance (should be close to 0 for accurate reading) */
export function ionBalance(water: WaterProfile): number {
  // Cations (meq/L)
  const caCations = water.calcium / 20.04
  const mgCations = water.magnesium / 12.15
  const naCations = water.sodium / 22.99

  // Anions (meq/L)
  const clAnions = water.chloride / 35.45
  const so4Anions = water.sulfate / 48.03
  const hco3Anions = water.bicarbonate / 61.02

  const totalCations = caCations + mgCations + naCations
  const totalAnions = clAnions + so4Anions + hco3Anions

  if (totalCations + totalAnions === 0) return 0
  return ((totalCations - totalAnions) / (totalCations + totalAnions)) * 100
}

/** Calculate the sulfate-to-chloride ratio */
export function sulfateChlorideRatio(water: WaterProfile): number {
  if (water.chloride <= 0) return 0
  return water.sulfate / water.chloride
}

/** Calculate mineral additions effect on water profile */
export function calculateAdditions(
  source: WaterProfile,
  additions: WaterAdditions,
  volumeL: number,
): WaterProfile {
  if (volumeL <= 0) return { ...source }

  const result = { ...source }

  // CaCl2 (Calcium Chloride): adds Ca and Cl
  // Molecular weight: 110.98, Ca: 36.1%, Cl: 63.9%
  result.calcium += (additions.cacl2 * 0.272 * 1000) / volumeL
  result.chloride += (additions.cacl2 * 0.483 * 1000) / volumeL

  // CaSO4 (Gypsum): adds Ca and SO4
  // Molecular weight: 172.17, Ca: 23.3%, SO4: 55.8%
  result.calcium += (additions.caso4 * 0.233 * 1000) / volumeL
  result.sulfate += (additions.caso4 * 0.558 * 1000) / volumeL

  // MgSO4 (Epsom Salt): adds Mg and SO4
  // Molecular weight: 246.47 (heptahydrate), Mg: 9.9%, SO4: 38.9%
  result.magnesium += (additions.mgso4 * 0.099 * 1000) / volumeL
  result.sulfate += (additions.mgso4 * 0.389 * 1000) / volumeL

  // NaCl (Table Salt): adds Na and Cl
  // Molecular weight: 58.44, Na: 39.3%, Cl: 60.7%
  result.sodium += (additions.nacl * 0.393 * 1000) / volumeL
  result.chloride += (additions.nacl * 0.607 * 1000) / volumeL

  // NaHCO3 (Baking Soda): adds Na and HCO3
  // Molecular weight: 84.01, Na: 27.4%, HCO3: 72.6%
  result.sodium += (additions.nahco3 * 0.274 * 1000) / volumeL
  result.bicarbonate += (additions.nahco3 * 0.726 * 1000) / volumeL

  // CaCO3 (Chalk): adds Ca and CO3 (which becomes HCO3)
  // Molecular weight: 100.09, Ca: 40.0%, CO3: 60.0%
  result.calcium += (additions.caco3 * 0.4 * 1000) / volumeL
  result.bicarbonate += (additions.caco3 * 0.6 * 1000 * 1.22) / volumeL // CO3 → HCO3 factor

  return result
}

/** Estimate mash pH from water profile and grain bill */
export function estimateMashPH(
  water: WaterProfile,
  grainColorEBC: number, // weighted average grain color
  _volumeL: number,
): number {
  // Simplified pH estimation based on residual alkalinity and grain color
  // Darker grains lower pH more
  const ra = residualAlkalinity(water)
  const colorFactor = grainColorEBC * 0.002 // darker grain = lower pH
  const basePH = 5.72 // typical distilled water mash pH
  const raPHEffect = ra * 0.0032 // RA effect on pH

  return basePH + raPHEffect - colorFactor
}

/** Calculate acid dissociation fraction (for acid additions) */
export function calcFrac(pH: number, pK1: number, pK2: number, pK3: number): number[] {
  const h = Math.pow(10, -pH)
  const k1 = Math.pow(10, -pK1)
  const k2 = Math.pow(10, -pK2)
  const k3 = Math.pow(10, -pK3)

  const denom = h * h * h + h * h * k1 + h * k1 * k2 + k1 * k2 * k3
  const f0 = (h * h * h) / denom
  const f1 = (h * h * k1) / denom
  const f2 = (h * k1 * k2) / denom
  const f3 = (k1 * k2 * k3) / denom

  return [f0, f1, f2, f3]
}

/** pH temperature compensation (convert from measurement temp to room temp 20°C) */
export function pHAtRoomTemp(pHMeasured: number, tempC: number): number {
  // pH decreases ~0.003 per °C increase for mash
  return pHMeasured + 0.003 * (tempC - 20)
}

/** Supported acids for pH adjustment, with their strength in mEq per millilitre. */
export const ACID_MEQ_PER_ML: Record<'lactic88' | 'phosphoric10' | 'phosphoric75' | 'phosphoric85', number> = {
  lactic88: 11.78, // 88% lactic acid
  phosphoric10: 1.075, // 10% phosphoric acid
  phosphoric75: 12.09, // 75% phosphoric acid
  phosphoric85: 14.7, // 85% phosphoric acid
}

export interface AcidBaseResult {
  /** Estimated current mash pH before adjustment */
  currentPH: number
  /** Requested target mash pH */
  targetPH: number
  /** Millilitres of the selected acid needed to lower pH (0 if a base is needed) */
  acidMl: number
  /** Grams of baking soda (NaHCO₃) needed to raise pH (0 if an acid is needed) */
  bakingSodaGrams: number
}

/**
 * Estimate the acid or base addition needed to move the mash from its estimated
 * pH to a target pH. Builds on {@link estimateMashPH} and {@link residualAlkalinity}:
 * the target residual alkalinity is derived from the same linear model, and the
 * difference is neutralised with acid (to lower pH) or baking soda (to raise it).
 */
export function acidBaseForTargetPH(
  water: WaterProfile,
  grainColorEBC: number,
  volumeL: number,
  targetPH: number,
  acid: keyof typeof ACID_MEQ_PER_ML = 'lactic88',
): AcidBaseResult {
  const currentPH = estimateMashPH(water, grainColorEBC, volumeL)

  // Invert the linear pH model: pH = 5.72 + RA*0.0032 - colorEBC*0.002
  const colorFactor = grainColorEBC * 0.002
  const targetRA = (targetPH - 5.72 + colorFactor) / 0.0032
  const currentRA = residualAlkalinity(water)
  const deltaRA = currentRA - targetRA // mg/L as CaCO₃ to remove (positive => need acid)

  // Convert alkalinity change (mg/L CaCO₃) over the volume to milliequivalents.
  // Equivalent weight of CaCO₃ = 50 mg/mEq.
  const mEq = (Math.abs(deltaRA) / 50) * Math.max(0, volumeL)

  if (deltaRA > 0) {
    return {
      currentPH,
      targetPH,
      acidMl: mEq / ACID_MEQ_PER_ML[acid],
      bakingSodaGrams: 0,
    }
  }

  // Need to raise pH: baking soda (NaHCO₃, eq. weight 84 mg/mEq).
  return {
    currentPH,
    targetPH,
    acidMl: 0,
    bakingSodaGrams: (mEq * 84) / 1000,
  }
}

export interface SpargeAcidResult {
  /** Total carbonate alkalinity of the sparge water (mg/L as CaCO₃) */
  alkalinity: number
  /** Target sparge-water pH */
  targetPH: number
  /** Milliequivalents of acid required across the whole sparge volume */
  acidMeq: number
  /** Millilitres of the selected acid required */
  acidMl: number
}

/**
 * Calculate the acid needed to lower sparge water to a target pH so that no
 * tannins are extracted during lautering. The sparge water alkalinity is taken
 * from its bicarbonate content (HCO₃⁻ ≈ total carbonate at typical tap-water
 * pH); the carbonate equilibrium ({@link calcFrac} with the carbonic-acid pK
 * values) gives the residual alkalinity that remains at the target pH, and the
 * difference is neutralised with the chosen acid.
 */
export function spargeAcidForTargetPH(
  bicarbonate: number,
  volumeL: number,
  targetPH: number,
  acid: keyof typeof ACID_MEQ_PER_ML = 'lactic88',
): SpargeAcidResult {
  const ct = Math.max(0, bicarbonate) / 61 // mmol/L total carbonate (≈ alkalinity in meq/L)
  // Carbonic acid: pK1 6.38, pK2 10.38 (pK3 unused → set high so f3 ≈ 0).
  const [, f1, f2] = calcFrac(targetPH, 6.38, 10.38, 14)
  const alkTargetMeqL = ct * ((f1 ?? 0) + 2 * (f2 ?? 0))
  const acidMeqL = Math.max(0, ct - alkTargetMeqL)
  const acidMeq = acidMeqL * Math.max(0, volumeL)
  return {
    alkalinity: (bicarbonate / 61) * 50,
    targetPH,
    acidMeq,
    acidMl: acidMeq / ACID_MEQ_PER_ML[acid],
  }
}

export type MashPhBand = 'low' | 'target' | 'high'

/** BrouwHulp flavour balance convention: sulfate divided by chloride, both in mg/L. */
export function chlorideToSulfateRatio(water: Pick<WaterProfile, 'chloride' | 'sulfate'>): number {
  const sulfate = Math.max(0, finite(water.sulfate))
  const chloride = Math.max(0, finite(water.chloride))
  if (chloride <= 0) return sulfate > 0 ? Number.POSITIVE_INFINITY : 0
  return sulfate / chloride
}

export function mashPhBand(ph: number): MashPhBand {
  if (!Number.isFinite(ph)) return 'target'
  if (ph < 5.2) return 'low'
  if (ph > 5.6) return 'high'
  return 'target'
}

export type SpargeAcidType = 'lactic88' | 'phosphoric75' | 'acidMalt'

export interface SpargeWaterAcidResult {
  alkalinityMgLAsCaCO3: number
  residualAlkalinityMeqL: number
  targetPH: number
  acidType: SpargeAcidType
  acidMeq: number
  amountMl: number
  amountGrams: number
}

export function acidForSpargeWater(
  water: WaterProfile,
  volumeL: number,
  targetPH = 5.6,
  acidType: SpargeAcidType = 'lactic88',
): SpargeWaterAcidResult {
  const boundedTarget = Math.max(4, Math.min(7, finite(targetPH, 5.6)))
  const residual = residualAlkalinity(water) / 50
  const carbonateAcidMeq = spargeAcidForTargetPH(water.bicarbonate, volumeL, boundedTarget, 'lactic88').acidMeq
  const hardnessCreditMeq = Math.max(0, finite(volumeL)) * (finite(water.calcium) / 20.04 / 3.5 + finite(water.magnesium) / 12.15 / 7)
  const acidMeq = Math.max(0, carbonateAcidMeq - hardnessCreditMeq)
  const amountMl = acidType === 'acidMalt' ? 0 : acidMeq / ACID_MEQ_PER_ML[acidType]
  // BrouwHulp treats acid malt as lactic acid carried by malt; 3% lactic by weight is a practical sauermalz average.
  const acidMaltMeqPerGram = 0.03 / 90.08 * 1000
  const amountGrams = acidType === 'acidMalt' ? acidMeq / acidMaltMeqPerGram : 0
  return {
    alkalinityMgLAsCaCO3: (Math.max(0, finite(water.bicarbonate)) / 61) * 50,
    residualAlkalinityMeqL: residual,
    targetPH: boundedTarget,
    acidType,
    acidMeq,
    amountMl,
    amountGrams,
  }
}

function finite(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
