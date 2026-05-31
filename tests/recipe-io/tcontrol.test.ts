import { describe, it, expect } from 'vitest'
import { parseTControlLog } from '../../server/utils/recipe-io/tcontrol'

/** A minimal but realistic LVM log: header + column labels + data rows. */
function buildLog(rows: string[]): string {
  return [
    'LabVIEW Measurement',
    'Multi_Headings\tNo',
    'Date\t2023/05/12',
    'Time\t14:30:00.000000',
    '***End_of_Header***',
    'X_Value\tT1\tSetpoint\tCoolPower\tCooling\tT2\tCO2\tSVG\tHeating\tCO22',
    ...rows,
  ].join('\n')
}

describe('parseTControlLog', () => {
  it('parses timestamp, temperatures, CO2 and SG from SVG', () => {
    // OG 1.050; SVG 50% → SG = 1.050 - 0.5 * 0.050 = 1.025
    const log = buildLog(['0\t18.5\t18\t0\t0\t20.1\t1.2\t50\t0\t0'])
    const samples = parseTControlLog(log, 1.05)
    expect(samples).toHaveLength(1)
    expect(samples[0]!.tempS1).toBeCloseTo(18.5, 5)
    expect(samples[0]!.tempS2).toBeCloseTo(20.1, 5)
    expect(samples[0]!.co2).toBeCloseTo(1.2, 5)
    expect(samples[0]!.sg).toBeCloseTo(1.025, 5)
    expect(samples[0]!.datetime).toBe('2023-05-12T14:30:00.000Z')
  })

  it('advances the timestamp by the elapsed seconds column', () => {
    // 7200 s = 2 h after start
    const log = buildLog([
      '0\t18.0\t18\t0\t0\t20\t0\t0\t0\t0',
      '7200\t19.0\t18\t0\t0\t20\t0\t0\t0\t0',
    ])
    const samples = parseTControlLog(log, 0)
    expect(samples).toHaveLength(2)
    expect(samples[1]!.datetime).toBe('2023-05-12T16:30:00.000Z')
  })

  it('keeps only one sample per two hours', () => {
    const rows: string[] = []
    // One row every 30 minutes for 6 hours → 13 rows, but only ~4 kept (0,2,4,6h)
    for (let s = 0; s <= 6 * 3600; s += 1800) {
      rows.push(`${s}\t18\t18\t0\t0\t20\t0\t0\t0\t0`)
    }
    const samples = parseTControlLog(buildLog(rows), 0)
    expect(samples).toHaveLength(4)
  })

  it('leaves SG at 0 when OG is not provided', () => {
    const log = buildLog(['0\t18\t18\t0\t0\t20\t0\t50\t0\t0'])
    const samples = parseTControlLog(log, 0)
    expect(samples[0]!.sg).toBe(0)
  })

  it('handles comma decimal separators', () => {
    const log = buildLog(['0\t18,5\t18\t0\t0\t20,3\t0\t0\t0\t0'])
    const samples = parseTControlLog(log, 0)
    expect(samples[0]!.tempS1).toBeCloseTo(18.5, 5)
    expect(samples[0]!.tempS2).toBeCloseTo(20.3, 5)
  })

  it('returns no samples for an empty data section', () => {
    const log = buildLog([])
    expect(parseTControlLog(log, 1.05)).toHaveLength(0)
  })

  it('tolerates short rows without sensor 2 / CO2 / SVG columns', () => {
    const log = buildLog(['0\t18.0'])
    const samples = parseTControlLog(log, 1.05)
    expect(samples).toHaveLength(1)
    expect(samples[0]!.tempS1).toBeCloseTo(18.0, 5)
    expect(samples[0]!.tempS2).toBe(0)
    expect(samples[0]!.sg).toBe(0)
  })
})
