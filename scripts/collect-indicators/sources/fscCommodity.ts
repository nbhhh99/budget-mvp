import type { CollectedIndicator } from '../types'

// 금융위원회_일반상품시세정보 Open API의 "금시세"(KRX 금시장) 오퍼레이션. 실제 존재를
// 확인했다: https://www.data.go.kr/data/15094805/openapi.do
// (인증키 필요·무료·일 1회 갱신, 석유시세·금시세·배출권시세 3개 오퍼레이션으로
// 구성된다는 것까지는 이 세션에서 확인함)
//
// TODO(구현 전 필수 확인): 금시세 오퍼레이션의 정확한 요청 URL·파라미터는 활용신청
// 승인 후 활용가이드에서 확인해야 한다(fscIndex.ts와 동일한 사유로 스텁 처리).
export async function collectFscGold(): Promise<CollectedIndicator[] | null> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[fsc-gold] DATA_GO_KR_API_KEY가 없어 건너뜁니다.')
    return null
  }
  console.log(
    '[fsc-gold] 정확한 요청 엔드포인트가 확인되지 않아 아직 구현되지 않았습니다 (README 참고). 건너뜁니다.',
  )
  return null
}
