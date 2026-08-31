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

// §14 화면 상태 문구: 사용자에게는 "왜 안 되는지"의 내부 원인(키 미등록·인증
// 오류·호출 한도 등, ProviderResult) 대신 이 6가지로만 보여준다 — 최신 데이터/
// 발표 대기/시장 휴장/업데이트 지연/데이터 연동 준비 중/일시적으로 불러올 수 없음.
export const MARKET_STATUS_LABEL: Record<MarketStatus, string> = {
  open: '장중',
  closed: '장 마감',
  holiday: '휴장',
  'not-released': '발표 대기',
  delayed: '업데이트 지연',
  unknown: '상태 확인 불가',
}

export const FRESHNESS_LABEL: Record<IndicatorFreshness, string> = {
  fresh: '최신',
  stale: '업데이트 지연',
  unavailable: '일시적으로 불러올 수 없음',
  pending: '데이터 연동 준비 중',
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

// 카테고리별 전달경로 한 줄 — 원인을 단정하지 않고 "~할 수 있어요"로 헤지한다.
// 지표 상세 화면(IndicatorDetailScreen)의 "생활에 전달될 수 있는 경로" 섹션에서 쓴다.
export const PATHWAY_TEMPLATE: Record<IndicatorCategory, string> = {
  exchange: '수입 원료비 변화를 거쳐 일부 상품·서비스 가격에 시차를 두고 반영될 수 있어요.',
  stock: '시장 전반의 투자심리를 보여주는 지표 중 하나예요.',
  oil: '연료비·운송비를 거쳐 여러 물가에 영향을 줄 수 있어요.',
  fuel: '자동차를 이용한다면 주유비 부담에 직접 영향을 줄 수 있어요.',
  gold: '금은 안전자산으로 여겨져, 시장의 위험 인식과 함께 움직이는 경우가 있어요.',
  crypto: '24시간 거래되는 시장이라 변동성이 클 수 있어요.',
  macro: '가계 대출·예금 금리나 생활비 흐름과 연결될 수 있어요.',
}

// 카드별 "업데이트 주기" 안내 — 지표군이 언제 갱신되는지 보여준다. 아직 정식
// 연동되지 않은 지표(S&P 500·NASDAQ Composite·국제 금)는 value가 없어
// IndicatorCard가 hasValue로 게이팅해 이 문구 자체를 표시하지 않는다.
export const UPDATE_SCHEDULE_LABEL: Record<IndicatorCategory, string> = {
  exchange: '평일 오후 4시 30분',
  stock: '평일 오후 4시 30분',
  oil: '평일 오전 9시',
  fuel: '매일 오전 7시',
  gold: '평일 오후 4시 30분',
  crypto: '화면 진입 시 확인',
  macro: '재무 브리핑 업데이트 시 반영',
}

export type IndicatorBasisKind = 'reference' | 'observed'

// 코인은 24시간 거래되는 시장이라 referenceDate가 공식 기관이 밝힌 기준일이
// 아니라 조회한 날짜를 그대로 담고 있다(loadCryptoIndicators.ts) — 그래서
// '기준일' 대신 '조회 시각'으로 안내한다. 그 외 카테고리는 공식 출처가 밝힌
// 실제 기준일을 그대로 쓸 수 있다.
const OBSERVED_TIME_CATEGORIES: ReadonlySet<IndicatorCategory> = new Set(['crypto'])

export function getIndicatorBasisKind(category: IndicatorCategory): IndicatorBasisKind {
  return OBSERVED_TIME_CATEGORIES.has(category) ? 'observed' : 'reference'
}

export const INDICATOR_BASIS_LABEL: Record<IndicatorBasisKind, string> = {
  reference: '기준일',
  observed: '조회 시각',
}

// referenceDate는 'YYYY-MM-DD' 문자열이다 — Date 객체를 거쳐 로컬 시간대로
// 변환하면 자정 근처에서 하루가 밀릴 수 있어, 문자열을 직접 파싱해 시간대
// 영향 없이 "2026. 8. 27." 형태로 표시한다.
export function formatKstDate(dateString: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString)
  if (!match) return dateString
  const [, year, month, day] = match
  return `${year}. ${Number(month)}. ${Number(day)}.`
}

// 지표 상세 화면의 "관련 개념" 링크에 쓸 돈 개념 사전 id — 정의를 복제하지 않고
// id로만 연결한다(§12). 카테고리 단위의 대표 개념만 골랐다.
export const CATEGORY_CONCEPT_IDS: Record<IndicatorCategory, string[]> = {
  exchange: ['exchange-rate-and-foreign-assets', 'foreign-currency-asset'],
  stock: ['stock', 'stock-index'],
  oil: ['commodity', 'oil-shock'],
  fuel: ['commodity'],
  gold: ['commodity'],
  crypto: ['digital-asset'],
  macro: ['base-rate', 'consumer-price-index', 'unemployment', 'economic-growth-rate'],
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

// updatedAt이 "표시된 값이 실제로 최신인지"를 그대로 반영하는 두 카테고리는
// updatedAt 기준으로 판단한다(referenceDate로 바꾸면 오히려 잘못된다):
//   - crypto: referenceDate가 공식 기준일이 아니라 조회한 날짜 그 자체라
//     (loadCryptoIndicators.ts) 날짜 차이로는 신선도를 판단할 수 없다. updatedAt
//     (마지막 조회 시각)이 유일한 신호다.
//   - macro: updatedAt이 "수집을 시도한 시각"이 아니라 재무 브리핑이 사람에게
//     검수된 시각이다(briefing.reviewedAt — indicatorMacro.ts). 매 렌더링·매 수집
//     시도마다 갱신되는 게 아니라 새 브리핑이 검수될 때만 바뀌므로, 다른
//     카테고리와 달리 "최근에 확인했는지"를 정확히 반영한다. referenceDate(기준
//     금리가 마지막으로 "바뀐" 날짜)는 금리가 안 바뀌면 몇 달째 그대로인 게
//     정상이라 — referenceDate로 판단하면 전혀 문제없는 "동결"을 계속 "오래된
//     정보"로 잘못 표시하게 된다(실제로 이 버그를 이번에 만들었다가 발견해
//     되돌렸다: 한국은행 기준금리가 7/16 이후 동결 상태라는 이유만으로 stale로
//     표시됐다).
const UPDATED_AT_BASED_WINDOW_MS: Partial<Record<IndicatorCategory, number>> = {
  crypto: 15 * 60 * 1000,
  macro: 45 * 24 * 60 * 60 * 1000, // 월간·분기 통계라 검수 주기가 길다
}

// 그 외 카테고리(환율·주식·금·해외유가·기름값)는 실제 값의 기준일(referenceDate)이
// 오늘로부터 며칠이나 지났는지로 신선도를 판단한다. 이 카테고리들은 updatedAt이
// "수집기가 마지막으로 성공적으로 실행을 시도한 시각"일 뿐이라(값이 바뀌었든
// 아니든 매번 갱신됨) "표시된 값이 실제로 최신인지"와는 다른 질문이다 — 실제로
// WTI/Brent(EIA) 수집이 매일 성공하면서도(그때마다 updatedAt은 갱신됨) 응답의
// 최신 값 자체는 며칠째 그대로였던 사례가 있었다. updatedAt만 봤을 때는 그
// 카드가 계속 "최신"으로 잘못 표시됐다.
//
// 평일에만 발표되는 지표(환율·주식·금·해외유가)는 금요일 값이 주말 내내, 그리고
// 다음 영업일 발표 전까지는 정상적으로 "최신"이어야 하므로, 주말(최대 2일)과
// 발표 지연 여유(1~2일)를 더해 4일을 기준으로 잡는다 — 관측된 지연 이력이 있는
// 해외유가(oil)도 정확한 공식 SLA를 확인할 방법이 없어 같은 여유를 준다(추측해서
// 더 좁히지 않는다). 기름값(fuel)은 매일(주말 포함) 발표되므로 더 짧게 잡는다.
const REFERENCE_DATE_BASED_WINDOW_DAYS: Partial<Record<IndicatorCategory, number>> = {
  exchange: 4,
  stock: 4,
  oil: 4,
  fuel: 2,
  gold: 4,
}

// referenceDate('YYYY-MM-DD')와 now를 같은 "달력일" 단위로 비교하기 위해, now도
// 한국시간 기준 날짜로 변환한다(자정 근처에서 UTC 기준으로 비교하면 하루가
// 밀릴 수 있다 — formatKstDate와 같은 이유).
function toKstDateOnlyMs(date: Date): number {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate())
}

export function computeFreshness(
  indicator: Pick<MarketIndicator, 'value' | 'updatedAt' | 'referenceDate' | 'category'>,
  now: Date,
): IndicatorFreshness {
  if (indicator.value === null) return 'unavailable'

  const updatedAtWindowMs = UPDATED_AT_BASED_WINDOW_MS[indicator.category]
  if (updatedAtWindowMs !== undefined) {
    const updatedAt = Date.parse(indicator.updatedAt)
    if (Number.isNaN(updatedAt)) return 'unavailable'
    return now.getTime() - updatedAt <= updatedAtWindowMs ? 'fresh' : 'stale'
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(indicator.referenceDate)
  if (!match) return 'unavailable'
  const [, year, month, day] = match
  const refDateMs = Date.UTC(Number(year), Number(month) - 1, Number(day))
  const daysOld = Math.round((toKstDateOnlyMs(now) - refDateMs) / (24 * 60 * 60 * 1000))
  const windowDays = REFERENCE_DATE_BASED_WINDOW_DAYS[indicator.category]
  if (windowDays === undefined) return 'unavailable' // 방어적 기본값 — 새 카테고리가 추가되면 여기서 드러난다
  return daysOld <= windowDays ? 'fresh' : 'stale'
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
