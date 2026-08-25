import type { IndicatorCategory, IndicatorFreshness, MarketIndicator, MarketStatus } from '../types/models'

export type IndicatorDirection = 'up' | 'down' | 'flat'

// 색상만으로 상승·하락을 구분하지 않기 위한 텍스트/아이콘 — 화면은 항상 이 둘을
// 함께 표시한다(§7 "상승은 색상과 '상승' 텍스트 동시 표시").
export const DIRECTION_LABEL: Record<IndicatorDirection, string> = {
  up: '상승',
  down: '하락',
  flat: '변동 없음',
}

export const DIRECTION_ICON: Record<IndicatorDirection, string> = {
  up: '▲',
  down: '▼',
  flat: '–',
}

export const MARKET_STATUS_LABEL: Record<MarketStatus, string> = {
  open: '거래 중',
  closed: '휴장',
  holiday: '휴장(공휴일)',
  'not-released': '미발표',
  delayed: '업데이트 지연',
  unknown: '상태 확인 불가',
}

export const FRESHNESS_LABEL: Record<IndicatorFreshness, string> = {
  fresh: '최신',
  stale: '이전 데이터 사용 중',
  unavailable: '데이터 없음',
  pending: '데이터 제공 준비 중',
}

export const CATEGORY_LABEL: Record<IndicatorCategory, string> = {
  exchange: '환율',
  stock: '주식',
  oil: '유가',
  fuel: '국내 기름값',
  gold: '금',
  crypto: '코인',
  macro: '거시지표',
}

export function getDirection(change: number | null | undefined): IndicatorDirection {
  if (change === null || change === undefined || change === 0) return 'flat'
  return change > 0 ? 'up' : 'down'
}

// change/changeRate 둘 다 문장 안에 함께 넣어 "전일 대비 5.20원 상승 (+0.42%)" 형태를 만든다.
export function formatChangeText(change: number | null, changeRate: number | null): string {
  if (change === null && changeRate === null) return '전일 대비 정보 없음'
  const direction = getDirection(change ?? changeRate)
  const changeText = change !== null ? `${Math.abs(change).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}` : null
  const rateText = changeRate !== null ? `${changeRate >= 0 ? '+' : ''}${changeRate.toFixed(2)}%` : null
  const parts = [changeText, rateText].filter((p): p is string => p !== null)
  return `전일 대비 ${parts.join(' ')} ${DIRECTION_LABEL[direction]}`.trim()
}

// 카테고리별 "다음 값이 나오기 전까지 신선하다고 볼 수 있는" 시간(ms). 코인은 15분
// (§3), 나머지는 하루(다음 영업일 갱신 전까지)를 넉넉히 잡는다.
const FRESHNESS_WINDOW_MS: Record<IndicatorCategory, number> = {
  crypto: 15 * 60 * 1000,
  exchange: 36 * 60 * 60 * 1000,
  stock: 36 * 60 * 60 * 1000,
  oil: 36 * 60 * 60 * 1000,
  fuel: 36 * 60 * 60 * 1000,
  gold: 36 * 60 * 60 * 1000,
  macro: 45 * 24 * 60 * 60 * 1000, // 월간·분기 통계라 발표 주기가 길다
}

export function computeFreshness(indicator: Pick<MarketIndicator, 'value' | 'updatedAt' | 'category'>, now: Date): IndicatorFreshness {
  if (indicator.value === null) return 'unavailable'
  const updatedAt = Date.parse(indicator.updatedAt)
  if (Number.isNaN(updatedAt)) return 'unavailable'
  const windowMs = FRESHNESS_WINDOW_MS[indicator.category]
  return now.getTime() - updatedAt <= windowMs ? 'fresh' : 'stale'
}

const KST_DATE_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

// 화면에는 항상 한국시간으로 표시한다(§4). 내부 저장은 ISO(UTC)를 그대로 쓰고,
// 표시할 때만 이 함수를 거친다.
export function formatKstDateTime(isoString: string): string {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return '알 수 없음'
  const parts = KST_DATE_FORMATTER.formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}.${get('month')}.${get('day')} ${get('hour')}:${get('minute')}`
}
