import { useMemo } from 'react'
import { StatCard, StatEmpty, StatLine } from './components/StatCard'
import type { Category, MonthlyBudget, Transaction } from '../../types/models'
import { computePlanVsActual } from '../../domain'
import { formatWon } from '../../utils/date'
import { formatPercent, formatSignedWon } from '../../utils/format'
import './stats-shared.css'

interface PlanTabProps {
  transactions: Transaction[]
  categories: Category[]
  budgets: MonthlyBudget[]
}

export function PlanTab({ transactions, categories, budgets }: PlanTabProps) {
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const planVsActual = useMemo(
    () => computePlanVsActual(transactions, budgets, categories),
    [transactions, budgets, categories],
  )

  const categoryDiffs = useMemo(
    () =>
      [...planVsActual.categoryBudgetUsage.entries()]
        .filter(([, usage]) => usage.planAmount !== null)
        .map(([categoryId, usage]) => ({
          categoryId,
          name: categoryMap.get(categoryId)?.name ?? '미분류',
          ...usage,
        }))
        .sort((a, b) => (a.diff ?? 0) - (b.diff ?? 0)),
    [planVsActual, categoryMap],
  )

  if (budgets.length === 0) {
    return (
      <StatEmpty message="이 기간에 설정된 예산이 없습니다. 예산 설정에서 계획을 입력해 주세요." />
    )
  }

  const overspent = categoryDiffs.filter((c) => (c.diff ?? 0) < 0)
  const underspent = [...categoryDiffs].reverse().filter((c) => (c.diff ?? 0) > 0)

  return (
    <div>
      <StatCard title="전체 예산 소진율">
        <StatLine label="계획 지출" value={formatWon(planVsActual.planExpense)} />
        <StatLine label="실제 지출" value={formatWon(planVsActual.actualExpense)} />
        <StatLine label="소진율" value={formatPercent(planVsActual.overallExpenseUsageRatio)} />
      </StatCard>

      <StatCard title="수입 · 저축 계획 달성률">
        <StatLine label="수입 달성률" value={formatPercent(planVsActual.incomeAchievementRate)} />
        <StatLine
          label="저축·투자 달성률"
          value={formatPercent(planVsActual.savingAchievementRate)}
        />
      </StatCard>

      <StatCard title="카테고리별 계획 · 실제 · 차이">
        {categoryDiffs.map((c) => (
          <div key={c.categoryId} className="stats-budget-row">
            <div className="stats-budget-row__header">
              <span>{c.name}</span>
              <span>{formatSignedWon(c.diff ?? 0)}</span>
            </div>
            <StatLine
              label={`계획 ${formatWon(c.planAmount ?? 0)}`}
              value={`실제 ${formatWon(c.actualAmount)}`}
            />
          </div>
        ))}
      </StatCard>

      <StatCard title="계획보다 많이 쓴 분야">
        {overspent.length === 0 ? (
          <StatEmpty message="예산을 초과한 카테고리가 없습니다." />
        ) : (
          overspent
            .slice(0, 5)
            .map((c) => (
              <StatLine key={c.categoryId} label={c.name} value={formatSignedWon(c.diff ?? 0)} />
            ))
        )}
      </StatCard>

      <StatCard title="계획보다 적게 쓴 분야">
        {underspent.length === 0 ? (
          <StatEmpty message="계획보다 적게 쓴 카테고리가 없습니다." />
        ) : (
          underspent
            .slice(0, 5)
            .map((c) => (
              <StatLine key={c.categoryId} label={c.name} value={formatSignedWon(c.diff ?? 0)} />
            ))
        )}
      </StatCard>
    </div>
  )
}
