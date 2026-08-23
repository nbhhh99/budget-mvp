import type { BriefingItem } from '../../../src/types/models'

// 한국은행 ECOS Open API.
// 무료 키 발급: https://ecos.bok.or.kr/api/ (회원가입 즉시 인증키 자동 발급)
// 요청 형식: https://ecos.bok.or.kr/api/StatisticSearch/{인증키}/json/kr/1/10/{통계표코드}/{주기}/{시작}/{끝}/{항목코드1}
//
// TODO(구현 전 필수 확인): 기준금리·원달러 환율·가계신용 등 각 통계의 정확한
// 통계표코드(table_code)·항목코드(item_code)는 ECOS 개발가이드 > 서비스 통계목록에서
// 직접 검색해 확인해야 한다("확인하지 않은 API 주소나 응답 형식을 임의로 만들지 않는다").
// 이 세션에서는 그 코드 목록을 확인할 방법이 없어(로그인/검색 UI 필요), 코드를
// 추측해서 채우지 않고 스텁으로 남겨둔다. BOK_ECOS_API_KEY가 있어도 항상 건너뛴다.
export async function collectBokEcosItems(_yearMonth: string): Promise<BriefingItem[] | null> {
  const apiKey = process.env.BOK_ECOS_API_KEY
  if (!apiKey) {
    console.log('[bok-ecos] BOK_ECOS_API_KEY가 없어 건너뜁니다.')
    return null
  }
  console.log(
    '[bok-ecos] 통계표코드가 확인되지 않아 아직 구현되지 않았습니다 (README 참고). 건너뜁니다.',
  )
  return null
}
