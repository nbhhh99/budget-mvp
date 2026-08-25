import type { CollectedIndicator } from '../types'

// 금융위원회_지수시세정보 Open API(KOSPI·KOSDAQ). 공공데이터포털에 등록돼 있고
// 실제 존재를 확인했다: https://www.data.go.kr/data/15094807/openapi.do
// (인증키 필요·무료·개발계정 1만건/일·영업일+1 13시 이후 갱신 — 이 세션에서 확인함)
//
// TODO(구현 전 필수 확인): 정확한 요청 URL(엔드포인트 경로)과 오퍼레이션별 파라미터는
// 활용신청이 승인된 뒤 "상세 설명" 탭의 활용가이드에서 확인해야 한다. 이 세션에서는
// 로그인·승인 없이 그 문서를 볼 방법이 없어, 엔드포인트를 추측해서 채우지 않고
// 스텁으로 남긴다("확인하지 않은 API 엔드포인트를 추측해서 작성하지 않는다").
export async function collectFscIndex(): Promise<CollectedIndicator[] | null> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[fsc-index] DATA_GO_KR_API_KEY가 없어 건너뜁니다.')
    return null
  }
  console.log(
    '[fsc-index] 정확한 요청 엔드포인트가 확인되지 않아 아직 구현되지 않았습니다 (README 참고). 건너뜁니다.',
  )
  return null
}
