/**
 * TControl fermentation-controller log import (BrouwHulp "Importeer TControl").
 *
 * TControl writes a LabVIEW Measurement file (`.lvm`): a tab-separated text file
 * with a header block terminated by `***End_of_Header***`, followed by a row of
 * column labels and then the data rows. The header contains `Date` and `Time`
 * fields giving the absolute start timestamp; each data row's first column is the
 * elapsed time in seconds.
 *
 * Data columns (1-based, matching the original frmeasurements.pas importer):
 *   1 elapsed seconds   2 T sensor 1   3 setpoint   4 cool power   5 cooling
 *   6 T sensor 2        7 CO2          8 SVG (%)    9 heating     10 CO2 (2)
 *
 * The SVG column is an apparent attenuation percentage; it is converted to a
 * specific gravity using the brew's original gravity:
 *   SG = OG − (SVG/100 · (OG − 1)).
 *
 * To avoid flooding the database, the original importer keeps only one sample
 * every two hours; this port preserves that behaviour.
 */

export interface TControlSample {
  /** Absolute timestamp of the sample (ISO 8601, UTC). */
  datetime: string
  /** Specific gravity derived from the SVG column (0 when unavailable). */
  sg: number
  /** Temperature sensor 1 (beer) in °C. */
  tempS1: number
  /** Temperature sensor 2 (environment) in °C. */
  tempS2: number
  /** CO2 production in l/hour. */
  co2: number
  /** Temperature setpoint in °C. */
  setTemp: number
  /** Cooling power percentage. */
  coolingPower: number
  coolingOn: boolean
  heatingOn: boolean
}

const HEADER_END = '***End_of_Header***'
/** Keep at most one sample per this many hours (BrouwHulp behaviour). */
const SAMPLE_INTERVAL_HOURS = 2

/** Parse a possibly comma-decimal numeric field; returns 0 when not a number. */
function toNumber(field: string | undefined): number {
  if (!field) return 0
  const n = Number(field.trim().replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

/**
 * Parse a TControl `.lvm` log into fermentation measurements.
 *
 * @param content Raw file contents.
 * @param og Original gravity of the brew, used to convert the SVG column to SG.
 *           Pass 0 (or a value ≤ 1) to leave SG at 0.
 */
export function parseTControlLog(content: string, og = 0): TControlSample[] {
  const lines = content.split(/\r?\n/)

  // Data begins after the LAST header terminator; the line immediately after it
  // is the column-label row, so skip it when present.
  let lastHeaderEnd = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]?.trim() === HEADER_END) lastHeaderEnd = i
  }
  let dataStart = lastHeaderEnd + 1
  // Skip the column-label row (its first field is not numeric).
  if (dataStart < lines.length) {
    const firstField = lines[dataStart]?.split('\t')[0]?.trim() ?? ''
    if (firstField === '' || !Number.isFinite(Number(firstField.replace(',', '.')))) {
      dataStart += 1
    }
  }

  // Find the absolute start timestamp from the Date / Time header fields.
  const headerLines = lines.slice(0, lastHeaderEnd >= 0 ? lastHeaderEnd : lines.length)
  const startDate = parseStartDate(headerLines)

  const samples: TControlSample[] = []
  let nextThresholdHours = 0

  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i]
    if (!line || !line.trim()) continue
    const cols = line.split('\t')
    const seconds = toNumber(cols[0])
    const hours = seconds / 3600
    if (hours < nextThresholdHours) continue
    nextThresholdHours = hours + SAMPLE_INTERVAL_HOURS

    const tempS1 = toNumber(cols[1])
    const setTemp = cols.length >= 3 ? toNumber(cols[2]) : 0
    const coolingPower = cols.length >= 4 ? toNumber(cols[3]) : 0
    const coolingOn = cols.length >= 5 ? toNumber(cols[4]) > 0 : false
    const tempS2 = cols.length >= 6 ? toNumber(cols[5]) : 0
    const co2 = cols.length >= 7 ? toNumber(cols[6]) : 0
    const heatingOn = cols.length >= 9 ? toNumber(cols[8]) > 0 : false

    let sg = 0
    if (cols.length >= 8 && og > 1) {
      const svg = toNumber(cols[7])
      sg = og - (svg / 100) * (og - 1)
    }

    const datetime = startDate
      ? new Date(startDate.getTime() + seconds * 1000).toISOString()
      : new Date(Date.UTC(1970, 0, 1) + seconds * 1000).toISOString()

    samples.push({ datetime, sg, tempS1, tempS2, co2, setTemp, coolingPower, coolingOn, heatingOn })
  }

  return samples
}

/**
 * Extract the start timestamp from LVM header `Date` (YYYY/MM/DD) and `Time`
 * (HH:MM:SS[.fff]) fields. Returns null when the date cannot be determined.
 */
function parseStartDate(headerLines: string[]): Date | null {
  let dateStr: string | undefined
  let timeStr: string | undefined
  for (const raw of headerLines) {
    const fields = raw.split('\t').map((f) => f.trim())
    const key = fields[0]
    if (key === 'Date' && fields[1]) dateStr = fields[1]
    else if (key === 'Time' && fields[1]) timeStr = fields[1]
  }
  if (!dateStr) return null

  const dateMatch = dateStr.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)
  if (!dateMatch) return null
  const year = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const day = Number(dateMatch[3])

  let hour = 0
  let minute = 0
  let second = 0
  if (timeStr) {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{1,2}):(\d{1,2}(?:[.,]\d+)?)/)
    if (timeMatch) {
      hour = Number(timeMatch[1])
      minute = Number(timeMatch[2])
      second = Math.round(Number((timeMatch[3] ?? '0').replace(',', '.')))
    }
  }
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second))
}
