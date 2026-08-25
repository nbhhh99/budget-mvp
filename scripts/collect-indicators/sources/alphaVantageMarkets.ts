import type { ProviderResult } from '../types'

// 해외 주가지수(S&P 500·NASDAQ Composite)·국제 금 가격을 이 세션에서 다시 조사한
// 결과, 셋 다 무료·정식 라이선스로 쓸 수 있는 경로를 확인하지 못해 여전히 구현하지
// 않는다. 조사한 내용을 남겨서 다음에 같은 조사를 반복하지 않도록 한다.
//
// 1) FRED(BOK_ECOS_API_KEY와 별개로 FRED_API_KEY가 이미 재무 브리핑 쪽에 있음)로
//    SP500·NASDAQCOM 시리즈를 시도해봤다. FRED 자체 페이지에 각 시리즈의 저작권
//    표기가 있다:
//      - SP500: "Copyright © 2016, S&P Dow Jones Indices LLC. Reproduction of
//        S&P 500 in any form is prohibited except with the prior written
//        permission of S&P." → 재배포 전 서면 허가 필요(사전승인형, 소유자 index_services@spdji.com)
//      - NASDAQCOM: "Copyright © 2016, NASDAQ OMX Group, Inc." → FRED 자체 분류가
//        "Copyrighted: Pre-Approval Required"(SP500과 동일 등급)
//    두 시리즈 모두 사전 서면 허가가 필요한 등급이라, 앱에 값을 표시하는 것 자체가
//    재배포에 해당해 이번 범위에서는 구현하지 않는다(§5-5 "재배포 조건이 앱 사용에
//    맞지 않으면 구현하지 않고 이유 보고"). fredMarketIndices.ts는 만들지 않았다.
//
// 2) Alpha Vantage의 INDEX_DATA(지수 전용 API)는 문서에 프리미엄 전용으로 명시돼
//    있다. 무료 GLOBAL_QUOTE/TIME_SERIES_DAILY는 지수 심볼을 공식적으로 지원한다는
//    확인을 얻지 못했고, 설령 동작하더라도 SPY·QQQ 같은 추종 ETF로 우회하는 것은
//    "S&P 500 대신 SPY를 같은 지수인 것처럼 표시하지 말 것"(§5-7)에 위배되므로
//    시도하지 않는다.
//
// 3) Alpha Vantage의 "Gold & Silver(Spot/History)"는 최근 추가된 기능으로 보이나,
//    공식 문서 페이지에서 정확한 function 파라미터 값과 무료/프리미엄 여부를 이
//    세션에서 확정하지 못했다(제3자 블로그 글은 "무료"라고 하지만 공식 문서로
//    재확인되지 않음). "이용 조건이 불명확하면 자동 연동하지 않는다"(§9-6)는
//    원칙에 따라 국제 금도 이번 범위에서는 연동하지 않는다.
//
// 결론: 해외 주가지수·국제 금 모두 "데이터 제공 준비 중"으로 유지한다. 유료
// 라이선스(예: Alpha Vantage 유료 플랜, IEX Cloud, Twelve Data 등)를 쓸지, 아니면
// S&P/Nasdaq에 재배포 서면 허가를 직접 요청할지는 사용자가 결정해야 한다(§5-6).
// ALPHA_VANTAGE_API_KEY는 위 세 가지 중 확인된 무료·정식 용도가 없어 이 수집기가
// 더 이상 참조하지 않는다(§5-8) — README에서도 "현재 사용처 없음"으로 정리했다.
export async function collectAlphaVantageMarkets(): Promise<ProviderResult> {
  console.log(
    '[alpha-vantage] 해외지수는 FRED 재배포 사전승인 필요, 국제 금은 이용 조건 불명확 — 둘 다 이번 범위에서 연동하지 않습니다.',
  )
  return {
    status: 'not_implemented',
    provider: 'alpha-vantage',
    reason: 'FRED SP500/NASDAQCOM은 재배포 사전승인 필요, Alpha Vantage 지수는 프리미엄 전용, 금 API는 이용 조건 불명확',
  }
}
