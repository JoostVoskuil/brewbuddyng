/**
 * Stock-state evaluation for recipe / brew list rows (BrouwHulp parity).
 *
 * BrouwHulp colours each recipe / brew row by its ingredient stock:
 *   - green   = every needed ingredient is in stock or marked "always on stock"
 *   - yellow  = at least one ingredient is in short supply (have some, but
 *               less than the recipe needs)
 *   - red     = at least one ingredient has zero stock and is not flagged
 *               always-on-stock
 *   - unknown = the recipe has no ingredient links to evaluate (empty shell)
 *
 * The dominance order is `red > yellow > green > unknown`.
 */
export type StockState = 'green' | 'yellow' | 'red' | 'unknown'

const RANK = { unknown: 0, green: 1, yellow: 2, red: 3 } as const

export interface StockEntry {
  /** Inventory on hand. */
  inv: number
  /** When true, this ingredient is treated as always available. */
  always: boolean
}

export interface IngredientNeed {
  ownerId: number
  /** FK into the database table; null for free-text ingredients. */
  refId: number | null | undefined
  /** Amount needed by the recipe, in the same unit as `inv`. */
  amount: number
}

/**
 * Update an in-place owner→state map by evaluating one ingredient kind.
 * Skips rows with no FK (free-text ingredients) and rows flagged
 * always-on-stock; promotes the owner state when a worse state is found.
 */
export function evaluateStock(
  state: Map<number, StockState>,
  needs: IngredientNeed[],
  lookup: Map<number, StockEntry>,
): void {
  for (const n of needs) {
    if (n.refId == null) continue
    const entry = lookup.get(n.refId)
    if (!entry) continue
    if (entry.always) continue
    const need = n.amount ?? 0
    let next: StockState
    if (entry.inv <= 0) next = 'red'
    else if (entry.inv < need) next = 'yellow'
    else next = 'green'
    const prev = state.get(n.ownerId)
    if (!prev || RANK[next] > RANK[prev]) state.set(n.ownerId, next)
  }
}
