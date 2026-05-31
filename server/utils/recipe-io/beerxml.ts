import { XMLParser } from 'fast-xml-parser'
import type {
  ImportedRecipe,
  ImportedFermentable,
  ImportedHop,
  ImportedYeast,
  ImportedMisc,
  ImportedWater,
  ImportedMashStep,
  ImportedEquipment,
} from './types'

// --- helpers -------------------------------------------------------------

function toBool(val: unknown): boolean {
  if (typeof val === 'string') return val.toUpperCase() === 'TRUE'
  return Boolean(val)
}

function toNum(val: unknown, fallback = 0): number {
  if (val === undefined || val === null || val === '') return fallback
  const n = parseFloat(String(val))
  return Number.isNaN(n) ? fallback : n
}

function toStr(val: unknown, fallback = ''): string {
  if (val === undefined || val === null) return fallback
  return String(val)
}

/** Coerce a fast-xml-parser node (object, array or undefined) into an array. */
function asArray(val: unknown): Record<string, unknown>[] {
  if (val === undefined || val === null) return []
  const arr = Array.isArray(val) ? val : [val]
  return arr as Record<string, unknown>[]
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// --- parsing -------------------------------------------------------------

/**
 * Parse a BeerXML / BrouwHulp XML document (a `<RECIPES>` root containing one
 * or more `<RECIPE>` nodes) into our internal recipe shape. Returns every
 * recipe found in the file.
 */
export function parseBeerXml(xml: string): ImportedRecipe[] {
  const parser = new XMLParser({
    ignoreAttributes: true,
    isArray: (name) =>
      ['RECIPE', 'FERMENTABLE', 'HOP', 'YEAST', 'MISC', 'WATER', 'MASH_STEP'].includes(name),
  })

  const doc = parser.parse(xml) as Record<string, unknown>
  const recipesNode = (doc.RECIPES ?? doc.recipes) as Record<string, unknown> | undefined
  if (!recipesNode) {
    // A bare <RECIPE> document is also accepted.
    const single = (doc.RECIPE ?? doc.recipe) as unknown
    if (!single) throw new Error('No <RECIPES> or <RECIPE> element found')
    return asArray(single as Record<string, unknown>).map(mapRecipe)
  }

  const recipeNodes = asArray(recipesNode.RECIPE as Record<string, unknown>)
  return recipeNodes.map(mapRecipe)
}

function mapRecipe(node: Record<string, unknown>): ImportedRecipe {
  const fermentablesNode = (node.FERMENTABLES ?? {}) as Record<string, unknown>
  const hopsNode = (node.HOPS ?? {}) as Record<string, unknown>
  const yeastsNode = (node.YEASTS ?? {}) as Record<string, unknown>
  const miscsNode = (node.MISCS ?? {}) as Record<string, unknown>
  const watersNode = (node.WATERS ?? {}) as Record<string, unknown>

  const fermentables: ImportedFermentable[] = asArray(
    fermentablesNode.FERMENTABLE as Record<string, unknown>,
  ).map((f) => ({
    name: toStr(f.NAME, 'Unknown'),
    type: toStr(f.TYPE, 'Grain'),
    amount: toNum(f.AMOUNT),
    yield: toNum(f.YIELD),
    color: toNum(f.COLOR),
    addAfterBoil: toBool(f.ADD_AFTER_BOIL),
    grainType: toStr(f.GRAINTYPE, 'Base'),
    added: toStr(f.ADDED, 'Mash'),
  }))

  const hops: ImportedHop[] = asArray(hopsNode.HOP as Record<string, unknown>).map((h) => ({
    name: toStr(h.NAME, 'Unknown'),
    amount: toNum(h.AMOUNT),
    alpha: toNum(h.ALPHA),
    time: toNum(h.TIME),
    use: toStr(h.USE, 'Boil'),
    form: toStr(h.FORM, 'Pellet'),
  }))

  const yeasts: ImportedYeast[] = asArray(yeastsNode.YEAST as Record<string, unknown>).map((y) => ({
    name: toStr(y.NAME, 'Unknown'),
    amount: toNum(y.AMOUNT),
    attenuation: toNum(y.ATTENUATION, 75),
  }))

  const miscs: ImportedMisc[] = asArray(miscsNode.MISC).map((m) => ({
    name: toStr(m.NAME, 'Unknown'),
    type: toStr(m.TYPE, 'Other'),
    amount: toNum(m.AMOUNT),
    time: toNum(m.TIME),
    use: toStr(m.USE, 'Boil'),
  }))

  const waters: ImportedWater[] = asArray(watersNode.WATER).map((w) => ({
    name: toStr(w.NAME, 'Unknown'),
    amount: toNum(w.AMOUNT),
    calcium: toNum(w.CALCIUM),
    bicarbonate: toNum(w.BICARBONATE),
    sulfate: toNum(w.SULFATE),
    chloride: toNum(w.CHLORIDE),
    sodium: toNum(w.SODIUM),
    magnesium: toNum(w.MAGNESIUM),
  }))

  // Embedded BeerXML MASH record with its MASH_STEPS child set.
  const mashNode = (node.MASH ?? {}) as Record<string, unknown>
  const mashStepsNode = (mashNode.MASH_STEPS ?? {}) as Record<string, unknown>
  const mashSteps: ImportedMashStep[] = asArray(
    mashStepsNode.MASH_STEP as Record<string, unknown>,
  ).map((s) => ({
    name: toStr(s.NAME, 'Step'),
    type: toStr(s.TYPE, 'Infusion'),
    stepTemp: toNum(s.STEP_TEMP, 65),
    stepTime: toNum(s.STEP_TIME, 60),
    rampTime: toNum(s.RAMP_TIME),
    infuseAmount: toNum(s.INFUSE_AMOUNT),
  }))

  const rawType = toStr(node.TYPE, 'All Grain')
  const type = ['All Grain', 'Extract', 'Partial Mash'].includes(rawType) ? rawType : 'All Grain'

  // Embedded BeerXML EQUIPMENT record (optional).
  const equipmentNode = node.EQUIPMENT as Record<string, unknown> | undefined
  const equipment: ImportedEquipment | undefined = equipmentNode
    ? {
        name: toStr(equipmentNode.NAME, 'Equipment'),
        boilSize: toNum(equipmentNode.BOIL_SIZE),
        batchSize: toNum(equipmentNode.BATCH_SIZE),
        tunVolume: toNum(equipmentNode.TUN_VOLUME),
        tunWeight: toNum(equipmentNode.TUN_WEIGHT),
        tunSpecificHeat: toNum(equipmentNode.TUN_SPECIFIC_HEAT, 0.12),
        topUpWater: toNum(equipmentNode.TOP_UP_WATER),
        topUpKettle: toNum(equipmentNode.TOP_UP_KETTLE),
        trubChillerLoss: toNum(equipmentNode.TRUB_CHILLER_LOSS),
        evapRate: toNum(equipmentNode.EVAP_RATE, 10),
        boilTime: toNum(equipmentNode.BOIL_TIME, 60),
        lauterDeadspace: toNum(equipmentNode.LAUTER_DEADSPACE),
        hopUtilization: toNum(equipmentNode.HOP_UTILIZATION, 100),
        notes: toStr(equipmentNode.NOTES),
      }
    : undefined

  return {
    name: toStr(node.NAME, 'Imported recipe'),
    type,
    batchSize: toNum(node.BATCH_SIZE, 20),
    boilSize: toNum(node.BOIL_SIZE, 25),
    boilTime: toNum(node.BOIL_TIME, 60),
    efficiency: toNum(node.EFFICIENCY, 75),
    notes: toStr(node.NOTES),
    fermentables,
    hops,
    yeasts,
    miscs,
    waters,
    mashName: toStr(mashNode.NAME, 'Mash'),
    grainTemp: toNum(mashNode.GRAIN_TEMP, 20),
    tunTemp: toNum(mashNode.TUN_TEMP, 20),
    spargeTemp: toNum(mashNode.SPARGE_TEMP, 78),
    mashPh: toNum(mashNode.PH),
    mashNotes: toStr(mashNode.NOTES),
    mashSteps,
    equipment,
  }
}

// --- serialising ---------------------------------------------------------

function tag(name: string, value: string | number | boolean, indent: string): string {
  const text = typeof value === 'boolean' ? (value ? 'TRUE' : 'FALSE') : String(value)
  return `${indent}<${name}>${escapeXml(text)}</${name}>`
}

/**
 * Serialise a recipe to BeerXML 1.0. BrouwHulp reads this same format, so it
 * doubles as the "BrouwHulp XML" export.
 */
export function generateBeerXml(recipe: ImportedRecipe): string {
  const lines: string[] = []
  lines.push('<?xml version="1.0" encoding="utf-8"?>')
  lines.push('<RECIPES>')
  lines.push('  <RECIPE>')
  lines.push(tag('NAME', recipe.name, '    '))
  lines.push(tag('VERSION', 1, '    '))
  lines.push(tag('TYPE', recipe.type, '    '))
  lines.push(tag('BATCH_SIZE', recipe.batchSize, '    '))
  lines.push(tag('BOIL_SIZE', recipe.boilSize, '    '))
  lines.push(tag('BOIL_TIME', recipe.boilTime, '    '))
  lines.push(tag('EFFICIENCY', recipe.efficiency, '    '))

  // Embedded EQUIPMENT record (BeerXML 1.0), when the recipe has a profile.
  if (recipe.equipment) {
    const e = recipe.equipment
    lines.push('    <EQUIPMENT>')
    lines.push(tag('NAME', e.name, '      '))
    lines.push(tag('VERSION', 1, '      '))
    lines.push(tag('BOIL_SIZE', e.boilSize, '      '))
    lines.push(tag('BATCH_SIZE', e.batchSize, '      '))
    lines.push(tag('TUN_VOLUME', e.tunVolume, '      '))
    lines.push(tag('TUN_WEIGHT', e.tunWeight, '      '))
    lines.push(tag('TUN_SPECIFIC_HEAT', e.tunSpecificHeat, '      '))
    lines.push(tag('TOP_UP_WATER', e.topUpWater, '      '))
    lines.push(tag('TRUB_CHILLER_LOSS', e.trubChillerLoss, '      '))
    lines.push(tag('EVAP_RATE', e.evapRate, '      '))
    lines.push(tag('BOIL_TIME', e.boilTime, '      '))
    lines.push(tag('LAUTER_DEADSPACE', e.lauterDeadspace, '      '))
    lines.push(tag('TOP_UP_KETTLE', e.topUpKettle, '      '))
    lines.push(tag('HOP_UTILIZATION', e.hopUtilization, '      '))
    if (e.notes) lines.push(tag('NOTES', e.notes, '      '))
    lines.push('    </EQUIPMENT>')
  }

  lines.push('    <FERMENTABLES>')
  for (const f of recipe.fermentables) {
    lines.push('      <FERMENTABLE>')
    lines.push(tag('NAME', f.name, '        '))
    lines.push(tag('VERSION', 1, '        '))
    lines.push(tag('TYPE', f.type, '        '))
    lines.push(tag('AMOUNT', f.amount, '        '))
    lines.push(tag('YIELD', f.yield, '        '))
    lines.push(tag('COLOR', f.color, '        '))
    lines.push(tag('ADD_AFTER_BOIL', f.addAfterBoil, '        '))
    lines.push(tag('GRAINTYPE', f.grainType, '        '))
    lines.push(tag('ADDED', f.added, '        '))
    lines.push('      </FERMENTABLE>')
  }
  lines.push('    </FERMENTABLES>')

  lines.push('    <HOPS>')
  for (const h of recipe.hops) {
    lines.push('      <HOP>')
    lines.push(tag('NAME', h.name, '        '))
    lines.push(tag('VERSION', 1, '        '))
    lines.push(tag('AMOUNT', h.amount, '        '))
    lines.push(tag('ALPHA', h.alpha, '        '))
    lines.push(tag('TIME', h.time, '        '))
    lines.push(tag('USE', h.use, '        '))
    lines.push(tag('FORM', h.form, '        '))
    lines.push('      </HOP>')
  }
  lines.push('    </HOPS>')

  lines.push('    <YEASTS>')
  for (const y of recipe.yeasts) {
    lines.push('      <YEAST>')
    lines.push(tag('NAME', y.name, '        '))
    lines.push(tag('VERSION', 1, '        '))
    lines.push(tag('AMOUNT', y.amount, '        '))
    lines.push(tag('ATTENUATION', y.attenuation, '        '))
    lines.push('      </YEAST>')
  }
  lines.push('    </YEASTS>')

  lines.push('    <MISCS>')
  for (const m of recipe.miscs) {
    lines.push('      <MISC>')
    lines.push(tag('NAME', m.name, '        '))
    lines.push(tag('VERSION', 1, '        '))
    lines.push(tag('TYPE', m.type || 'Other', '        '))
    lines.push(tag('AMOUNT', m.amount, '        '))
    lines.push(tag('TIME', m.time, '        '))
    lines.push(tag('USE', m.use, '        '))
    lines.push('      </MISC>')
  }
  lines.push('    </MISCS>')

  lines.push('    <WATERS>')
  for (const w of recipe.waters) {
    lines.push('      <WATER>')
    lines.push(tag('NAME', w.name, '        '))
    lines.push(tag('VERSION', 1, '        '))
    lines.push(tag('AMOUNT', w.amount, '        '))
    lines.push(tag('CALCIUM', w.calcium, '        '))
    lines.push(tag('BICARBONATE', w.bicarbonate, '        '))
    lines.push(tag('SULFATE', w.sulfate, '        '))
    lines.push(tag('CHLORIDE', w.chloride, '        '))
    lines.push(tag('SODIUM', w.sodium, '        '))
    lines.push(tag('MAGNESIUM', w.magnesium, '        '))
    lines.push('      </WATER>')
  }
  lines.push('    </WATERS>')

  // Embedded MASH record with its MASH_STEPS child set (BeerXML 1.0).
  lines.push('    <MASH>')
  lines.push(tag('NAME', recipe.mashName || 'Mash', '      '))
  lines.push(tag('VERSION', 1, '      '))
  lines.push(tag('GRAIN_TEMP', recipe.grainTemp ?? 20, '      '))
  lines.push(tag('TUN_TEMP', recipe.tunTemp ?? 20, '      '))
  lines.push(tag('SPARGE_TEMP', recipe.spargeTemp ?? 78, '      '))
  if (recipe.mashPh) lines.push(tag('PH', recipe.mashPh, '      '))
  if (recipe.mashNotes) lines.push(tag('NOTES', recipe.mashNotes, '      '))
  lines.push('      <MASH_STEPS>')
  for (const s of recipe.mashSteps ?? []) {
    lines.push('        <MASH_STEP>')
    lines.push(tag('NAME', s.name, '          '))
    lines.push(tag('VERSION', 1, '          '))
    lines.push(tag('TYPE', s.type, '          '))
    lines.push(tag('STEP_TEMP', s.stepTemp, '          '))
    lines.push(tag('STEP_TIME', s.stepTime, '          '))
    lines.push(tag('RAMP_TIME', s.rampTime, '          '))
    lines.push(tag('INFUSE_AMOUNT', s.infuseAmount, '          '))
    lines.push('        </MASH_STEP>')
  }
  lines.push('      </MASH_STEPS>')
  lines.push('    </MASH>')

  if (recipe.notes) lines.push(tag('NOTES', recipe.notes, '    '))
  lines.push('  </RECIPE>')
  lines.push('</RECIPES>')
  return lines.join('\n')
}
