/**
 * Shared shape for a recipe parsed from / serialised to an external file
 * format (BeerXML, BrouwHulp XML, Promash). Mirrors the columns of the
 * `recipes` table plus its ingredient child rows, without server-owned
 * fields (id / recipeId / timestamps).
 */
export interface ImportedFermentable {
  name: string
  type: string
  amount: number // kg
  yield: number
  color: number // EBC
  addAfterBoil: boolean
  grainType: string
  added: string
}

export interface ImportedHop {
  name: string
  amount: number // kg
  alpha: number
  time: number // minutes
  use: string
  form: string
}

export interface ImportedYeast {
  name: string
  amount: number
  attenuation: number
}

export interface ImportedMisc {
  name: string
  type: string
  amount: number
  time: number
  use: string
}

export interface ImportedWater {
  name: string
  amount: number // liters
  calcium: number
  bicarbonate: number
  sulfate: number
  chloride: number
  sodium: number
  magnesium: number
}

export interface ImportedMashStep {
  name: string
  type: string // Infusion, Temperature, Decoction
  stepTemp: number // °C
  stepTime: number // minutes
  rampTime: number
  infuseAmount: number // liters
}

/** Embedded BeerXML EQUIPMENT record (volumes in liters, losses in liters). */
export interface ImportedEquipment {
  name: string
  boilSize: number
  batchSize: number
  tunVolume: number
  tunWeight: number
  tunSpecificHeat: number
  topUpWater: number
  topUpKettle: number
  trubChillerLoss: number
  evapRate: number // % per hour
  boilTime: number
  lauterDeadspace: number
  hopUtilization: number
  notes: string
}

export interface ImportedRecipe {
  name: string
  type: string
  batchSize: number
  boilSize: number
  boilTime: number
  efficiency: number
  notes: string
  fermentables: ImportedFermentable[]
  hops: ImportedHop[]
  yeasts: ImportedYeast[]
  miscs: ImportedMisc[]
  waters: ImportedWater[]
  // Embedded BeerXML MASH header + MASH_STEPS. Optional so formats that do not
  // carry mash information (e.g. ProMash) can omit them.
  mashName?: string
  grainTemp?: number
  tunTemp?: number
  spargeTemp?: number
  mashPh?: number
  mashNotes?: string
  mashSteps?: ImportedMashStep[]
  // Embedded BeerXML EQUIPMENT record. Optional; absent when a recipe has no
  // associated equipment profile.
  equipment?: ImportedEquipment
}

export type RecipeExportFormat = 'beerxml' | 'brouwhulp'
