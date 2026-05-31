import { describe, it, expect } from 'vitest'
import { parseProMash, looksLikeProMash } from '~/server/utils/recipe-io/promash'

const SAMPLE = `ProMash Recipe Report

Style and Recipe Specifics
--------------------------

Recipe Name:           Test Pale Ale
Recipe Style:          American Pale Ale

Recipe Specifics
----------------

Batch Size (Gal):           5.50      Wort Size (Gal):     6.50
Total Grain (Lbs):         11.00
Anticipated OG:            1.052
Brewhouse Efficiency:        75 %
Wort Boil Time:              60       Minutes

Grain/Extract/Sugar
-------------------------------------------------------------------------
 90.9    10.00 lbs.  Pale Malt(2-row)              US      1.036   2
  9.1     1.00 lbs.  Crystal 40L                   US      1.034  40

Hops
-------------------------------------------------------------------------
 1.50 oz.    Cascade                    Pellet  5.50  20.1   60 min.
 1.00 oz.    Centennial                 Pellet  9.00  10.0   15 min.

Yeast
-------------------------------------------------------------------------
 Wyeast 1056 American Ale
`

describe('promash import', () => {
  it('detects a ProMash report', () => {
    expect(looksLikeProMash(SAMPLE)).toBe(true)
    expect(looksLikeProMash('<RECIPES><RECIPE></RECIPE></RECIPES>')).toBe(false)
  })

  it('throws on non-ProMash text', () => {
    expect(() => parseProMash('just some text')).toThrow()
  })

  it('parses recipe header fields with unit conversion', () => {
    const recipe = parseProMash(SAMPLE)[0]!
    expect(recipe.name).toBe('Test Pale Ale')
    expect(recipe.boilTime).toBe(60)
    expect(recipe.efficiency).toBe(75)
    // 5.50 gal -> ~20.82 L
    expect(recipe.batchSize).toBeCloseTo(20.82, 1)
    expect(recipe.boilSize).toBeCloseTo(24.6, 1)
    expect(recipe.notes).toContain('American Pale Ale')
  })

  it('parses grains converting lbs to kg', () => {
    const recipe = parseProMash(SAMPLE)[0]!
    expect(recipe.fermentables).toHaveLength(2)
    expect(recipe.fermentables[0]!.name).toBe('Pale Malt(2-row)')
    // 10 lbs -> 4.5359 kg
    expect(recipe.fermentables[0]!.amount).toBeCloseTo(4.5359, 3)
    expect(recipe.fermentables[1]!.name).toBe('Crystal 40L')
    expect(recipe.fermentables[1]!.amount).toBeCloseTo(0.4536, 3)
  })

  it('parses hops converting oz to kg with alpha and time', () => {
    const recipe = parseProMash(SAMPLE)[0]!
    expect(recipe.hops).toHaveLength(2)
    const cascade = recipe.hops[0]!
    expect(cascade.name).toBe('Cascade')
    expect(cascade.form).toBe('Pellet')
    expect(cascade.alpha).toBeCloseTo(5.5, 2)
    expect(cascade.time).toBe(60)
    // 1.5 oz -> 0.04252 kg
    expect(cascade.amount).toBeCloseTo(0.04252, 4)
    expect(recipe.hops[1]!.time).toBe(15)
    expect(recipe.hops[1]!.alpha).toBeCloseTo(9, 2)
  })

  it('parses the yeast name', () => {
    const recipe = parseProMash(SAMPLE)[0]!
    expect(recipe.yeasts).toHaveLength(1)
    expect(recipe.yeasts[0]!.name).toBe('Wyeast 1056 American Ale')
  })
})
