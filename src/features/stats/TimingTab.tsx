import { useMemo } from 'react'
import { StatCard, StatEmpty, StatLine } from './components/StatCard'
import { TrendLineChart } from './charts/TrendLineChart'
import { SimpleBarChart } from './charts/SimpleBarChart'
import type { Category, MonthlyBudget, Transaction } from '../../types/models'
import {
  computePlanVsActual,
  cumulativeExpenseTotals,
  dailyExpenseTotals,
  computeBudgetPace,
  filterByType,
  highestSpendingDay,
  monthPhaseTotals,
  weekdayAverages,
  weeklyTotals,
} from '../../domain'
import {
  currentYearMonth,
  daysInMonth,
  formatDateWithWeekday,
  formatWon,
  todayDateString,
} from '../../utils/date'
import { formatPercent } from '../../utils/format'
import type { ResolvedPeriod, StatsPeriod } from './period'
import './stats-shared.css'

const EXPENSE_COLOR = '#F08A4B'

interface TimingTabProps {
  period: StatsPeriod
  resolved: ResolvedPeriod
  transactions: Transaction[]
  categories: Category[]
  budgets: MonthlyBudget[]
}

export function TimingTab({ period, resolved, transactions, categories, budgets }: TimingTabProps) {
  const expenseTransactions = useMemo(() => filterByType(transactions, 'expense'), [transactions])
  const daily = useMemo(() => dailyExpenseTotals(transactions), [transactions])
  const cumulative = useMemo(() => cumulativeExpenseTotals(daily), [daily])
  const weekly = useMemo(() => weeklyTotals(transactions), [transactions])
  const weekdays = useMemo(
    () => weekdayAverages(transactions, resolved.startDate, resolved.endDate),
    [transactions, resolved],
  )
  const phases = useMemo(() => monthPhaseTotals(transactions), [transactions])
  const peak = useMemo(() => highestSpendingDay(daily), [daily])

  const planVsActual = useMemo(
    () => computePlanVsActual(transactions, budgets, categories),
    [transactions, budgets, categories],
  )

  const isCurrentMonth = period.type === 'month' && period.yearMonth === currentYearMonth()
  const pace = useMemo(() => {
    if (!isCurrentMonth || period.type !== 'month') return null
    const today = todayDateString()
    const dayOfMonth = Number(today.slice(8, 10))
    return computeBudgetPace(
      planVsActual.actualExpense,
      planVsActual.planExpense,
      dayOfMonth,
      daysInMonth(period.yearMonth),
    )
  }, [isCurrentMonth, period, planVsActual])

  if (expenseTransactions.length === 0) {
    return <StatEmpty message="이 기간에는 생활비 지출 내역이 없습니다." />
  }

  return (
    <div>
      <StatCard title="일별 지출 추이">
        <TrendLineChart
          data={daily.map((d) => ({ x: d.date.slice(8, 10), amount: d.amount }))}
          series={[{ key: 'amount', label: '지출', color: EXPENSE_COLOR }]}
        />
      </StatCard>

      <StatCard title="날짜별 누적 지출">
        <TrendLineChart
          data={cumulative.map((d) => ({ x: d.date.slice(8, 10), amount: d.amount }))}
          series={[{ key: 'amount', label: '누적 지출', color: EXPENSE_COLOR }]}
        />
      </StatCard>

      <StatCard title="주차별 지출">
        <SimpleBarChart
          data={weekly.map((w) => ({ x: `${w.week}주차`, amount: w.amount }))}
          series={[{ key: 'amount', label: '지출', color: EXPENSE_COLOR }]}
        />
      </StatCard>

      <StatCard title="요일별 평균 지출">
        <SimpleBarChart
          data={weekdays.map((w) => ({ x: w.label, amount: Math.round(w.average) }))}
          series={[{ key: 'amount', label: '평균 지출', color: EXPENSE_COLOR }]}
        />
      </StatCard>

      <StatCard title="월초 · 월중 · 월말 지출 비교">
        <SimpleBarChart
          data={[
            { x: '월초(1~10일)', amount: phases.early },
            { x: '월중(11~20일)', amount: phases.mid },
            { x: '월말(21일~)', amount: phases.late },
          ]}
          series={[{ key: 'amount', label: '지출', color: EXPENSE_COLOR }]}
          height={160}
        />
      </StatCard>

      {peak && (
        <StatCard title="지출이 가장 많았던 날짜">
          <StatLine label={formatDateWithWeekday(peak.date)} value={formatWon(peak.amount)} />
        </StatCard>
      )}

      {pace && (
        <StatCard title="예산 소진 속도 (이번 달)">
          <StatLine label="오늘까지 지난 날짜 비율" value={formatPercent(pace.expectedRatio)} />
          <StatLine label="실제 예산 소진율" value={formatPercent(pace.actualUsageRatio)} />
          {pace.aheadOfPace !== null && (
            <p className="stats-note">
              {pace.aheadOfPace
                ? '날짜 대비 예산을 더 빠르게 쓰고 있어요.'
                : '날짜 대비 예산을 천천히 쓰고 있어요.'}
            </p>
          )}
        </StatCard>
      )}
    </div>
  )
}
