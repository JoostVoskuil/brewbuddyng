import type { ImportedRecipe, ImportedFermentable, ImportedHop, ImportedYeast } from './types'

/**
 * Parser for ProMash recipe exports.
 *
 * ProMash can export a recipe as a plain-text "Recipe Report". That text
 * format — not the proprietary binary `.rec` file — is the practical exchange
 * format, and is what BrouwHulp/BrewBuddy historically imported. This parser
 * is deliberately tolerant: ProMash's column layout varies slightly between
 * versions, so we scan line by line, locate the Grain and Hops sections by
 * their headers, and extract the amount/name from each data row.
 *
 * Imperial units in the report are converted to the metric units the rest of
 * the app uses (kg, litres). Hop alpha and grain colour are read when present.
 */

const LBS_TO_KG = 0.45359237
const OZ_TO_KG = 0.0283495231
const GAL_TO_L = 3.785411784

function looksLikeProMash(text: string): boolean {
  const head = text.slice(0, 4000).toLowerCase()
  return (
    head.includes('promash') ||
    (head.includes('recipe specifics') && head.includes('grain/extract'))
  )
}

function matchNumber(text: string, pattern: RegExp, fallback = 0): number {
  const m = text.match(pattern)
  if (!m || m[1] === undefined) return fallback
  const n = parseFloat(m[1])
  return Number.isNaN(n) ? fallback : n
}

function matchString(text: string, pattern: RegExp, fallback = ''): string {
  const m = text.match(pattern)
  return m && m[1] !== undefined ? m[1].trim() : fallback
}

/** Convert an amount + unit token (e.g. "6.00", "lbs.") to kilograms. */
function amountToKg(value: number, unit: string): number {
  const u = unit.toLowerCase().replace(/\./g, '')
  if (u.startsWith('kg')) return value
  if (u === 'g' || u.startsWith('gram')) return value / 1000
  if (u.startsWith('oz')) return value * OZ_TO_KG
  // lb, lbs, lbs. and the default
  return value * LBS_TO_KG
}

/**
 * Return the lines belonging to a section, starting after the line whose text
 * contains `header`, skipping any immediately following ruler line ("-----"),
 * and ending at the first blank line or next section.
 */
function sectionLines(lines: string[], header: RegExp): string[] {
  const startIdx = lines.findIndex((l) => header.test(l))
  if (startIdx === -1) return []
  const out: string[] = []
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i] ?? ''
    if (/^[\s-]*-{3,}[\s-]*$/.test(line)) continue // ruler row
    if (line.trim() === '') {
      if (out.length > 0) break
      continue
    }
    // Stop if we hit what is clearly another section header (a word followed
    // by a ruler on the next line, or a known header keyword).
    if (/^(hops|yeast|water|mash|notes|fermentation)\b/i.test(line.trim()) && out.length > 0) {
      break
    }
    out.push(line)
  }
  return out
}

function parseGrains(lines: string[]): ImportedFermentable[] {
  const grains: ImportedFermentable[] = []
  // Row shapes handled:
  //   " 90.9    10.00 lbs.  Pale Malt(2-row)            US      1.036   2"
  //   "         6.00 lbs.   Maris Otter"
  const row = /^\s*(?:[\d.]+\s+)?([\d.]+)\s*(lbs?\.?|oz\.?|kg|g)\s+(.+?)\s*$/i
  for (const line of lines) {
    const m = line.match(row)
    if (!m) continue
    const amount = parseFloat(m[1] ?? '0')
    const unit = m[2] ?? 'lbs'
    let name = (m[3] ?? '').trim()
    let color = 0
    // Strip a trailing "<potential> <srm>" numeric tail if present.
    const tail = name.match(/^(.*?)\s+[A-Za-z]*\s*([\d.]+)\s+(\d+)\s*$/)
    if (tail && tail[1]) {
      name = tail[1].trim()
      color = parseFloat(tail[3] ?? '0') * 1.97 // SRM → EBC
    }
    if (!name) continue
    grains.push({
      name,
      type: 'Grain',
      amount: Number(amountToKg(amount, unit).toFixed(4)),
      yield: 0,
      color: Number(color.toFixed(1)),
      addAfterBoil: false,
      grainType: 'Base',
      added: 'Mash',
    })
  }
  return grains
}

function parseHops(lines: string[]): ImportedHop[] {
  const hops: ImportedHop[] = []
  // " 1.50 oz.    Cascade            Pellet  5.50  20.1   60 min."
  const row =
    /^\s*([\d.]+)\s*(oz\.?|g|kg|lbs?\.?)\s+(.+?)\s+(Pellet|Whole|Leaf|Plug)\b\s*([\d.]+)?.*?(?:(\d+)\s*min)?\.?\s*$/i
  for (const line of lines) {
    const m = line.match(row)
    if (!m) continue
    const amount = parseFloat(m[1] ?? '0')
    const unit = m[2] ?? 'oz'
    const name = (m[3] ?? '').trim()
    const form = (m[4] ?? 'Pellet').toLowerCase()
    const alpha = m[5] ? parseFloat(m[5]) : 0
    const time = m[6] ? parseFloat(m[6]) : 60
    if (!name) continue
    hops.push({
      name,
      amount: Number(amountToKg(amount, unit).toFixed(5)), // kg
      alpha,
      time,
      use: 'Boil',
      form: form.charAt(0).toUpperCase() + form.slice(1),
    })
  }
  return hops
}

function parseYeasts(lines: string[]): ImportedYeast[] {
  const yeasts: ImportedYeast[] = []
  for (const line of lines) {
    const name = line.trim().replace(/\s{2,}.*$/, '')
    if (name && !/^-+$/.test(name)) {
      yeasts.push({ name, amount: 0, attenuation: 75 })
    }
  }
  return yeasts
}

/**
 * Parse a ProMash text recipe export into our internal recipe shape.
 * Throws if the text does not look like a ProMash report.
 */
export function parseProMash(text: string): ImportedRecipe[] {
  if (!looksLikeProMash(text)) {
    throw new Error('Not a recognisable ProMash recipe export')
  }
  const lines = text.split(/\r?\n/)

  const name =
    matchString(text, /Recipe Name:\s*(.+)/i) ||
    matchString(text, /Recipe:\s*(.+)/i) ||
    'Imported ProMash recipe'

  const batchGal = matchNumber(text, /Batch Size \(Gal\):\s*([\d.]+)/i, 0)
  const batchSize = batchGal > 0 ? Number((batchGal * GAL_TO_L).toFixed(2)) : 20

  const wortGal = matchNumber(text, /Wort Size \(Gal\):\s*([\d.]+)/i, 0)
  const boilSize = wortGal > 0 ? Number((wortGal * GAL_TO_L).toFixed(2)) : batchSize + 5

  const boilTime = matchNumber(text, /(?:Wort )?Boil Time(?:\s*\(.*?\))?:\s*([\d.]+)/i, 60)
  const efficiency = matchNumber(text, /(?:Brewhouse )?Efficiency:\s*([\d.]+)/i, 75)
  const notes = matchString(text, /Recipe Style:\s*(.+)/i)

  const fermentables = parseGrains(sectionLines(lines, /Grain\/Extract\/Sugar|^\s*Grain Bill/i))
  const hops = parseHops(sectionLines(lines, /^\s*Hops\b/i))
  const yeasts = parseYeasts(sectionLines(lines, /^\s*Yeast\b/i))

  return [
    {
      name,
      type: 'All Grain',
      batchSize,
      boilSize,
      boilTime,
      efficiency,
      notes: notes ? `Style: ${notes}` : '',
      fermentables,
      hops,
      yeasts,
      miscs: [],
      waters: [],
    },
  ]
}

export { looksLikeProMash }
