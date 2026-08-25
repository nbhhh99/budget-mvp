import { useEffect, useState } from 'react'
import type { FinancialBriefing, IndicatorCategory, MarketIndicator } from '../../../types/models'
import { CATEGORY_LABEL, deriveMacroIndicators } from '../../../domain'
import { fetchIndicatorSnapshot } from '../indicatorData'
import { loadCryptoIndicators } from './loadCryptoIndicators'
import { IndicatorCard } from './IndicatorCard'
import { IndicatorCardSkeleton } from './IndicatorCardSkeleton'
import './IndicatorSection.css'

const CATEGORY_ORDER: IndicatorCategory[] = ['exchange', 'stock', 'oil', 'fuel', 'gold', 'crypto', 'macro']

interface LoadedIndicators {
  indicators: MarketIndicator[]
  snapshotGeneratedAt: string | null
}

async function loadAllIndicators(latestBriefing: FinancialBriefing | null): Promise<LoadedIndicators> {
  const [{ snapshot }, cryptoIndicators] = await Promise.all([fetchIndicatorSnapshot(), loadCryptoIndicators()])
  const macroIndicators = deriveMacroIndicators(latestBriefing)
  return {
    indicators: [...(snapshot?.indicators ?? []), ...cryptoIndicators, ...macroIndicators],
    snapshotGeneratedAt: snapshot?.generatedAt ?? null,
  }
}

interface IndicatorSectionProps {
  latestBriefing: FinancialBriefing | null
}

export function IndicatorSection({ latestBriefing }: IndicatorSectionProps) {
  const [loaded, setLoaded] = useState(false)
  const [indicators, setIndicators] = useState<MarketIndicator[]>([])
  const [snapshotGeneratedAt, setSnapshotGeneratedAt] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function run() {
      const result = await loadAllIndicators(latestBriefing)
      if (cancelled) return
      setIndicators(result.indicators)
      setSnapshotGeneratedAt(result.snapshotGeneratedAt)
      setLoaded(true)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [latestBriefing])

  async function handleRefresh() {
    setRefreshing(true)
    const result = await loadAllIndicators(latestBriefing)
    setIndicators(result.indicators)
    setSnapshotGeneratedAt(result.snapshotGeneratedAt)
    setRefreshing(false)
  }

  const grouped = new Map<IndicatorCategory, MarketIndicator[]>()
  for (const indicator of indicators) {
    const list = grouped.get(indicator.category) ?? []
    list.push(indicator)
    grouped.set(indicator.category, list)
  }

  return (
    <section className="indicator-section">
      <div className="indicator-section__header">
        <h2 className="indicator-section__title">오늘의 경제지표</h2>
        <button type="button" className="indicator-section__refresh" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? '새로고침 중…' : '새로고침'}
        </button>
      </div>
      {snapshotGeneratedAt && (
        <p className="indicator-section__updated">마지막 업데이트 {new Date(snapshotGeneratedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
      )}

      {!loaded && (
        <div className="indicator-section__grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <IndicatorCardSkeleton key={i} />
          ))}
        </div>
      )}

      {loaded &&
        CATEGORY_ORDER.map((category) => {
          const items = grouped.get(category)
          if (!items || items.length === 0) return null
          return (
            <div key={category} className="indicator-section__category">
              <h3 className="indicator-section__category-title">{CATEGORY_LABEL[category]}</h3>
              <div className="indicator-section__grid">
                {items.map((indicator) => (
                  <IndicatorCard key={indicator.id} indicator={indicator} />
                ))}
              </div>
            </div>
          )
        })}
    </section>
  )
}
