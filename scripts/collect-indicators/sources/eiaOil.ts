import type { CollectedIndicator } from '../types'

// 미국 에너지정보청(EIA) Open Data API. 무료 키 발급: https://www.eia.gov/opendata/register.php
// 재사용 정책상 재배포 가능함을 이 세션에서 확인했다. WTI·Brent 현물가격 데이터가
// 존재한다는 것까지는 알지만, 정확한 시리즈 ID(예: petroleum/pri/spt 경로의 series id)는
// 이 세션에서 확인하지 못했다.
//
// 두바이유는 장외 벤치마크(통상 Platts 등 유료 라이선스로 고시)라 공식 무료 API를
// 찾지 못해 이 프로젝트에서는 지원하지 않는다.
//
// TODO(구현 전 필수 확인): EIA API 브라우저(https://www.eia.gov/opendata/browser/petroleum)에서
// WTI(Cushing)·Brent(Europe) 현물가격의 정확한 series id를 확인한 뒤 구현해야 한다.
export async function collectEiaOil(): Promise<CollectedIndicator[] | null> {
  const apiKey = process.env.EIA_API_KEY
  if (!apiKey) {
    console.log('[eia-oil] EIA_API_KEY가 없어 건너뜁니다.')
    return null
  }
  console.log('[eia-oil] 정확한 시리즈 ID가 확인되지 않아 아직 구현되지 않았습니다 (README 참고). 건너뜁니다.')
  return null
}
