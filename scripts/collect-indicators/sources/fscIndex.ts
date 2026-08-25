import type { ProviderResult } from '../types'

// 금융위원회_지수시세정보 Open API(KOSPI·KOSDAQ). 공공데이터포털에 등록돼 있고
// 실제 존재를 확인했다: https://www.data.go.kr/data/15094807/openapi.do
// 이 세션에서 그 페이지를 다시 확인해 다음까지는 얻었다:
//   - 심의유형: 개발단계 자동승인 / 운영단계 자동승인(신청 즉시 키 발급)
//   - 개발계정 트래픽: 10,000건/일
//   - 오퍼레이션: 주가지수 시세 / 채권지수 시세 / 파생상품지수 시세 3종
//   - 응답에 시가·고가·저가·종가·등락률·거래량 포함
//   - "오픈API 활용자가이드_금융위원회_지수시세정보.docx" 문서가 별도 제공됨
//
// 그런데 정확한 요청 URL(엔드포인트 경로)·오퍼레이션 식별자·파라미터 이름·
// KOSPI/KOSDAQ을 구분하는 정확한 필드 값은 저 활용자가이드 문서 안에만 있고,
// data.go.kr 소개 페이지 자체에는 나오지 않는다. 그 문서는 공공데이터포털
// 로그인 + (자동승인이라도) 활용신청 완료 후에만 다운로드할 수 있어, 로그인
// 세션이 없는 이 환경에서는 열어볼 방법이 없었다. "확인하지 않은 API 엔드포인트를
// 추측해서 작성하지 않는다"는 원칙에 따라 엔드포인트를 채우지 않고 스텁으로
// 남긴다 — DATA_GO_KR_API_KEY를 등록해도 이 함수는 여전히 구현되지 않은 상태다.
//
// 다음 세션에서 구현하려면: data.go.kr에서 이 API를 활용신청(자동승인)한 뒤
// "활용자가이드" docx를 내려받아 정확한 엔드포인트/파라미터를 알려주면 그때
// 구현할 수 있다.
export async function collectFscIndex(): Promise<ProviderResult> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[fsc-index] DATA_GO_KR_API_KEY가 없어 건너뜁니다.')
    return { status: 'missing_key', provider: 'fsc-index' }
  }
  console.log(
    '[fsc-index] 정확한 요청 엔드포인트가 활용자가이드 문서 안에만 있어(로그인 필요) 아직 구현되지 않았습니다. 건너뜁니다.',
  )
  return {
    status: 'not_implemented',
    provider: 'fsc-index',
    reason: '활용자가이드 문서(로그인 후 다운로드) 미확인 — 엔드포인트/파라미터 추측 금지 원칙에 따라 보류',
  }
}
