import { describe, expect, it } from 'vitest'
import { computeLifeBalance } from './balance'
import type { Transaction } from '../types/models'

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'id',
    type: 'expense',
    amount: 0,
    categoryId: 'cat',
    date: '2026-08-01',
    time: '12:00',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('computeLifeBalance', () => {
  it('adds income and subtracts expense and saving', () => {
    const transactions = [
      tx({ type: 'income', amount: 3_000_000 }),
      tx({ type: 'expense', amount: 500_000 }),
      tx({ type: 'saving', amount: 1_000_000 }),
    ]
    expect(computeLifeBalance(100_000, transactions)).toBe(
      100_000 + 3_000_000 - 500_000 - 1_000_000,
    )
  })

  it('ignores transfer transactions entirely', () => {
    const transactions = [
      tx({ type: 'income', amount: 1_000_000 }),
      tx({ type: 'transfer', amount: 500_000 }),
    ]
    expect(computeLifeBalance(0, transactions)).toBe(1_000_000)
  })

  it('returns the opening balance unchanged when there are no transactions', () => {
    expect(computeLifeBalance(250_000, [])).toBe(250_000)
  })
})
