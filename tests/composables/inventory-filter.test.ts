import { describe, expect, it } from 'vitest'
import {
  filterInventoryRows,
  inventoryCsvRows,
  isInventoryLow,
  isInventoryOnStock,
  type InventoryRow,
} from '~/composables/useInventoryFilter'

function row(overrides: Partial<InventoryRow>): InventoryRow {
  return {
    id: 1,
    kind: 'fermentables',
    name: 'Pilsner malt',
    supplierOrigin: 'Dingemans Belgium',
    type: 'Grain',
    inventory: 5,
    unit: 'kg',
    alwaysOnStock: false,
    lowStockThreshold: 0,
    notes: '',
    cost: 0,
    stockTracked: true,
    raw: {},
    ...overrides,
  }
}

describe('inventory filtering', () => {
  it('treats always-on-stock rows as available even with zero inventory', () => {
    const item = row({ inventory: 0, alwaysOnStock: true })
    expect(isInventoryOnStock(item)).toBe(true)
    expect(isInventoryLow(item)).toBe(false)
  })

  it('filters free text across name, supplier/origin, type and notes', () => {
    const rows = [row({ name: 'Saaz', supplierOrigin: 'CZ', type: 'Aroma' }), row({ name: 'US-05' })]
    expect(filterInventoryRows(rows, { search: 'cz', type: '', onStockOnly: false, lowStockOnly: false })).toHaveLength(1)
    expect(filterInventoryRows(rows, { search: 'aroma', type: '', onStockOnly: false, lowStockOnly: false })[0]?.name).toBe('Saaz')
  })

  it('filters low-stock and type selections together', () => {
    const rows = [row({ type: 'Grain', inventory: 0 }), row({ type: 'Sugar', inventory: 0 })]
    expect(filterInventoryRows(rows, { search: '', type: 'Sugar', onStockOnly: false, lowStockOnly: true })).toEqual([rows[1]])
  })

  it('builds CSV rows without leaking raw payload data', () => {
    expect(inventoryCsvRows([row({ notes: 'keep cold' })])[0]).toEqual({
      category: 'fermentables',
      name: 'Pilsner malt',
      supplierOrigin: 'Dingemans Belgium',
      type: 'Grain',
      inventory: 5,
      unit: 'kg',
      alwaysOnStock: 'no',
      lowStockThreshold: 0,
      notes: 'keep cold',
    })
  })
})
