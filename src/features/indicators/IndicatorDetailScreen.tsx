import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ScreenHeader } from '../../components/ScreenHeader'
import type { IndicatorHistoryPoint, MarketIndicator } from '../../types/models'
import {
  CATEGORY_CONCEPT_IDS,
  DIRECTION_ICON,
  FRESHNESS_LABEL,
  MARKET_STATUS_LABEL,
  PATHWAY_TEMPLATE,
  computeFreshness,
  computeLatestReviewedYearMonth,
  deriveMacroIndicators,
  formatChangeText,
  formatKstDateTime,
  getDirection,
} from '../../domain'
import { CONCEPTS } from '../../content/concepts'
import { CHART_GRID_STROKE, CHART_TICK_STYLE, CHART_TOOLTIP_STYLE } from '../stats/charts/chartTheme'
import { fetchBriefingIndex, fetchBriefingMonth } from '../briefing/briefingData'
import { fetchIndicatorHistory, fetchIndicatorSnapshot } from './indicatorData'
import { loadCryptoIndicators } from './loadCryptoIndicators'
import './IndicatorDetailScreen.css'

async function loadIndicator(id: string): Promise<MarketIndicator | null> {
  if (id.startsWith('crypto-')) {
    const cryptoIndicators = await loadCryptoIndicators()
    return cryptoIndicators.find((i) => i.id === id) ?? null
  }
  if (id.startsWith('macro-')) {
    const index = await fetchBriefingIndex()
    const yearMonth = index ? computeLatestReviewedYearMonth(index.entries) : null
    const { briefing } = yearMonth ? await fetchBriefingMonth(yearMonth) : { briefing: null }
    return deriveMacroIndicators(briefing).find((i) => i.id === id) ?? null
  }
  const { snapshot } = await fetchIndicatorSnapshot()
  return snapshot?.indicators.find((i) => i.id === id) ?? null
}

export function IndicatorDetailScreen() {
  const { indicatorId } = useParams<{ indicatorId: string }>()
  const [loaded, setLoaded] = useState(false)
  const [indicator, setIndicator] = useState<MarketIndicator | null>(null)
  const [history, setHistory] = useState<IndicatorHistoryPoint[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!indicatorId) return
      setLoaded(false)
      const [foundIndicator, points] = await Promise.all([loadIndicator(indicatorId), fetchIndicatorHistory(indicatorId)])
      if (cancelled) return
      setIndicator(foundIndicator)
      setHistory(points)
      setLoaded(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [indicatorId])

  if (!loaded) {
    return (
      <div>
        <ScreenHeader title="지표 상세" />
        <div className="indicator-detail__body">
          <p className="indicator-detail__state">불러오는 중…</p>
        </div>
      </div>
    )
  }

  if (!indicator) {
    return (
      <div>
        <ScreenHeader title="지표 상세" />
        <div className="indicator-detail__body">
          <p className="indicator-detail__state">이 지표를 찾을 수 없어요.</p>
          <Link to="/indicators" className="indicator-detail__back-link">
            경제지표로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const direction = getDirection(indicator.change)
  const freshness = computeFreshness(indicator, new Date())
  const chartData = history.map((p) => ({ x: p.referenceDate, value: p.value }))
  const relatedConcepts = (CATEGORY_CONCEPT_IDS[indicator.category] ?? [])
    .map((id) => CONCEPTS.find((c) => c.id === id))
    .filter((c): c is (typeof CONCEPTS)[number] => c !== undefined && c.status === 'reviewed')

  return (
    <div>
      <ScreenHeader title={indicator.name} />
      <div className="indicator-detail__body">
        {indicator.value !== null ? (
          <>
            <p className="indicator-detail__value">
              {indicator.value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
              <span className="indicator-detail__unit"> {indicator.unit}</span>
            </p>
            <p className={`indicator-detail__change indicator-detail__change--${direction}`}>
              <span aria-hidden="true">{DIRECTION_ICON[direction]}</span> {formatChangeText(indicator.change, indicator.changeRate)}
            </p>
          </>
        ) : (
          <p className="indicator-detail__state">{FRESHNESS_LABEL[indicator.freshness]}</p>
        )}

        <div className="indicator-detail__meta">
          <span>기준일 {indicator.referenceDate}</span>
          <span>조회 {formatKstDateTime(indicator.updatedAt)}</span>
          <span>{MARKET_STATUS_LABEL[indicator.marketStatus]}</span>
          {freshness === 'stale' && <span>{FRESHNESS_LABEL.stale}</span>}
        </div>

        <section className="indicator-detail__chart-section">
          <h2 className="indicator-detail__heading">최근 추이</h2>
          {chartData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART_GRID_STROKE} />
                <XAxis dataKey="x" tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} />
                <YAxis
                  tick={CHART_TICK_STYLE}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  domain={['auto', 'auto']}
                />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value) => `${value} ${indicator.unit}`} />
                <Line type="monotone" dataKey="value" stroke="#6f8fc7" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="indicator-detail__state">아직 추이를 표시할 데이터가 부족해요.</p>
          )}
        </section>

        <section className="indicator-detail__section">
          <h2 className="indicator-detail__heading">단위 설명</h2>
          <p className="indicator-detail__paragraph">
            {indicator.name}은(는) {indicator.unit} 단위로 표시돼요.
          </p>
        </section>

        <section className="indicator-detail__section">
          <h2 className="indicator-detail__heading">생활에 전달될 수 있는 경로</h2>
          <p className="indicator-detail__paragraph">
            {indicator.name} {direction === 'up' ? '상승' : direction === 'down' ? '하락' : '변동'} → {PATHWAY_TEMPLATE[indicator.category]}
          </p>
          <p className="indicator-detail__caution">
            특정 자산의 매수·매도를 권유하는 내용이 아니며, 미래 방향을 예측하지 않아요.
          </p>
        </section>

        {relatedConcepts.length > 0 && (
          <section className="indicator-detail__section">
            <h2 className="indicator-detail__heading">관련 개념</h2>
            <div className="indicator-detail__concept-chips">
              {relatedConcepts.map((c) => (
                <Link key={c.id} to={`/learn/concepts/${c.id}`} className="indicator-detail__concept-chip">
                  {c.title} 자세히 보기 ›
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="indicator-detail__section">
          <h2 className="indicator-detail__heading">출처</h2>
          <p className="indicator-detail__paragraph">
            {indicator.sourceName}
            {indicator.sourceUrl && (
              <>
                {' '}
                ·{' '}
                <a href={indicator.sourceUrl} target="_blank" rel="noopener noreferrer">
                  원문 보기(새 창)
                </a>
              </>
            )}
          </p>
        </section>

        <Link to="/indicators" className="indicator-detail__back-link">
          ‹ 경제지표로 돌아가기
        </Link>
      </div>
    </div>
  )
}
