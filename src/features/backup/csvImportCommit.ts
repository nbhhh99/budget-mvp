import { v4 as uuidv4 } from 'uuid'
import { db } from '../../db'
import type { Category, CategoryGroup, Transaction } from '../../types/models'
import { CATEGORY_PALETTE } from '../../constants/palette'
import type { ImportPreview } from './csvImport'

export interface CommitImportResult {
  importedCount: number
  createdCategoryCount: number
}

export async function commitImport(
  preview: ImportPreview,
  existingCategories: Category[],
): Promise<CommitImportResult> {
  return db.transaction('rw', db.categories, db.transactions, async () => {
    const categoryByKey = new Map(existingCategories.map((c) => [`${c.group}:${c.name}`, c]))
    const nextOrderByGroup = new Map<CategoryGroup, number>()
    for (const c of existingCategories) {
      nextOrderByGroup.set(c.group, Math.max(nextOrderByGroup.get(c.group) ?? 0, c.order + 1))
    }

    const newCategories: Category[] = []
    for (const { group, name } of preview.newCategoryNames) {
      const key = `${group}:${name}`
      if (categoryByKey.has(key)) continue
      const order = nextOrderByGroup.get(group) ?? 0
      nextOrderByGroup.set(group, order + 1)
      const category: Category = {
        id: uuidv4(),
        group,
        name,
        order,
        color: CATEGORY_PALETTE[order % CATEGORY_PALETTE.length],
        hidden: false,
        createdAt: new Date().toISOString(),
      }
      newCategories.push(category)
      categoryByKey.set(key, category)
    }
    if (newCategories.length > 0) {
      await db.categories.bulkAdd(newCategories)
    }

    const now = new Date().toISOString()
    const transactions: Transaction[] = preview.validRows
      .filter((r): r is typeof r & { draft: NonNullable<typeof r.draft> } => Boolean(r.draft))
      .map((r) => {
        const category = r.categoryGroup
          ? categoryByKey.get(`${r.categoryGroup}:${r.categoryName}`)
          : undefined
        return {
          ...r.draft,
          id: uuidv4(),
          categoryId: category?.id ?? '',
          createdAt: now,
          updatedAt: now,
        }
      })
      .filter((t) => t.categoryId !== '')

    if (transactions.length > 0) {
      await db.transactions.bulkAdd(transactions)
    }

    return { importedCount: transactions.length, createdCategoryCount: newCategories.length }
  })
}
