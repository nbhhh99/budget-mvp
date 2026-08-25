import type { IndicatorCategory, MarketStatus } from '../../src/types/models'

// 소스 어댑터가 돌려주는 정규화된 값 — updatedAt/timezone/freshness는 index.ts가
// 수집 시각 기준으로 채운다(어댑터는 "그 순간 얻은 값"만 책임진다).
export interface CollectedIndicator {
  id: string
  category: IndicatorCategory
  name: string
  symbol?: string
  value: number
  unit: string
  change: number | null
  changeRate: number | null
  referenceDate: string // 'YYYY-MM-DD'
  sourceId: string
  sourceName: string
  sourceUrl: string
  marketStatus: MarketStatus
}

// 각 소스 어댑터의 실행 결과. "값을 못 얻었다"는 사실 하나로 뭉뚱그리지 않고 왜
// 못 얻었는지를 구분한다 — 키가 없는 것(설정 문제)과 인증 실패(키는 있지만 잘못됨),
// 호출 한도 초과, 해당일 미발표(정상적인 휴장/발표 전), 응답 형식이 예상과 다름,
// 아직 구현하지 않음, 그 외 실패(네트워크 등)는 원인과 대응이 전부 다르다(§2).
// 비밀 키나 전체 요청 URL은 어떤 필드에도 담지 않는다 — provider 이름과, 필요하면
// HTTP 상태코드·API 자체 오류코드·사람이 읽을 짧은 이유만 남긴다.
export type ProviderResult =
  | { status: 'success'; provider: string; indicators: CollectedIndicator[] }
  | { status: 'missing_key'; provider: string }
  | { status: 'unauthorized'; provider: string; code?: string }
  | { status: 'rate_limited'; provider: string; code?: string }
  | { status: 'not_released'; provider: string; referenceDate?: string }
  | { status: 'invalid_response'; provider: string; reason: string; httpStatus?: number }
  | { status: 'not_implemented'; provider: string; reason: string }
  | { status: 'failed'; provider: string; reason: string; httpStatus?: number }

// buildIndicator가 "한 번도 정상값을 받은 적이 없을 때" 어떤 화면 상태로 보여줄지
// 고르는 데 쓴다 — missing_key/not_implemented는 애초에 시도조차 안 한 것(pending =
// "데이터 연동 준비 중"), 나머지는 시도했지만 이번엔 실패한 것(unavailable = "일시적으로
// 불러올 수 없음")으로 구분한다(§14).
export function isNotAttempted(result: ProviderResult | undefined): boolean {
  return result === undefined || result.status === 'missing_key' || result.status === 'not_implemented'
}
