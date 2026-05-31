import { describe, expect, it } from 'vitest'
import { evaluateStock, type StockEntry, type StockState } from '~/server/utils/stock'

describe('evaluateStock', () => {
  it('marks recipe green when every ingredient has sufficient inventory', () => {
    const state = new Map<number, StockState>()
    const lookup = new Map<number, StockEntry>([
      [1, { inv: 10, always: false }],
      [2, { inv: 5, always: false }],
    ])
    evaluateStock(
      state,
      [
        { ownerId: 1, refId: 1, amount: 5 },
        { ownerId: 1, refId: 2, amount: 5 },
      ],
      lookup,
    )
    expect(state.get(1)).toBe('green')
  })

  it('promotes to yellow when one ingredient is short but non-zero', () => {
    const state = new Map<number, StockState>()
    const lookup = new Map<number, StockEntry>([
      [1, { inv: 10, always: false }],
      [2, { inv: 1, always: false }],
    ])
    evaluateStock(
      state,
      [
        { ownerId: 1, refId: 1, amount: 5 },
        { ownerId: 1, refId: 2, amount: 5 },
      ],
      lookup,
    )
    expect(state.get(1)).toBe('yellow')
  })

  it('promotes to red when any ingredient has zero stock', () => {
    const state = new Map<number, StockState>()
    const lookup = new Map<number, StockEntry>([
      [1, { inv: 10, always: false }],
      [2, { inv: 0, always: false }],
    ])
    evaluateStock(
      state,
      [
        { ownerId: 1, refId: 1, amount: 5 },
        { ownerId: 1, refId: 2, amount: 5 },
      ],
      lookup,
    )
    expect(state.get(1)).toBe('red')
  })

  it('treats always-on-stock ingredients as not contributing to state', () => {
    const state = new Map<number, StockState>()
    const lookup = new Map<number, StockEntry>([
      [1, { inv: 0, always: true }], // would be red, but always-on-stock → ignored
      [2, { inv: 5, always: false }],
    ])
    evaluateStock(
      state,
      [
        { ownerId: 1, refId: 1, amount: 5 },
        { ownerId: 1, refId: 2, amount: 5 },
      ],
      lookup,
    )
    expect(state.get(1)).toBe('green')
  })

  it('skips free-text ingredients (refId == null)', () => {
    const state = new Map<number, StockState>()
    const lookup = new Map<number, StockEntry>()
    evaluateStock(state, [{ ownerId: 1, refId: null, amount: 5 }], lookup)
    expect(state.get(1)).toBeUndefined() // remains unknown
  })

  it('red dominates yellow dominates green (worst state wins)', () => {
    const state = new Map<number, StockState>()
    state.set(1, 'green') // pre-existing
    const lookup = new Map<number, StockEntry>([[1, { inv: 1, always: false }]])
    evaluateStock(state, [{ ownerId: 1, refId: 1, amount: 5 }], lookup)
    expect(state.get(1)).toBe('yellow')
    // Now apply a red ingredient — must promote.
    lookup.set(2, { inv: 0, always: false })
    evaluateStock(state, [{ ownerId: 1, refId: 2, amount: 1 }], lookup)
    expect(state.get(1)).toBe('red')
    // And re-applying a green one must not regress the state.
    lookup.set(3, { inv: 100, always: false })
    evaluateStock(state, [{ ownerId: 1, refId: 3, amount: 1 }], lookup)
    expect(state.get(1)).toBe('red')
  })

  it('different owners are independent', () => {
    const state = new Map<number, StockState>()
    const lookup = new Map<number, StockEntry>([
      [1, { inv: 10, always: false }],
      [2, { inv: 0, always: false }],
    ])
    evaluateStock(
      state,
      [
        { ownerId: 1, refId: 1, amount: 5 },
        { ownerId: 2, refId: 2, amount: 5 },
      ],
      lookup,
    )
    expect(state.get(1)).toBe('green')
    expect(state.get(2)).toBe('red')
  })
})
