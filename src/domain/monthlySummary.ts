import type { Category, MonthlyBudget, Transaction } from '../types/models'
import { computeLifeBalance } from './balance'
import { computeRate } from './rate'
import { computePlanVsActual, type PlanVsActual } from './planVsActual'

export interface MonthlySummary extends PlanVsActual {
  yearMonth: string
  openingBalance: number
  currentBalance: number
  budgetRemaining: number | null // 계획 지출 예산 전체 − 실제 지출 (계획이 하나도 없으면 null)
  savingsRate: number | null
}

export function computeMonthlySummary(
  yearMonth: string,
  openingBalance: number,
  transactions: Transaction[],
  budgets: MonthlyBudget[],
  categories: Category[],
): MonthlySummary {
  const planVsActual = computePlanVsActual(transactions, budgets, categories)

  return {
    ...planVsActual,
    yearMonth,
    openingBalance,
    currentBalance: computeLifeBalance(openingBalance, transactions),
    budgetRemaining:
      planVsActual.planExpense > 0 ? planVsActual.planExpense - planVsActual.actualExpense : null,
    savingsRate: computeRate(
      planVsActual.actualSaving,
      planVsActual.actualIncome > 0 ? planVsActual.actualIncome : null,
    ),
  }
}
