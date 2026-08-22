import { describe, expect, it } from 'vitest'
import { computeMonthlySummary } from './monthlySummary'
import type { Category, MonthlyBudget, Transaction } from '../types/models'

const categories: Category[] = [
  {
    id: 'salary',
    group: 'income',
    name: '급여',
    order: 0,
    color: '#fff',
    hidden: false,
    createdAt: '',
  },
  {
    id: 'food',
    group: 'expense',
    name: '식비',
    order: 0,
    color: '#fff',
    hidden: false,
    createdAt: '',
  },
  {
    id: 'transport',
    group: 'expense',
    name: '교통',
    order: 1,
    color: '#fff',
    hidden: false,
    createdAt: '',
  },
  {
    id: 'stock',
    group: 'saving',
    name: '주식',
    order: 0,
    color: '#fff',
    hidden: false,
    createdAt: '',
  },
]

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

describe('computeMonthlySummary', () => {
  it('excludes saving and transfer from expense stats but reflects them in balance/saving stats', () => {
    const transactions: Transaction[] = [
      tx({ type: 'income', categoryId: 'salary', amount: 3_000_000 }),
      tx({ type: 'expense', categoryId: 'food', amount: 300_000 }),
      tx({ type: 'saving', categoryId: 'stock', amount: 500_000 }),
      tx({ type: 'transfer', categoryId: 'food', amount: 1_000_000 }),
    ]
    const summary = computeMonthlySummary('2026-08', 100_000, transactions, [], categories)

    expect(summary.actualIncome).toBe(3_000_000)
    expect(summary.actualExpense).toBe(300_000)
    expect(summary.actualSaving).toBe(500_000)
    expect(summary.currentBalance).toBe(100_000 + 3_000_000 - 300_000 - 500_000)
    expect(summary.savingsRate).toBeCloseTo((500_000 / 3_000_000) * 100)
  })

  it('returns null savings rate when there is no income this month', () => {
    const summary = computeMonthlySummary('2026-08', 0, [], [], categories)
    expect(summary.savingsRate).toBeNull()
    expect(summary.incomeAchievementRate).toBeNull()
    expect(summary.savingAchievementRate).toBeNull()
    expect(summary.overallExpenseUsageRatio).toBeNull()
    expect(summary.budgetRemaining).toBeNull()
  })

  it('flags a category as over budget and lists it', () => {
    const budgets: MonthlyBudget[] = [
      { id: 'b1', yearMonth: '2026-08', categoryId: 'food', planAmount: 200_000 },
    ]
    const transactions: Transaction[] = [
      tx({ type: 'expense', categoryId: 'food', amount: 250_000 }),
    ]
    const summary = computeMonthlySummary('2026-08', 0, transactions, budgets, categories)

    expect(summary.categoryBudgetUsage.get('food')?.status).toBe('over')
    expect(summary.overBudgetCategoryIds).toContain('food')
  })

  it('marks a category with spending but no budget as unset rather than dividing by zero', () => {
    const transactions: Transaction[] = [
      tx({ type: 'expense', categoryId: 'transport', amount: 40_000 }),
    ]
    const summary = computeMonthlySummary('2026-08', 0, transactions, [], categories)

    const usage = summary.categoryBudgetUsage.get('transport')
    expect(usage?.status).toBe('unset')
    expect(usage?.actualAmount).toBe(40_000)
  })
})
