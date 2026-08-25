import type { ProviderResult } from '../types'

// 금융위원회_일반상품시세정보 Open API의 "금시세"(KRX 금시장) 오퍼레이션. 실제 존재를
// 확인했다: https://www.data.go.kr/data/15094805/openapi.do
// (심의유형: 개발/운영 모두 자동승인, 개발계정 10,000건/일, 석유시세·금시세·배출권시세
// 3개 오퍼레이션으로 구성 — 이 세션에서 재확인함)
//
// fscIndex.ts와 같은 이유로 스텁이다: 정확한 요청 URL·금시세 오퍼레이션 파라미터는
// 로그인 후 다운로드하는 "오픈API 활용자가이드_금융위원회_일반상품시세정보.docx"
// 안에만 있고, 이 세션에는 그 문서를 열어볼 로그인 세션이 없었다. 엔드포인트를
// 추측해서 채우지 않는다.
export async function collectFscGold(): Promise<ProviderResult> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[fsc-gold] DATA_GO_KR_API_KEY가 없어 건너뜁니다.')
    return { status: 'missing_key', provider: 'fsc-gold' }
  }
  console.log(
    '[fsc-gold] 정확한 요청 엔드포인트가 활용자가이드 문서 안에만 있어(로그인 필요) 아직 구현되지 않았습니다. 건너뜁니다.',
  )
  return {
    status: 'not_implemented',
    provider: 'fsc-gold',
    reason: '활용자가이드 문서(로그인 후 다운로드) 미확인 — 엔드포인트/파라미터 추측 금지 원칙에 따라 보류',
  }
}
