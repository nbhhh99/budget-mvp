import { useEffect, useState } from 'react'
import { ScreenHeader } from '../../components/ScreenHeader'
import type { IndicatorCategory, MarketIndicator } from '../../types/models'
import { computeLatestReviewedYearMonth, deriveMacroIndicators } from '../../domain'
import { fetchBriefingIndex, fetchBriefingMonth } from '../briefing/briefingData'
import { fetchIndicatorSnapshot } from './indicatorData'
import { loadCryptoIndicators } from './loadCryptoIndicators'
import { IndicatorCard } from './IndicatorCard'
import { IndicatorCardSkeleton } from './IndicatorCardSkeleton'
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
  const [refreshing, setRefreshing] = useState(false)

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

  async function handleRefresh() {
    setRefreshing(true)
    const result = await loadAllIndicators()
    setIndicators(result.indicators)
    setSnapshotGeneratedAt(result.snapshotGeneratedAt)
    setRefreshing(false)
  }

  // S&P 500·NASDAQ·국제 금처럼 공식 재배포 가능한 공급자를 아직 확정하지 못해
  // "한 번도 시도한 적 없음"(pending) 상태인 지표는, unavailable(일시 장애)·
  // stale(지연)과 달리 일반 카드로 보여줄 값 자체가 앞으로도 당분간 생기지
  // 않는다 — 정상 카드와 같은 크기의 "고장 난 카드"로 매번 보여주는 대신, 아래
  // 안내 영역에 이름만 한 번 나열한다. 수집기·latest.json·history는 건드리지
  // 않는다 — 이건 순수하게 화면 표시 로직이다.
  const visibleIndicators = indicators.filter((i) => !(i.value === null && i.freshness === 'pending'))
  const pendingIndicators = indicators.filter((i) => i.value === null && i.freshness === 'pending')

  const grouped = new Map<IndicatorCategory, MarketIndicator[]>()
  for (const indicator of visibleIndicators) {
    const list = grouped.get(indicator.category) ?? []
    list.push(indicator)
    grouped.set(indicator.category, list)
  }

  return (
    <div>
      <ScreenHeader title="경제지표" />
      <div className="indicators-screen__body">
        <p className="indicators-screen__subtitle">경제 흐름을 한눈에 확인해 보세요.</p>

        <div className="indicators-screen__header">
          {snapshotGeneratedAt ? (
            <p className="indicators-screen__updated">
              마지막 업데이트 {new Date(snapshotGeneratedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
            </p>
          ) : (
            <span />
          )}
          <button type="button" className="indicators-screen__refresh" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? '새로고침 중…' : '새로고침'}
          </button>
        </div>

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

        {loaded && pendingIndicators.length > 0 && (
          <section className="indicators-screen__pending" aria-labelledby="indicators-pending-heading">
            <h2 id="indicators-pending-heading" className="indicators-screen__pending-title">
              추후 연동 예정
            </h2>
            <p className="indicators-screen__pending-note">
              {pendingIndicators.map((i) => i.name).join(', ')}은 정식 재배포가 가능한 데이터 공급원을 검토하고
              있어요.
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
