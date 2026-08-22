import type { Transaction, TransactionType } from '../types/models'

export function filterByType(transactions: Transaction[], type: TransactionType): Transaction[] {
  return transactions.filter((t) => t.type === type)
}

export function sumAmount(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + t.amount, 0)
}

export function groupSumByCategory(transactions: Transaction[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const t of transactions) {
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount)
  }
  return map
}

export interface CategoryRankEntry {
  categoryId: string
  amount: number
  percentageOfTotal: number | null
}

export function rankCategoriesByAmount(amountByCategory: Map<string, number>): CategoryRankEntry[] {
  const total = [...amountByCategory.values()].reduce((sum, amount) => sum + amount, 0)
  return [...amountByCategory.entries()]
    .map(([categoryId, amount]) => ({
      categoryId,
      amount,
      percentageOfTotal: total > 0 ? (amount / total) * 100 : null,
    }))
    .sort((a, b) => b.amount - a.amount)
}
