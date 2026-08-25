import type { CollectedIndicator } from '../types'

// Alpha Vantage(상업적 제공업체) API. 무료 키 발급: https://www.alphavantage.co/support/#api-key
// 해외 주가지수(S&P 500·NASDAQ Composite)와 국제 금 가격에 대한 공식 무료 정부 API를
// 이 세션에서 찾지 못해, 대안으로 검토한 상업적 라이선스 API다.
//
// TODO(구현 전 필수 확인): 무료 요금제의 정확한 호출 한도, 지수 심볼 지원 범위
// (GLOBAL_QUOTE가 지수 심볼을 지원하는지), 국제 금 가격 엔드포인트를 이 세션에서
// 재확인하지 못했다. https://www.alphavantage.co/documentation/ 에서 최신 조건을
// 확인한 뒤 구현해야 한다.
export async function collectAlphaVantageMarkets(): Promise<CollectedIndicator[] | null> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  if (!apiKey) {
    console.log('[alpha-vantage] ALPHA_VANTAGE_API_KEY가 없어 건너뜁니다.')
    return null
  }
  console.log(
    '[alpha-vantage] 정확한 엔드포인트·호출 한도가 확인되지 않아 아직 구현되지 않았습니다 (README 참고). 건너뜁니다.',
  )
  return null
}
