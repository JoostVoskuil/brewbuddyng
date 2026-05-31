export type InventoryKind = 'fermentables' | 'hops' | 'yeasts' | 'miscs' | 'waters'

export interface InventoryRow {
  id: number
  kind: InventoryKind
  name: string
  supplierOrigin: string
  type: string
  inventory: number | null
  unit: string
  alwaysOnStock: boolean
  lowStockThreshold: number | null
  notes: string
  cost: number
  stockTracked: boolean
  raw: Record<string, unknown>
}

export interface InventoryFilters {
  search: string
  type: string
  onStockOnly: boolean
  lowStockOnly: boolean
}

const STOCK_EPSILON = 0.000001

export function isInventoryLow(row: InventoryRow): boolean {
  if (!row.stockTracked || row.alwaysOnStock) return false
  const threshold = row.lowStockThreshold ?? 0
  return (row.inventory ?? 0) <= threshold + STOCK_EPSILON
}

export function isInventoryOnStock(row: InventoryRow): boolean {
  if (!row.stockTracked) return false
  return row.alwaysOnStock || (row.inventory ?? 0) > (row.lowStockThreshold ?? 0) + STOCK_EPSILON
}

export function filterInventoryRows(
  rows: InventoryRow[],
  filters: InventoryFilters,
): InventoryRow[] {
  const needle = filters.search.trim().toLowerCase()
  return rows.filter((row) => {
    if (filters.type && row.type !== filters.type) return false
    if (filters.onStockOnly && !isInventoryOnStock(row)) return false
    if (filters.lowStockOnly && !isInventoryLow(row)) return false
    if (!needle) return true
    return [row.name, row.supplierOrigin, row.type, row.notes]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(needle))
  })
}

export function inventoryCsvRows(rows: InventoryRow[]) {
  return rows.map((row) => ({
    category: row.kind,
    name: row.name,
    supplierOrigin: row.supplierOrigin,
    type: row.type,
    inventory: row.inventory ?? '',
    unit: row.unit,
    alwaysOnStock: row.alwaysOnStock ? 'yes' : 'no',
    lowStockThreshold: row.lowStockThreshold ?? '',
    notes: row.notes,
  }))
}

export function useInventoryFilter() {
  return { filterInventoryRows, inventoryCsvRows, isInventoryLow, isInventoryOnStock }
}
