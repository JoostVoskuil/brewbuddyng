import { describe, expect, it } from 'vitest'
import { suggestSalts, targetProfileForStyle } from '~/server/utils/calculations/water-suggestions'
import type { WaterProfile } from '~/server/utils/calculations/water'

const softWater: WaterProfile = {
  calcium: 8,
  magnesium: 2,
  sodium: 6,
  chloride: 8,
  sulfate: 10,
  bicarbonate: 25,
  ph: 7.2,
}

const burton: WaterProfile = {
  calcium: 275,
  magnesium: 40,
  sodium: 25,
  chloride: 35,
  sulfate: 610,
  bicarbonate: 300,
  ph: 7.5,
}

describe('water suggestions', () => {
  it('suggests gypsum for soft water moving toward a Burton-on-Trent profile', () => {
    const result = suggestSalts({
      sourceWater: softWater,
      targetProfile: burton,
      mashVolumeL: 20,
      spargeVolumeL: 10,
      gristEbcDistribution: [{ amountKg: 5, colorEbc: 8, grainType: 'Base', added: 'Mash' }],
    })

    expect(result.salts.CaSO4).toBeGreaterThan(10)
    expect(result.salts.CaSO4).toBeGreaterThan(result.salts.CaCl2)
    expect(result.predictedProfile.sulfate).toBeGreaterThan(250)
    expect(result.predictedClSo4).toBeGreaterThan(2.5)
    expect(result.predictedMashPh).toBeGreaterThan(5)
  })

  it('derives a hop-forward target profile for IPA-like styles', () => {
    const profile = targetProfileForStyle({ name: 'American IPA', category: 'IPA', ibuMin: 40, ibuMax: 70, colorMin: 6, colorMax: 14 })

    expect(profile.sulfate).toBeGreaterThan(profile.chloride)
    expect(profile.calcium).toBeGreaterThanOrEqual(100)
  })
})
