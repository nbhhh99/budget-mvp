import { useEffect, useState } from 'react'
import { budgetsRepo, categoriesRepo, monthlyMetaRepo, transactionsRepo } from '../../db'
import type { Category, MonthlyBudget, Transaction } from '../../types/models'
import { computeMonthlySummary, type MonthlySummary } from '../../domain'
import { yearMonthOf } from '../../utils/date'
import { resolvePeriod, type ResolvedPeriod, type StatsPeriod } from './period'

export interface StatsData {
  loaded: boolean
  resolved: ResolvedPeriod
  transactions: Transaction[]
  categories: Category[]
  budgets: MonthlyBudget[]
  monthlySummaries: MonthlySummary[] // 기간에 포함된 각 달의 요약, 오름차순
}

export function useStatsData(period: StatsPeriod): StatsData {
  const resolved = resolvePeriod(period)
  const [data, setData] = useState<Omit<StatsData, 'loaded' | 'resolved'>>({
    transactions: [],
    categories: [],
    budgets: [],
    monthlySummaries: [],
  })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoaded(false)
      const [rangeTransactions, categories, budgetsByMonth, metaByMonth] = await Promise.all([
        transactionsRepo.getTransactionsByRange(resolved.startDate, resolved.endDate),
        categoriesRepo.getAllCategories(),
        Promise.all(resolved.months.map((ym) => budgetsRepo.getBudgetsForMonth(ym))),
        Promise.all(resolved.months.map((ym) => monthlyMetaRepo.getMonthlyMeta(ym))),
      ])
      if (cancelled) return

      const budgets = budgetsByMonth.flat()

      const monthlySummaries = resolved.months.map((ym, i) => {
        const monthTransactions = rangeTransactions.filter((t) => yearMonthOf(t.date) === ym)
        const monthBudgets = budgetsByMonth[i]
        const opening = metaByMonth[i]?.openingBalance ?? 0
        return computeMonthlySummary(ym, opening, monthTransactions, monthBudgets, categories)
      })

      setData({ transactions: rangeTransactions, categories, budgets, monthlySummaries })
      setLoaded(true)
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved.startDate, resolved.endDate, resolved.months.join(',')])

  return { loaded, resolved, ...data }
}
