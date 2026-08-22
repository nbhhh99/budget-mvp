import { db } from '../schema'
import type { MonthlyBudget } from '../../types/models'
import { shiftYearMonth } from '../../utils/date'

function budgetId(yearMonth: string, categoryId: string): string {
  return `${yearMonth}_${categoryId}`
}

export async function getBudgetsForMonth(yearMonth: string): Promise<MonthlyBudget[]> {
  return db.monthlyBudgets.where('yearMonth').equals(yearMonth).toArray()
}

export async function getBudgetForCategory(
  yearMonth: string,
  categoryId: string,
): Promise<MonthlyBudget | undefined> {
  return db.monthlyBudgets.get(budgetId(yearMonth, categoryId))
}

export async function upsertBudget(
  yearMonth: string,
  categoryId: string,
  planAmount: number,
): Promise<void> {
  await db.monthlyBudgets.put({
    id: budgetId(yearMonth, categoryId),
    yearMonth,
    categoryId,
    planAmount,
  })
}

export async function removeBudget(yearMonth: string, categoryId: string): Promise<void> {
  await db.monthlyBudgets.delete(budgetId(yearMonth, categoryId))
}

// 지난달 계획 예산을 이번 달로 복사한다. 이번 달에 이미 값이 있는 카테고리는 덮어쓰지 않는다.
export async function copyBudgetsFromPreviousMonth(yearMonth: string): Promise<number> {
  const previousYearMonth = shiftYearMonth(yearMonth, -1)
  const [previousBudgets, currentBudgets] = await Promise.all([
    getBudgetsForMonth(previousYearMonth),
    getBudgetsForMonth(yearMonth),
  ])
  const existingCategoryIds = new Set(currentBudgets.map((b) => b.categoryId))
  const toCopy = previousBudgets.filter((b) => !existingCategoryIds.has(b.categoryId))

  if (toCopy.length === 0) return 0

  await db.monthlyBudgets.bulkPut(
    toCopy.map((b) => ({
      id: budgetId(yearMonth, b.categoryId),
      yearMonth,
      categoryId: b.categoryId,
      planAmount: b.planAmount,
    })),
  )
  return toCopy.length
}
