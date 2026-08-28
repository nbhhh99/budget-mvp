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

// 업데이트 시각을 일괄 안내하는 대신, 카드별 "업데이트 주기"·"기준일/조회 시각"
// 표시(IndicatorCard)로 옮겼다 — 이 문구는 그 표시를 읽는 방법만 짧게 알려준다.
// "예정 시각"이 아니라 실제 표시값(기준일·조회 시각) 이야기이므로, "실시간"이나
// 수동 새로고침 안내 없이, API 성공을 단정하지 않는 표현으로 한 번만 보여준다.
const INDICATOR_NOTICE =
  '표시된 시간은 실제 데이터 기준일과 조회 시각이에요. 지표별 발표 일정과 데이터 제공 상황에 따라 반영이 늦어질 수 있어요.'

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

async function loadAllIndicators(): Promise<MarketIndicator[]> {
  const [{ snapshot }, cryptoIndicators, macroIndicators] = await Promise.all([
    fetchIndicatorSnapshot(),
    loadCryptoIndicators(),
    loadMacroIndicators(),
  ])
  return [...(snapshot?.indicators ?? []), ...cryptoIndicators, ...macroIndicators]
}

export function IndicatorsScreen() {
  const [loaded, setLoaded] = useState(false)
  const [indicators, setIndicators] = useState<MarketIndicator[]>([])

  useEffect(() => {
    let cancelled = false
    async function run() {
      const result = await loadAllIndicators()
      if (cancelled) return
      setIndicators(result)
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
        <p className="indicators-screen__notice">{INDICATOR_NOTICE}</p>

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
