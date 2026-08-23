import type { BriefingItem } from '../../../src/types/models'

// ECB Statistical Data Warehouse(SDW), SDMX 2.1 REST. 키는 필요 없다.
// 문서: https://data.ecb.europa.eu/help/api/overview (예전 sdw-wsrest.ecb.europa.eu 호스트는
// 이 세션의 네트워크 제한으로 접속을 확인하지 못했다).
//
// TODO(구현 전 필수 확인): 정확한 현재 호스트와 정책금리 series key(flowRef/key)를
// 공식 문서에서 직접 확인한 뒤 구현해야 한다. 통화정책 회의는 1년에 몇 번뿐이라
// 자동화 이득이 크지 않기도 해서, 우선은 manual/institutional.json에 사람이
// 직접 기입하는 방식을 기본으로 쓴다(§8 fallback 구조). 이 함수는 항상 null을
// 반환한다 — 엔드포인트가 확인되면 이 자리에 실제 구현을 채운다.
export async function collectEcbItems(_yearMonth: string): Promise<BriefingItem[] | null> {
  console.log('[ecb-sdw] 엔드포인트가 확인되지 않아 아직 구현되지 않았습니다. 건너뜁니다.')
  return null
}
