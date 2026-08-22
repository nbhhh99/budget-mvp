import { useMemo } from 'react'
import { StatCard, StatEmpty, StatLine } from './components/StatCard'
import { TrendLineChart } from './charts/TrendLineChart'
import { SimpleBarChart } from './charts/SimpleBarChart'
import type { MonthlySummary } from '../../domain'
import {
  filterByType,
  groupSumByCategory,
  percentChange,
  rankCategoriesByAmount,
} from '../../domain'
import type { Category, Transaction } from '../../types/models'
import { formatWon, yearMonthOf } from '../../utils/date'
import { formatPercent } from '../../utils/format'
import type { ResolvedPeriod } from './period'
import './stats-shared.css'

interface TrendTabProps {
  resolved: ResolvedPeriod
  monthlySummaries: MonthlySummary[]
  transactions: Transaction[]
  categories: Category[]
}

const INCOME_COLOR = '#6FBFA8'
const EXPENSE_COLOR = '#F08A4B'
const SAVING_COLOR = '#7AA7D9'
const TREND_LINE_COLORS = ['#F08A4B', '#7AA7D9', '#E29ECF']

export function TrendTab({ resolved, monthlySummaries, transactions, categories }: TrendTabProps) {
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const monthLabels = useMemo(() => resolved.months.map((ym) => ym.slice(5) + '월'), [resolved])

  const monthlyAverage = useMemo(() => {
    if (monthlySummaries.length === 0) return 0
    return monthlySummaries.reduce((sum, s) => sum + s.actualExpense, 0) / monthlySummaries.length
  }, [monthlySummaries])

  const lastChange = useMemo(() => {
    if (monthlySummaries.length < 2) return null
    const prev = monthlySummaries[monthlySummaries.length - 2]
    const cur = monthlySummaries[monthlySummaries.length - 1]
    return percentChange(cur.actualExpense, prev.actualExpense)
  }, [monthlySummaries])

  const topCategoryTrend = useMemo(() => {
    const expenseTransactions = filterByType(transactions, 'expense')
    const overallTotals = groupSumByCategory(expenseTransactions)
    const topCategoryIds = rankCategoriesByAmount(overallTotals)
      .slice(0, 3)
      .map((r) => r.categoryId)

    const data = resolved.months.map((ym, i) => {
      const monthTransactions = expenseTransactions.filter((t) => yearMonthOf(t.date) === ym)
      const totalsByCategory = groupSumByCategory(monthTransactions)
      const row: Record<string, string | number> = { x: monthLabels[i] }
      for (const categoryId of topCategoryIds) {
        row[categoryId] = totalsByCategory.get(categoryId) ?? 0
      }
      return row
    })

    return { series: topCategoryIds, data }
  }, [transactions, resolved, monthLabels])

  if (resolved.months.length < 2) {
    return <StatEmpty message="장기 변화를 보려면 최근 3개월 이상 기간을 선택해 주세요." />
  }

  return (
    <div>
      <StatCard title="총지출 추이">
        <TrendLineChart
          data={monthlySummaries.map((s, i) => ({ x: monthLabels[i], amount: s.actualExpense }))}
          series={[{ key: 'amount', label: '지출', color: EXPENSE_COLOR }]}
        />
        <StatLine label="월평균 지출" value={formatWon(Math.round(monthlyAverage))} />
        <StatLine label="전월 대비 증감" value={formatPercent(lastChange)} />
      </StatCard>

      <StatCard title="월별 수입과 지출 비교">
        <SimpleBarChart
          data={monthlySummaries.map((s, i) => ({
            x: monthLabels[i],
            income: s.actualIncome,
            expense: s.actualExpense,
          }))}
          series={[
            { key: 'income', label: '수입', color: INCOME_COLOR },
            { key: 'expense', label: '지출', color: EXPENSE_COLOR },
          ]}
        />
      </StatCard>

      <StatCard title="월별 잔액">
        <TrendLineChart
          data={monthlySummaries.map((s, i) => ({ x: monthLabels[i], balance: s.currentBalance }))}
          series={[{ key: 'balance', label: '잔액', color: '#B7D97E' }]}
        />
      </StatCard>

      <StatCard title="월별 저축률 · 저축·투자 금액">
        <SimpleBarChart
          data={monthlySummaries.map((s, i) => ({ x: monthLabels[i], saving: s.actualSaving }))}
          series={[{ key: 'saving', label: '저축·투자', color: SAVING_COLOR }]}
        />
        {monthlySummaries.map((s, i) => (
          <StatLine key={s.yearMonth} label={monthLabels[i]} value={formatPercent(s.savingsRate)} />
        ))}
      </StatCard>

      {topCategoryTrend.series.length > 0 && (
        <StatCard title="카테고리별 장기 변화 (상위 3개)">
          <TrendLineChart
            data={topCategoryTrend.data}
            series={topCategoryTrend.series.map((categoryId, i) => ({
              key: categoryId,
              label: categoryMap.get(categoryId)?.name ?? '미분류',
              color: TREND_LINE_COLORS[i % TREND_LINE_COLORS.length],
            }))}
          />
        </StatCard>
      )}
    </div>
  )
}
