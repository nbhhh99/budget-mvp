import { useEffect, useMemo, useState } from 'react'
import { StatCard, StatEmpty, StatLine } from './components/StatCard'
import { RankedBarChart } from './charts/RankedBarChart'
import { CategoryDonut } from './charts/CategoryDonut'
import { transactionsRepo } from '../../db'
import type { Category, MonthlyBudget, Transaction } from '../../types/models'
import {
  computePlanVsActual,
  fixedVariableRatio,
  filterByType,
  groupSumByCategory,
  largestSingleExpense,
  percentChange,
  rankCategoriesByAmount,
} from '../../domain'
import { formatDateWithWeekday, formatWon } from '../../utils/date'
import { formatPercent } from '../../utils/format'
import { shiftYearMonth } from '../../utils/date'
import type { StatsPeriod } from './period'
import './stats-shared.css'

interface CategoryTabProps {
  period: StatsPeriod
  transactions: Transaction[]
  categories: Category[]
  budgets: MonthlyBudget[]
}

const RANK_COLOR = '#F08A4B' // --color-expense

export function CategoryTab({ period, transactions, categories, budgets }: CategoryTabProps) {
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const expenseTransactions = useMemo(() => filterByType(transactions, 'expense'), [transactions])
  const totalsByCategory = useMemo(
    () => groupSumByCategory(expenseTransactions),
    [expenseTransactions],
  )
  const ranked = useMemo(() => rankCategoriesByAmount(totalsByCategory), [totalsByCategory])

  const [previousTotals, setPreviousTotals] = useState<Map<string, number> | null>(null)

  useEffect(() => {
    if (period.type !== 'month') return
    let cancelled = false
    async function loadPrevious() {
      if (period.type !== 'month') return
      const previousYearMonth = shiftYearMonth(period.yearMonth, -1)
      const previousTransactions = await transactionsRepo.getTransactionsByMonth(previousYearMonth)
      if (cancelled) return
      setPreviousTotals(groupSumByCategory(filterByType(previousTransactions, 'expense')))
    }
    loadPrevious()
    return () => {
      cancelled = true
    }
  }, [period])

  const planVsActual = useMemo(
    () => computePlanVsActual(transactions, budgets, categories),
    [transactions, budgets, categories],
  )

  const increasedCategories = useMemo(() => {
    if (period.type !== 'month' || !previousTotals) return null
    return ranked
      .map((r) => ({
        ...r,
        change: percentChange(r.amount, previousTotals.get(r.categoryId) ?? 0),
        name: categoryMap.get(r.categoryId)?.name ?? '미분류',
      }))
      .filter((r) => r.change !== null && r.change > 0)
      .sort((a, b) => (b.change ?? 0) - (a.change ?? 0))
  }, [period, previousTotals, ranked, categoryMap])

  const fixedVariable = useMemo(
    () =>
      fixedVariableRatio(
        transactions,
        (categoryId) => categoryMap.get(categoryId)?.isFixed === true,
      ),
    [transactions, categoryMap],
  )

  const largest = useMemo(() => largestSingleExpense(transactions), [transactions])

  const barData = ranked
    .slice(0, 8)
    .map((r) => ({ label: categoryMap.get(r.categoryId)?.name ?? '미분류', amount: r.amount }))

  const donutSlices = useMemo(() => {
    const top = ranked.slice(0, 5)
    const rest = ranked.slice(5)
    const restAmount = rest.reduce((sum, r) => sum + r.amount, 0)
    const total = ranked.reduce((sum, r) => sum + r.amount, 0)
    const slices = top.map((r) => ({
      label: categoryMap.get(r.categoryId)?.name ?? '미분류',
      amount: r.amount,
      color: categoryMap.get(r.categoryId)?.color ?? '#ccc',
      percentageOfTotal: total > 0 ? (r.amount / total) * 100 : null,
    }))
    if (restAmount > 0) {
      slices.push({
        label: '기타',
        amount: restAmount,
        color: '#c9c2af',
        percentageOfTotal: total > 0 ? (restAmount / total) * 100 : null,
      })
    }
    return slices
  }, [ranked, categoryMap])

  if (expenseTransactions.length === 0) {
    return <StatEmpty message="이 기간에는 생활비 지출 내역이 없습니다." />
  }

  return (
    <div>
      <StatCard title="카테고리별 지출">
        <RankedBarChart data={barData} color={RANK_COLOR} />
        <ol className="stats-rank-list">
          {ranked.map((r, i) => (
            <li key={r.categoryId}>
              <span className="stats-rank-list__rank">{i + 1}</span>
              <span className="stats-rank-list__name">
                {categoryMap.get(r.categoryId)?.name ?? '미분류'}
              </span>
              <span className="stats-rank-list__amount">{formatWon(r.amount)}</span>
              <span className="stats-rank-list__percent">{formatPercent(r.percentageOfTotal)}</span>
            </li>
          ))}
        </ol>
      </StatCard>

      <StatCard title="지출 비중">
        <CategoryDonut slices={donutSlices} />
      </StatCard>

      <StatCard title="카테고리별 예산 소진율">
        {[...planVsActual.categoryBudgetUsage.entries()]
          .filter(([, usage]) => usage.status !== 'unset')
          .sort((a, b) => (b[1].usageRatio ?? 0) - (a[1].usageRatio ?? 0))
          .map(([categoryId, usage]) => (
            <div key={categoryId} className="stats-budget-row">
              <div className="stats-budget-row__header">
                <span>{categoryMap.get(categoryId)?.name ?? '미분류'}</span>
                <span>{formatPercent(usage.usageRatio)}</span>
              </div>
              <div className="stats-budget-row__track">
                <div
                  className={`stats-budget-row__fill stats-budget-row__fill--${usage.status}`}
                  style={{ width: `${Math.min(usage.usageRatio ?? 0, 100)}%` }}
                />
              </div>
            </div>
          ))}
        {planVsActual.overBudgetCategoryIds.length > 0 && (
          <div className="stats-badges">
            {planVsActual.overBudgetCategoryIds.map((id) => (
              <span key={id} className="stats-badge">
                {categoryMap.get(id)?.name ?? '미분류'} 초과
              </span>
            ))}
          </div>
        )}
      </StatCard>

      {increasedCategories && (
        <StatCard title="전월보다 지출이 늘어난 카테고리">
          {increasedCategories.length === 0 ? (
            <StatEmpty message="전월보다 늘어난 카테고리가 없습니다." />
          ) : (
            increasedCategories
              .slice(0, 5)
              .map((c) => (
                <StatLine
                  key={c.categoryId}
                  label={c.name}
                  value={`${formatWon(c.amount)} (${formatPercent(c.change)})`}
                />
              ))
          )}
        </StatCard>
      )}

      <StatCard title="고정지출 · 변동지출 비율">
        <StatLine
          label="고정지출"
          value={`${formatWon(fixedVariable.fixed)} (${formatPercent(fixedVariable.fixedPercentage)})`}
        />
        <StatLine
          label="변동지출"
          value={`${formatWon(fixedVariable.variable)} (${formatPercent(fixedVariable.variablePercentage)})`}
        />
      </StatCard>

      {largest && (
        <StatCard title="가장 큰 단일 지출">
          <StatLine
            label={categoryMap.get(largest.categoryId)?.name ?? '미분류'}
            value={formatWon(largest.amount)}
          />
          <p className="stats-note">
            {formatDateWithWeekday(largest.date)}
            {largest.memo ? ` · ${largest.memo}` : ''}
          </p>
        </StatCard>
      )}
    </div>
  )
}
