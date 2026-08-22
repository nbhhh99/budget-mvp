import type { Category, MonthlyBudget, Transaction } from '../types/models'
import { sumByType } from './balance'
import { computeBudgetUsage, type BudgetUsage } from './budgetStatus'
import { computeRate } from './rate'
import { filterByType, groupSumByCategory } from './aggregate'

export interface PlanVsActual {
  planIncome: number
  actualIncome: number
  incomeAchievementRate: number | null
  planExpense: number
  actualExpense: number
  overallExpenseUsageRatio: number | null
  planSaving: number
  actualSaving: number
  savingAchievementRate: number | null
  categoryBudgetUsage: Map<string, BudgetUsage> // key: categoryId (지출 카테고리만)
  overBudgetCategoryIds: string[]
}

// 여러 달의 예산을 합산해 계획 대비 실제를 계산한다 (통계 화면에서 기간이 여러 달일 때 사용).
// 단일 달만 넘기면 월간 요약과 동일한 결과가 된다.
export function computePlanVsActual(
  transactions: Transaction[],
  budgets: MonthlyBudget[],
  categories: Category[],
): PlanVsActual {
  const categoryGroupById = new Map(categories.map((c) => [c.id, c.group]))

  const actualIncome = sumByType(transactions, 'income')
  const actualExpense = sumByType(transactions, 'expense')
  const actualSaving = sumByType(transactions, 'saving')

  const planByCategory = new Map<string, number>()
  for (const b of budgets) {
    planByCategory.set(b.categoryId, (planByCategory.get(b.categoryId) ?? 0) + b.planAmount)
  }

  let planIncome = 0
  let planExpense = 0
  let planSaving = 0
  for (const [categoryId, amount] of planByCategory) {
    const group = categoryGroupById.get(categoryId)
    if (group === 'income') planIncome += amount
    else if (group === 'expense') planExpense += amount
    else if (group === 'saving') planSaving += amount
  }

  const expenseByCategory = groupSumByCategory(filterByType(transactions, 'expense'))
  const expenseCategoryIds = new Set<string>([
    ...[...planByCategory.keys()].filter((id) => categoryGroupById.get(id) === 'expense'),
    ...expenseByCategory.keys(),
  ])

  const categoryBudgetUsage = new Map<string, BudgetUsage>()
  const overBudgetCategoryIds: string[] = []
  for (const categoryId of expenseCategoryIds) {
    const usage = computeBudgetUsage(
      planByCategory.get(categoryId),
      expenseByCategory.get(categoryId) ?? 0,
    )
    categoryBudgetUsage.set(categoryId, usage)
    if (usage.status === 'over') overBudgetCategoryIds.push(categoryId)
  }

  return {
    planIncome,
    actualIncome,
    incomeAchievementRate: computeRate(actualIncome, planIncome > 0 ? planIncome : null),
    planExpense,
    actualExpense,
    overallExpenseUsageRatio: computeRate(actualExpense, planExpense > 0 ? planExpense : null),
    planSaving,
    actualSaving,
    savingAchievementRate: computeRate(actualSaving, planSaving > 0 ? planSaving : null),
    categoryBudgetUsage,
    overBudgetCategoryIds,
  }
}
