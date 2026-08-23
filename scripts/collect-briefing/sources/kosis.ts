import type { BriefingItem } from '../../../src/types/models'

// KOSIS(국가통계포털) Open API. 무료 키 발급: https://kosis.kr/openapi/
// 소비자물가·고용 등 통계표 ID(orgId/tblId)는 KOSIS 통계표 검색에서 직접 찾아야 한다.
//
// TODO(구현 전 필수 확인): 이 세션에서는 정확한 통계표 ID를 확인할 방법이 없어
// 코드를 추측해서 채우지 않는다("확인하지 않은 API 주소나 응답 형식을 임의로
// 만들지 않는다"). KOSIS_API_KEY가 있어도 항상 건너뛴다.
export async function collectKosisItems(_yearMonth: string): Promise<BriefingItem[] | null> {
  const apiKey = process.env.KOSIS_API_KEY
  if (!apiKey) {
    console.log('[kosis] KOSIS_API_KEY가 없어 건너뜁니다.')
    return null
  }
  console.log('[kosis] 통계표 ID가 확인되지 않아 아직 구현되지 않았습니다 (README 참고). 건너뜁니다.')
  return null
}
