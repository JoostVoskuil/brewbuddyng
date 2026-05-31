export type InventoryKind = 'fermentable' | 'hop' | 'yeast' | 'misc'

export interface InventoryRequirement {
  kind: InventoryKind
  ingredientId: number | null | undefined
  name: string
  amount: number | null | undefined
}

export interface InventoryStockRow {
  id: number
  inventory: number | null | undefined
  alwaysOnStock: boolean | null | undefined
}

export interface InventoryDeduction {
  kind: InventoryKind
  ingredientId: number
  name: string
  amount: number
  before: number
  after: number
}

export interface InventorySkipped {
  kind: InventoryKind
  ingredientId: number | null
  name: string
  reason: 'free-text' | 'always-on-stock' | 'missing-stock-row' | 'zero-amount'
}

export interface InventoryDeductionPlan {
  deductions: InventoryDeduction[]
  skipped: InventorySkipped[]
  negative: InventoryDeduction[]
}

export const BOEK_AF_NOTE_PREFIX = '[boek-af:'

function roundInventoryAmount(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000
}

export function hasInventoryDeductionMarker(notes: string | null | undefined): boolean {
  return (notes ?? '').includes(BOEK_AF_NOTE_PREFIX)
}

export function appendInventoryDeductionMarker(
  notes: string | null | undefined,
  timestamp: string,
): string {
  const current = (notes ?? '').trimEnd()
  const marker = `${BOEK_AF_NOTE_PREFIX}${timestamp}] Voorraad afgeboekt.`
  return current ? `${current}\n\n${marker}` : marker
}

export function planInventoryDeductions(
  requirements: InventoryRequirement[],
  stockByKind: Record<InventoryKind, Map<number, InventoryStockRow>>,
): InventoryDeductionPlan {
  const deductions: InventoryDeduction[] = []
  const skipped: InventorySkipped[] = []

  for (const requirement of requirements) {
    const ingredientId = requirement.ingredientId ?? null
    const amount = requirement.amount ?? 0

    if (ingredientId == null) {
      skipped.push({ ...requirement, ingredientId, reason: 'free-text' })
      continue
    }
    if (amount <= 0) {
      skipped.push({ ...requirement, ingredientId, reason: 'zero-amount' })
      continue
    }

    const stockRow = stockByKind[requirement.kind].get(ingredientId)
    if (!stockRow) {
      skipped.push({ ...requirement, ingredientId, reason: 'missing-stock-row' })
      continue
    }
    if (stockRow.alwaysOnStock) {
      skipped.push({ ...requirement, ingredientId, reason: 'always-on-stock' })
      continue
    }

    const before = stockRow.inventory ?? 0
    const deduction: InventoryDeduction = {
      kind: requirement.kind,
      ingredientId,
      name: requirement.name,
      amount,
      before,
      after: roundInventoryAmount(before - amount),
    }
    deductions.push(deduction)
  }

  return {
    deductions,
    skipped,
    negative: deductions.filter((deduction) => deduction.after < 0),
  }
}
