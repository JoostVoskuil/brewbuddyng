import { describe, it, expect } from 'vitest'
import {
  fermentableInsert,
  hopInsert,
  recipeCreate,
  brewMeasurementCreate,
} from '~/server/utils/validation'

describe('fermentableInsert schema', () => {
  it('accepts a minimal valid fermentable', () => {
    const parsed = fermentableInsert.parse({ name: 'Pilsner Malt' })
    expect(parsed.name).toBe('Pilsner Malt')
  })

  it('rejects a fermentable without a name', () => {
    expect(() => fermentableInsert.parse({ type: 'Grain' })).toThrow()
  })

  it('strips unknown keys such as a client-supplied id', () => {
    const parsed = fermentableInsert.parse({ name: 'Munich', id: 999, bogus: true }) as Record<
      string,
      unknown
    >
    expect(parsed.bogus).toBeUndefined()
  })

  it('rejects wrong types', () => {
    expect(() => fermentableInsert.parse({ name: 'X', yield: 'lots' })).toThrow()
  })
})

describe('hopInsert schema', () => {
  it('requires a name', () => {
    expect(() => hopInsert.parse({ alpha: 5 })).toThrow()
  })
})

describe('recipeCreate schema', () => {
  it('accepts a recipe and ignores server-managed timestamps', () => {
    const parsed = recipeCreate.parse({ name: 'Pale Ale', createdAt: 'hack' }) as Record<
      string,
      unknown
    >
    expect(parsed.name).toBe('Pale Ale')
    expect(parsed.createdAt).toBeUndefined()
  })
})

describe('brewMeasurementCreate schema', () => {
  it('does not allow brewId to be set by the client', () => {
    const parsed = brewMeasurementCreate.parse({ datetime: '2025-01-01', brewId: 5 }) as Record<
      string,
      unknown
    >
    expect(parsed.brewId).toBeUndefined()
  })
})
