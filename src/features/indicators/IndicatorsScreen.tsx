import { useEffect, useState } from 'react'
import { ScreenHeader } from '../../components/ScreenHeader'
import type { IndicatorCategory, MarketIndicator } from '../../types/models'
import { computeLatestReviewedYearMonth, deriveMacroIndicators } from '../../domain'
import { fetchBriefingIndex, fetchBriefingMonth } from '../briefing/briefingData'
import { fetchIndicatorSnapshot } from './indicatorData'
import { loadCryptoIndicators } from './loadCryptoIndicators'
import { IndicatorCard } from './IndicatorCard'
import { IndicatorCardSkeleton } from './IndicatorCardSkeleton'
import { INDICATOR_SCHEDULE_DISCLAIMER, INDICATOR_SCHEDULE_TIMEZONE_NOTE, INDICATOR_UPDATE_SCHEDULE } from './indicatorSchedule'
import './IndicatorsScreen.css'

// §10 요구대로 6개 섹션 헤더로 묶어 보여준다 — 표시 레이어의 그룹핑일 뿐,
// IndicatorCategory 타입 자체는 바꾸지 않는다("에너지" = oil+fuel).
const DISPLAY_SECTIONS: { title: string; categories: IndicatorCategory[] }[] = [
  { title: '환율', categories: ['exchange'] },
  { title: '주식시장', categories: ['stock'] },
  { title: '에너지', categories: ['oil', 'fuel'] },
  { title: '금', categories: ['gold'] },
  { title: '가상자산', categories: ['crypto'] },
  { title: '주요 거시경제 지표', categories: ['macro'] },
]

interface LoadedIndicators {
  indicators: MarketIndicator[]
  snapshotGeneratedAt: string | null
}

// 거시지표(기준금리 등)는 새로 수집하지 않고, 이미 검수된 재무 브리핑에서
// 값만 파생한다 — 이 화면은 개인 거래·예산·자산 데이터에는 전혀 접근하지 않는다
// (공개 정적 JSON만 읽는다).
async function loadMacroIndicators(): Promise<MarketIndicator[]> {
  const index = await fetchBriefingIndex()
  const yearMonth = index ? computeLatestReviewedYearMonth(index.entries) : null
  if (!yearMonth) return []
  const { briefing } = await fetchBriefingMonth(yearMonth)
  return deriveMacroIndicators(briefing)
}

async function loadAllIndicators(): Promise<LoadedIndicators> {
  const [{ snapshot }, cryptoIndicators, macroIndicators] = await Promise.all([
    fetchIndicatorSnapshot(),
    loadCryptoIndicators(),
    loadMacroIndicators(),
  ])
  return {
    indicators: [...(snapshot?.indicators ?? []), ...cryptoIndicators, ...macroIndicators],
    snapshotGeneratedAt: snapshot?.generatedAt ?? null,
  }
}

export function IndicatorsScreen() {
  const [loaded, setLoaded] = useState(false)
  const [indicators, setIndicators] = useState<MarketIndicator[]>([])
  const [snapshotGeneratedAt, setSnapshotGeneratedAt] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      const result = await loadAllIndicators()
      if (cancelled) return
      setIndicators(result.indicators)
      setSnapshotGeneratedAt(result.snapshotGeneratedAt)
      setLoaded(true)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const grouped = new Map<IndicatorCategory, MarketIndicator[]>()
  for (const indicator of indicators) {
    const list = grouped.get(indicator.category) ?? []
    list.push(indicator)
    grouped.set(indicator.category, list)
  }

  return (
    <div>
      <ScreenHeader title="경제지표" />
      <div className="indicators-screen__body">
        <p className="indicators-screen__subtitle">경제 흐름을 한눈에 확인해 보세요.</p>

        {snapshotGeneratedAt && (
          <p className="indicators-screen__updated">
            마지막 업데이트 {new Date(snapshotGeneratedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
          </p>
        )}

        <details className="indicators-screen__schedule">
          <summary className="indicators-screen__schedule-summary">업데이트 주기 안내</summary>
          <div className="indicators-screen__schedule-panel">
            <p className="indicators-screen__schedule-tz">{INDICATOR_SCHEDULE_TIMEZONE_NOTE}</p>
            {INDICATOR_UPDATE_SCHEDULE.map((group) => (
              <div key={group.title} className="indicators-screen__schedule-group">
                <p className="indicators-screen__schedule-title">{group.title}</p>
                <p className="indicators-screen__schedule-time">{group.time}</p>
                <p className="indicators-screen__schedule-targets">{group.targets}</p>
                {group.note && <p className="indicators-screen__schedule-note">{group.note}</p>}
              </div>
            ))}
            <p className="indicators-screen__schedule-disclaimer">{INDICATOR_SCHEDULE_DISCLAIMER}</p>
          </div>
        </details>

        {!loaded && (
          <div className="indicators-screen__grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <IndicatorCardSkeleton key={i} />
            ))}
          </div>
        )}

        {loaded &&
          DISPLAY_SECTIONS.map((section) => {
            const items = section.categories.flatMap((category) => grouped.get(category) ?? [])
            if (items.length === 0) return null
            return (
              <div key={section.title} className="indicators-screen__section">
                <h2 className="indicators-screen__section-title">{section.title}</h2>
                <div className="indicators-screen__grid">
                  {items.map((indicator) => (
                    <IndicatorCard key={indicator.id} indicator={indicator} />
                  ))}
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
