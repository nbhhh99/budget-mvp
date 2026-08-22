import { useState } from 'react'
import { ScreenHeader } from '../../components/ScreenHeader'
import { PeriodSelector } from './PeriodSelector'
import { useStatsData } from './useStatsData'
import { CategoryTab } from './CategoryTab'
import { TimingTab } from './TimingTab'
import { PlanTab } from './PlanTab'
import { TrendTab } from './TrendTab'
import { currentYearMonth } from '../../utils/date'
import type { StatsPeriod } from './period'
import './StatsScreen.css'

type TabKey = 'category' | 'timing' | 'plan' | 'trend'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'category', label: '분야별' },
  { key: 'timing', label: '시기별' },
  { key: 'plan', label: '계획대비' },
  { key: 'trend', label: '장기변화' },
]

export function StatsScreen() {
  const [period, setPeriod] = useState<StatsPeriod>({
    type: 'month',
    yearMonth: currentYearMonth(),
  })
  const [tab, setTab] = useState<TabKey>('category')
  const data = useStatsData(period)

  return (
    <div className="stats-screen">
      <ScreenHeader title="통계" />
      <PeriodSelector period={period} onChange={setPeriod} />

      <div className="stats-screen__tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`stats-screen__tab${tab === t.key ? ' stats-screen__tab--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="stats-screen__body">
        {!data.loaded ? (
          <p className="stats-screen__loading">불러오는 중…</p>
        ) : (
          <>
            {tab === 'category' && (
              <CategoryTab
                period={period}
                transactions={data.transactions}
                categories={data.categories}
                budgets={data.budgets}
              />
            )}
            {tab === 'timing' && (
              <TimingTab
                period={period}
                resolved={data.resolved}
                transactions={data.transactions}
                categories={data.categories}
                budgets={data.budgets}
              />
            )}
            {tab === 'plan' && (
              <PlanTab
                transactions={data.transactions}
                categories={data.categories}
                budgets={data.budgets}
              />
            )}
            {tab === 'trend' && (
              <TrendTab
                resolved={data.resolved}
                monthlySummaries={data.monthlySummaries}
                transactions={data.transactions}
                categories={data.categories}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
