import { describe, it, expect } from 'vitest'
import { parseBeerXml, generateBeerXml } from '~/server/utils/recipe-io/beerxml'

const SAMPLE = `<?xml version="1.0" encoding="utf-8"?>
<RECIPES>
  <RECIPE>
    <NAME>Punk IPA</NAME>
    <VERSION>1</VERSION>
    <TYPE>All Grain</TYPE>
    <BATCH_SIZE>20</BATCH_SIZE>
    <BOIL_SIZE>25</BOIL_SIZE>
    <BOIL_TIME>60</BOIL_TIME>
    <EFFICIENCY>75</EFFICIENCY>
    <FERMENTABLES>
      <FERMENTABLE>
        <NAME>Pale Ale</NAME>
        <TYPE>Grain</TYPE>
        <AMOUNT>5</AMOUNT>
        <YIELD>80</YIELD>
        <COLOR>7</COLOR>
      </FERMENTABLE>
    </FERMENTABLES>
    <EQUIPMENT>
      <NAME>Brew Kit 20L</NAME>
      <VERSION>1</VERSION>
      <BOIL_SIZE>25</BOIL_SIZE>
      <BATCH_SIZE>20</BATCH_SIZE>
      <TUN_VOLUME>30</TUN_VOLUME>
      <TUN_WEIGHT>5</TUN_WEIGHT>
      <TUN_SPECIFIC_HEAT>0.12</TUN_SPECIFIC_HEAT>
      <TOP_UP_WATER>0</TOP_UP_WATER>
      <TRUB_CHILLER_LOSS>1</TRUB_CHILLER_LOSS>
      <EVAP_RATE>9</EVAP_RATE>
      <BOIL_TIME>60</BOIL_TIME>
      <LAUTER_DEADSPACE>0.5</LAUTER_DEADSPACE>
      <TOP_UP_KETTLE>0</TOP_UP_KETTLE>
      <HOP_UTILIZATION>100</HOP_UTILIZATION>
    </EQUIPMENT>
    <MISCS>
      <MISC>
        <NAME>Irish Moss</NAME>
        <VERSION>1</VERSION>
        <TYPE>Fining</TYPE>
        <USE>Boil</USE>
        <AMOUNT>0.005</AMOUNT>
        <TIME>15</TIME>
      </MISC>
    </MISCS>
    <MASH>
      <NAME>Single infusion</NAME>
      <VERSION>1</VERSION>
      <GRAIN_TEMP>18</GRAIN_TEMP>
      <TUN_TEMP>20</TUN_TEMP>
      <SPARGE_TEMP>76</SPARGE_TEMP>
      <PH>5.4</PH>
      <MASH_STEPS>
        <MASH_STEP>
          <NAME>Saccharification</NAME>
          <TYPE>Infusion</TYPE>
          <STEP_TEMP>65</STEP_TEMP>
          <STEP_TIME>60</STEP_TIME>
          <INFUSE_AMOUNT>15</INFUSE_AMOUNT>
        </MASH_STEP>
        <MASH_STEP>
          <NAME>Mash out</NAME>
          <TYPE>Temperature</TYPE>
          <STEP_TEMP>76</STEP_TEMP>
          <STEP_TIME>10</STEP_TIME>
          <RAMP_TIME>5</RAMP_TIME>
        </MASH_STEP>
      </MASH_STEPS>
    </MASH>
  </RECIPE>
</RECIPES>`

describe('beerxml mash import/export', () => {
  it('parses the embedded MASH header and MASH_STEPS', () => {
    const recipe = parseBeerXml(SAMPLE)[0]!
    expect(recipe.mashName).toBe('Single infusion')
    expect(recipe.grainTemp).toBe(18)
    expect(recipe.tunTemp).toBe(20)
    expect(recipe.spargeTemp).toBe(76)
    expect(recipe.mashPh).toBe(5.4)
    expect(recipe.mashSteps).toHaveLength(2)
    const [first, second] = recipe.mashSteps!
    expect(first!.name).toBe('Saccharification')
    expect(first!.type).toBe('Infusion')
    expect(first!.stepTemp).toBe(65)
    expect(first!.stepTime).toBe(60)
    expect(first!.infuseAmount).toBe(15)
    expect(second!.name).toBe('Mash out')
    expect(second!.rampTime).toBe(5)
  })

  it('round-trips the mash through generate + parse', () => {
    const recipe = parseBeerXml(SAMPLE)[0]!
    const xml = generateBeerXml(recipe)
    expect(xml).toContain('<MASH>')
    expect(xml).toContain('<MASH_STEPS>')
    expect(xml).toContain('<MASH_STEP>')

    const reparsed = parseBeerXml(xml)[0]!
    expect(reparsed.mashName).toBe('Single infusion')
    expect(reparsed.grainTemp).toBe(18)
    expect(reparsed.spargeTemp).toBe(76)
    expect(reparsed.mashSteps).toHaveLength(2)
    expect(reparsed.mashSteps![0]!.name).toBe('Saccharification')
    expect(reparsed.mashSteps![1]!.type).toBe('Temperature')
  })

  it('defaults the mash to empty when absent', () => {
    const noMash = SAMPLE.replace(/<MASH>[\s\S]*<\/MASH>/, '')
    const recipe = parseBeerXml(noMash)[0]!
    expect(recipe.mashSteps).toEqual([])
  })
})

describe('beerxml misc import/export', () => {
  it('parses MISC entries including the BeerXML TYPE', () => {
    const recipe = parseBeerXml(SAMPLE)[0]!
    expect(recipe.miscs).toHaveLength(1)
    const misc = recipe.miscs![0]!
    expect(misc.name).toBe('Irish Moss')
    expect(misc.type).toBe('Fining')
    expect(misc.use).toBe('Boil')
    expect(misc.amount).toBeCloseTo(0.005, 5)
    expect(misc.time).toBe(15)
  })

  it('round-trips the misc TYPE through generate + parse', () => {
    const recipe = parseBeerXml(SAMPLE)[0]!
    const xml = generateBeerXml(recipe)
    expect(xml).toContain('<MISC>')
    expect(xml).toContain('<TYPE>Fining</TYPE>')

    const reparsed = parseBeerXml(xml)[0]!
    expect(reparsed.miscs).toHaveLength(1)
    expect(reparsed.miscs![0]!.type).toBe('Fining')
  })
})

describe('beerxml equipment import/export', () => {
  it('parses the embedded EQUIPMENT record', () => {
    const recipe = parseBeerXml(SAMPLE)[0]!
    expect(recipe.equipment).toBeDefined()
    const e = recipe.equipment!
    expect(e.name).toBe('Brew Kit 20L')
    expect(e.boilSize).toBe(25)
    expect(e.batchSize).toBe(20)
    expect(e.tunVolume).toBe(30)
    expect(e.evapRate).toBe(9)
    expect(e.lauterDeadspace).toBe(0.5)
    expect(e.hopUtilization).toBe(100)
  })

  it('round-trips the equipment through generate + parse', () => {
    const recipe = parseBeerXml(SAMPLE)[0]!
    const xml = generateBeerXml(recipe)
    expect(xml).toContain('<EQUIPMENT>')
    expect(xml).toContain('<NAME>Brew Kit 20L</NAME>')

    const reparsed = parseBeerXml(xml)[0]!
    expect(reparsed.equipment).toBeDefined()
    expect(reparsed.equipment!.name).toBe('Brew Kit 20L')
    expect(reparsed.equipment!.batchSize).toBe(20)
    expect(reparsed.equipment!.trubChillerLoss).toBe(1)
  })

  it('omits EQUIPMENT when the recipe has none', () => {
    const noEquip = SAMPLE.replace(/<EQUIPMENT>[\s\S]*<\/EQUIPMENT>/, '')
    const recipe = parseBeerXml(noEquip)[0]!
    expect(recipe.equipment).toBeUndefined()
    expect(generateBeerXml(recipe)).not.toContain('<EQUIPMENT>')
  })
})
