import { Link } from 'react-router-dom'
import type { MarketIndicator } from '../../types/models'
import {
  DIRECTION_ICON,
  FRESHNESS_LABEL,
  INDICATOR_BASIS_LABEL,
  MARKET_STATUS_LABEL,
  UPDATE_SCHEDULE_LABEL,
  computeFreshness,
  formatChangeText,
  formatKstDate,
  formatKstDateTime,
  getDirection,
  getIndicatorBasisKind,
} from '../../domain'
import './IndicatorCard.css'

interface IndicatorCardProps {
  indicator: MarketIndicator
}

// 준비 중(pending)이거나 값이 없는 카드는 눌러도 상세로 이동하지 않는다(§7).
export function IndicatorCard({ indicator }: IndicatorCardProps) {
  const now = new Date()
  const freshness = computeFreshness(indicator, now)
  const direction = getDirection(indicator.change)
  const hasValue = indicator.value !== null
  const basisKind = getIndicatorBasisKind(indicator.category)

  const content = (
    <>
      <p className="indicator-card__name">{indicator.name}</p>
      {hasValue ? (
        <>
          <p className="indicator-card__value">
            {indicator.value!.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
            <span className="indicator-card__unit"> {indicator.unit}</span>
          </p>
          <p className={`indicator-card__change indicator-card__change--${direction}`}>
            <span aria-hidden="true">{DIRECTION_ICON[direction]}</span> {formatChangeText(indicator.change, indicator.changeRate)}
          </p>
          {/* S&P 500·NASDAQ Composite·국제 금처럼 아직 정식 연동되지 않은 지표는
              value가 없어 이 hasValue 분기에 들어오지 않는다 — "업데이트 주기"를
              안내할 실제 일정이 없는 지표는 자연스럽게 걸러진다. */}
          <p className="indicator-card__schedule">업데이트 주기 · {UPDATE_SCHEDULE_LABEL[indicator.category]}</p>
          <p className="indicator-card__basis">
            {INDICATOR_BASIS_LABEL[basisKind]} ·{' '}
            {basisKind === 'observed' ? formatKstDateTime(indicator.updatedAt) : formatKstDate(indicator.referenceDate)}
          </p>
        </>
      ) : (
        <p className="indicator-card__pending">{FRESHNESS_LABEL[indicator.freshness]}</p>
      )}
      <p className="indicator-card__status">
        {freshness === 'stale' && <span className="indicator-card__status-badge">{FRESHNESS_LABEL.stale}</span>}
        {indicator.marketStatus !== 'open' && indicator.marketStatus !== 'unknown' && (
          <span className="indicator-card__status-badge">{MARKET_STATUS_LABEL[indicator.marketStatus]}</span>
        )}
      </p>
      <p className="indicator-card__source">출처 {indicator.sourceName}</p>
    </>
  )

  if (!hasValue) {
    return (
      <div className="indicator-card indicator-card--disabled" aria-disabled="true">
        {content}
      </div>
    )
  }

  return (
    <Link to={`/indicators/${indicator.id}`} className="indicator-card">
      {content}
    </Link>
  )
}
