import { v4 as uuidv4 } from 'uuid'
import { db } from '../schema'
import type { Category, CategoryGroup } from '../../types/models'
import { countTransactionsForCategory } from './transactions'

export type NewCategoryInput = Omit<Category, 'id' | 'createdAt' | 'hidden' | 'order'> & {
  order?: number
}

export async function getCategoriesByGroup(
  group: CategoryGroup,
  options: { includeHidden?: boolean } = {},
): Promise<Category[]> {
  const categories = await db.categories.where('group').equals(group).sortBy('order')
  return options.includeHidden ? categories : categories.filter((c) => !c.hidden)
}

export async function getAllCategories(): Promise<Category[]> {
  return db.categories.orderBy('order').toArray()
}

export async function getCategory(id: string): Promise<Category | undefined> {
  return db.categories.get(id)
}

export async function addCategory(input: NewCategoryInput): Promise<Category> {
  const siblingCount = await db.categories.where('group').equals(input.group).count()
  const category: Category = {
    ...input,
    id: uuidv4(),
    hidden: false,
    order: input.order ?? siblingCount,
    createdAt: new Date().toISOString(),
  }
  await db.categories.add(category)
  return category
}

export async function updateCategory(
  id: string,
  patch: Partial<Pick<Category, 'name' | 'color' | 'icon' | 'isFixed'>>,
): Promise<void> {
  await db.categories.update(id, patch)
}

export async function setCategoryHidden(id: string, hidden: boolean): Promise<void> {
  await db.categories.update(id, { hidden })
}

export async function reorderCategories(orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.categories, async () => {
    await Promise.all(orderedIds.map((id, index) => db.categories.update(id, { order: index })))
  })
}

// 요구사항상 분류 삭제는 금지되어 있으므로, 거래·예산이 하나도 연결되지 않은 경우에만 삭제를 허용한다.
export async function deleteCategoryIfUnused(id: string): Promise<boolean> {
  const [transactionCount, budgetCount] = await Promise.all([
    countTransactionsForCategory(id),
    db.monthlyBudgets.where('categoryId').equals(id).count(),
  ])
  if (transactionCount > 0 || budgetCount > 0) {
    return false
  }
  await db.categories.delete(id)
  return true
}

// 중복 생성 등으로 더 이상 필요 없는 분류를, 사용 중이어도 다른 분류로 합친 뒤 삭제한다.
export async function mergeAndDeleteCategory(sourceId: string, targetId: string): Promise<void> {
  await db.transaction('rw', db.transactions, db.monthlyBudgets, db.categories, async () => {
    await db.transactions.where('categoryId').equals(sourceId).modify({ categoryId: targetId })

    const sourceBudgets = await db.monthlyBudgets.where('categoryId').equals(sourceId).toArray()
    for (const budget of sourceBudgets) {
      const targetBudget = await db.monthlyBudgets.get(`${budget.yearMonth}_${targetId}`)
      if (!targetBudget) {
        await db.monthlyBudgets.put({
          id: `${budget.yearMonth}_${targetId}`,
          yearMonth: budget.yearMonth,
          categoryId: targetId,
          planAmount: budget.planAmount,
        })
      }
      await db.monthlyBudgets.delete(budget.id)
    }

    await db.categories.delete(sourceId)
  })
}
