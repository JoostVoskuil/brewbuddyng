import { describe, it, expect } from 'vitest'
import {
  cylinderVolumeLiters,
  cylinderHeightForVolume,
  litersPerCm,
  volumeFromCalibration,
  volumeFromCmUnderRim,
  cmUnderRimForVolume,
} from '~/server/utils/calculations/kettle'

describe('kettle volume by height', () => {
  it('computes the volume of a cylinder', () => {
    // diameter 30 cm, height 20 cm -> pi * 15^2 * 20 / 1000 ≈ 14.137 L
    expect(cylinderVolumeLiters(30, 20)).toBeCloseTo(14.137, 2)
  })

  it('round-trips height <-> volume', () => {
    const v = cylinderVolumeLiters(30, 20)
    expect(cylinderHeightForVolume(30, v)).toBeCloseTo(20, 4)
  })

  it('reports litres per centimetre', () => {
    // diameter 30 cm -> pi * 225 / 1000 ≈ 0.7069 L/cm
    expect(litersPerCm(30)).toBeCloseTo(0.7069, 3)
  })

  it('applies a linear calibration with dead-space offset', () => {
    // 0.5 L/cm, offset 3 cm, height 13 cm -> (13-3)*0.5 = 5 L
    expect(volumeFromCalibration(13, 0.5, 3)).toBeCloseTo(5, 6)
  })

  it('returns 0 below the offset', () => {
    expect(volumeFromCalibration(2, 0.5, 3)).toBe(0)
  })

  it('round-trips cm under rim to volume and back', () => {
    const volumeL = volumeFromCmUnderRim(50, 40, 12.5)
    const cmUnderRim = cmUnderRimForVolume(50, 40, volumeL)

    expect(volumeL).toBeCloseTo(47.124, 3)
    expect(cmUnderRim).toBeCloseTo(12.5, 2)
  })

  it('returns 0 for non-physical input', () => {
    expect(cylinderVolumeLiters(0, 20)).toBe(0)
    expect(cylinderHeightForVolume(30, 0)).toBe(0)
    expect(volumeFromCmUnderRim(50, 40, 50)).toBe(0)
  })
})
