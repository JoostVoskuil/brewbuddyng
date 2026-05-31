import { describe, expect, it } from 'vitest'
import {
  appendInventoryDeductionMarker,
  hasInventoryDeductionMarker,
  planInventoryDeductions,
  type InventoryKind,
  type InventoryStockRow,
} from '~/server/utils/inventory'

const emptyStock = (): Record<InventoryKind, Map<number, InventoryStockRow>> => ({
  fermentable: new Map(),
  hop: new Map(),
  yeast: new Map(),
  misc: new Map(),
})

describe('planInventoryDeductions', () => {
  it('deducts linked ingredients and reports rows that go negative', () => {
    const stock = emptyStock()
    stock.fermentable.set(1, { id: 1, inventory: 5, alwaysOnStock: false })
    stock.hop.set(2, { id: 2, inventory: 0.05, alwaysOnStock: false })

    const plan = planInventoryDeductions(
      [
        { kind: 'fermentable', ingredientId: 1, name: 'Pils malt', amount: 4.5 },
        { kind: 'hop', ingredientId: 2, name: 'Saaz', amount: 0.075 },
      ],
      stock,
    )

    expect(plan.deductions).toEqual([
      {
        kind: 'fermentable',
        ingredientId: 1,
        name: 'Pils malt',
        amount: 4.5,
        before: 5,
        after: 0.5,
      },
      { kind: 'hop', ingredientId: 2, name: 'Saaz', amount: 0.075, before: 0.05, after: -0.025 },
    ])
    expect(plan.negative).toEqual([plan.deductions[1]])
  })

  it('skips free-text, always-on-stock, missing and zero-amount rows', () => {
    const stock = emptyStock()
    stock.yeast.set(1, { id: 1, inventory: 1, alwaysOnStock: true })

    const plan = planInventoryDeductions(
      [
        { kind: 'hop', ingredientId: null, name: 'Loose dry hop note', amount: 0.02 },
        { kind: 'yeast', ingredientId: 1, name: 'House culture', amount: 1 },
        { kind: 'misc', ingredientId: 9, name: 'Whirlfloc', amount: 1 },
        { kind: 'fermentable', ingredientId: 7, name: 'Sugar', amount: 0 },
      ],
      stock,
    )

    expect(plan.deductions).toEqual([])
    expect(plan.skipped.map((row) => row.reason)).toEqual([
      'free-text',
      'always-on-stock',
      'missing-stock-row',
      'zero-amount',
    ])
  })
})

describe('inventory deduction marker', () => {
  it('detects and appends the Boek af note marker', () => {
    const notes = appendInventoryDeductionMarker('Brewday went well.', '2026-01-02T03:04:05.000Z')

    expect(notes).toContain('[boek-af:2026-01-02T03:04:05.000Z]')
    expect(hasInventoryDeductionMarker(notes)).toBe(true)
    expect(hasInventoryDeductionMarker('plain notes')).toBe(false)
  })
})
