import { describe, expect, it } from 'vitest'
import {
  cumulativeExpenseTotals,
  dailyExpenseTotals,
  computeBudgetPace,
  highestSpendingDay,
  largestSingleExpense,
  monthPhaseTotals,
  weekdayAverages,
  weeklyTotals,
} from './spendingTiming'
import type { Transaction } from '../types/models'

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: Math.random().toString(),
    type: 'expense',
    amount: 0,
    categoryId: 'food',
    date: '2026-08-01',
    time: '12:00',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('dailyExpenseTotals / cumulativeExpenseTotals', () => {
  it('sums per day, sorted ascending, and accumulates a running total', () => {
    const transactions = [
      tx({ date: '2026-08-02', amount: 10_000 }),
      tx({ date: '2026-08-01', amount: 5_000 }),
      tx({ date: '2026-08-01', amount: 2_000 }),
      tx({ type: 'income', date: '2026-08-01', amount: 999_999 }),
    ]
    const daily = dailyExpenseTotals(transactions)
    expect(daily).toEqual([
      { date: '2026-08-01', amount: 7_000 },
      { date: '2026-08-02', amount: 10_000 },
    ])
    expect(cumulativeExpenseTotals(daily)).toEqual([
      { date: '2026-08-01', amount: 7_000 },
      { date: '2026-08-02', amount: 17_000 },
    ])
  })
})

describe('highestSpendingDay / largestSingleExpense', () => {
  it('finds the day and the single transaction with the largest amount', () => {
    const transactions = [
      tx({ date: '2026-08-01', amount: 5_000 }),
      tx({ date: '2026-08-02', amount: 30_000 }),
      tx({ date: '2026-08-02', amount: 1_000 }),
    ]
    expect(highestSpendingDay(dailyExpenseTotals(transactions))).toEqual({
      date: '2026-08-02',
      amount: 31_000,
    })
    expect(largestSingleExpense(transactions)?.amount).toBe(30_000)
  })

  it('returns null for an empty list', () => {
    expect(highestSpendingDay([])).toBeNull()
    expect(largestSingleExpense([])).toBeNull()
  })
})

describe('monthPhaseTotals', () => {
  it('buckets by day-of-month into early/mid/late', () => {
    const transactions = [
      tx({ date: '2026-08-05', amount: 1_000 }),
      tx({ date: '2026-08-15', amount: 2_000 }),
      tx({ date: '2026-08-25', amount: 3_000 }),
    ]
    expect(monthPhaseTotals(transactions)).toEqual({ early: 1_000, mid: 2_000, late: 3_000 })
  })
})

describe('weekdayAverages', () => {
  it('averages spending per weekday over the number of times that weekday occurred', () => {
    // 2026-08-01 is a Saturday; 2026-08-08 is also a Saturday.
    const transactions = [
      tx({ date: '2026-08-01', amount: 10_000 }),
      tx({ date: '2026-08-08', amount: 20_000 }),
    ]
    const result = weekdayAverages(transactions, '2026-08-01', '2026-08-08')
    const saturday = result.find((r) => r.label === '토')!
    expect(saturday.total).toBe(30_000)
    expect(saturday.dayCount).toBe(2)
    expect(saturday.average).toBe(15_000)
  })
})

describe('weeklyTotals', () => {
  it('buckets by 7-day windows of the day-of-month', () => {
    const transactions = [
      tx({ date: '2026-08-03', amount: 1_000 }), // 1주차
      tx({ date: '2026-08-09', amount: 2_000 }), // 2주차
      tx({ date: '2026-08-31', amount: 3_000 }), // 5주차
    ]
    expect(weeklyTotals(transactions)).toEqual([
      { week: 1, amount: 1_000 },
      { week: 2, amount: 2_000 },
      { week: 5, amount: 3_000 },
    ])
  })
})

describe('computeBudgetPace', () => {
  it('returns null actualUsageRatio when there is no plan', () => {
    const pace = computeBudgetPace(50_000, 0, 10, 31)
    expect(pace.actualUsageRatio).toBeNull()
    expect(pace.aheadOfPace).toBeNull()
  })

  it('flags ahead-of-pace spending correctly', () => {
    // 10일차 / 31일 = 32.3% 지났는데 이미 예산의 60%를 씀 -> 페이스보다 빠름
    const pace = computeBudgetPace(60_000, 100_000, 10, 31)
    expect(pace.aheadOfPace).toBe(true)
  })

  it('flags behind-pace spending correctly', () => {
    const pace = computeBudgetPace(10_000, 100_000, 10, 31)
    expect(pace.aheadOfPace).toBe(false)
  })
})
