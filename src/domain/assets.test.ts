import { describe, expect, it } from 'vitest'
import { computeAssetOverview } from './assets'
import type { AssetValuation, Category, Transaction } from '../types/models'

function makeCategory(id: string, name: string, overrides: Partial<Category> = {}): Category {
  return {
    id,
    group: 'saving',
    name,
    order: 0,
    color: '#000',
    hidden: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeSavingTx(categoryId: string, amount: number, date: string): Transaction {
  return {
    id: `${categoryId}-${date}-${amount}`,
    type: 'saving',
    amount,
    categoryId,
    date,
    time: '00:00',
    createdAt: date,
    updatedAt: date,
  }
}

describe('computeAssetOverview', () => {
  const axa = makeCategory('axa', 'AXA')
  const stock = makeCategory('stock', '주식')
  const hiddenDup = makeCategory('dup', '중복분류', { hidden: true })

  it('sums saving-type transactions per category as principal, ignoring other types', () => {
    const transactions: Transaction[] = [
      makeSavingTx('axa', 350000, '2026-01-01'),
      makeSavingTx('axa', 350000, '2026-02-01'),
      { ...makeSavingTx('axa', 999, '2026-03-01'), type: 'expense' },
    ]
    const overview = computeAssetOverview([axa], transactions, [])
    expect(overview.categories).toHaveLength(1)
    expect(overview.categories[0].principal).toBe(700000)
    expect(overview.totalPrincipal).toBe(700000)
  })

  it('falls back to principal as the current value when no valuation is set', () => {
    const transactions = [makeSavingTx('stock', 100000, '2026-01-01')]
    const overview = computeAssetOverview([stock], transactions, [])
    const summary = overview.categories[0]
    expect(summary.hasValuation).toBe(false)
    expect(summary.currentValue).toBe(100000)
    expect(summary.gain).toBe(0)
    expect(summary.gainRate).toBe(0)
  })

  it('uses the manually entered valuation and computes gain/gainRate against principal', () => {
    const transactions = [makeSavingTx('stock', 100000, '2026-01-01')]
    const valuations: AssetValuation[] = [
      { categoryId: 'stock', currentValue: 120000, updatedAt: '2026-02-01T00:00:00.000Z' },
    ]
    const overview = computeAssetOverview([stock], transactions, valuations)
    const summary = overview.categories[0]
    expect(summary.hasValuation).toBe(true)
    expect(summary.currentValue).toBe(120000)
    expect(summary.gain).toBe(20000)
    expect(summary.gainRate).toBe(20)
  })

  it('returns null gainRate when principal is zero (avoids division by zero)', () => {
    const valuations: AssetValuation[] = [
      { categoryId: 'stock', currentValue: 50000, updatedAt: '2026-02-01T00:00:00.000Z' },
    ]
    const overview = computeAssetOverview([stock], [], valuations)
    expect(overview.categories[0].principal).toBe(0)
    expect(overview.categories[0].gainRate).toBeNull()
    expect(overview.totalGainRate).toBeNull()
  })

  it('excludes saving categories with no principal and no valuation', () => {
    const overview = computeAssetOverview([axa, stock], [], [])
    expect(overview.categories).toHaveLength(0)
  })

  it('excludes non-saving-group categories even if referenced by id', () => {
    const expenseCategory = makeCategory('food', '식비', { group: 'expense' })
    const transactions = [makeSavingTx('food', 5000, '2026-01-01')]
    const overview = computeAssetOverview([expenseCategory], transactions, [])
    expect(overview.categories).toHaveLength(0)
  })

  it('still includes a hidden category if it has principal or a valuation', () => {
    const transactions = [makeSavingTx('dup', 10000, '2026-01-01')]
    const overview = computeAssetOverview([hiddenDup], transactions, [])
    expect(overview.categories).toHaveLength(1)
    expect(overview.categories[0].hidden).toBe(true)
  })

  it('aggregates totals across multiple categories', () => {
    const transactions = [
      makeSavingTx('axa', 300000, '2026-01-01'),
      makeSavingTx('stock', 100000, '2026-01-01'),
    ]
    const valuations: AssetValuation[] = [
      { categoryId: 'stock', currentValue: 90000, updatedAt: '2026-02-01T00:00:00.000Z' },
    ]
    const overview = computeAssetOverview([axa, stock], transactions, valuations)
    expect(overview.totalPrincipal).toBe(400000)
    expect(overview.totalCurrentValue).toBe(390000)
    expect(overview.totalGain).toBe(-10000)
    expect(overview.totalGainRate).toBeCloseTo(-2.5)
  })
})
