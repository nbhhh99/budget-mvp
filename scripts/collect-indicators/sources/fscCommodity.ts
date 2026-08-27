import type { CollectedIndicator, ProviderResult } from '../types'
import { findLatestDataGoKr, yyyymmddToIso } from './dataGoKrEnvelope'

const PROVIDER = 'fsc-gold'

// 금융위원회_일반상품시세정보 Open API의 "금시세"(KRX 금시장) 오퍼레이션(활용자가이드
// 문서로 확인된 엔드포인트·필드):
//   GET https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService/getGoldPriceInfo
//   basDt(기준일)·srtnCd(단축코드)·itmsNm(종목명)·clpr(종가)·vs(전일 대비)·fltRt(등락률)
// 대상 종목은 "금 99.99_1Kg"(단축코드 04020000)만 쓴다(국제 금과 섞지 않는다 —
// gold-international은 이 파일이 아니라 alphaVantageMarkets.ts가 다루고, 그쪽은
// 여전히 미구현이다).
//
// clpr은 종목명("...1Kg")과 달리 원/kg이 아니라 이미 원/g 단위다 — 활용자가이드의
// 응답 예제(2022-09-19 기준 clpr=74560)가 그 시점의 실제 KRX 금 시세(원/g 기준)와
// 일치해 확인했다(1kg 단위였다면 7천만 원대여야 한다). 그래서 단위 환산 없이 그대로
// 쓴다 — "1Kg"는 시세를 매기는 거래 단위 표기일 뿐 가격 단위가 아니다.
//
// 실제 GitHub Actions 실행에서 itmsNm 정확 일치 필터("금 99.99_1Kg")로는 10일
// 내내 데이터를 찾지 못했다 — 활용자가이드의 2022년 예시 표기가 지금도 정확히
// 같은 문자열인지 보장할 수 없다(지수 API 문서에도 2024-12-06 지수명 변경 선례가
// 있다). 대신 활용자가이드가 명시한 또 다른 요청 필터 likeSrtnCd(단축코드 포함
// 검색, 예시 검색값 "4020000")로 바꿨다 — 종목명 표기가 바뀌어도 코드 체계는
// 안정적이라고 판단했다. 서버가 이 필터로 같은 금 시리즈의 여러 중량(1kg·100g 등)
// 후보를 돌려줄 수 있으므로, 응답을 받은 뒤 클라이언트에서 srtnCd로 정확히
// "04020000"(1kg)만 골라내고 100g 등 다른 중량과 섞이지 않게 한다.
const BASE = 'https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService/getGoldPriceInfo'
const TARGET_SRTN_CD = '04020000'
const LIKE_SRTN_CD = '4020000'

interface GoldRow {
  basDt?: string
  srtnCd?: string
  itmsNm?: string
  clpr?: string | number
  vs?: string | number
  fltRt?: string | number
}

function toNumber(raw: string | number | undefined): number | null {
  if (raw === undefined) return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

function normalizeSrtnCd(raw: string | undefined): string {
  return String(raw ?? '').trim()
}

// itmsNm 표기가 활용가이드 예시와 완전히 같다고 보장할 수 없어, 셋 다 포함하는지만
// 본다("금"·"99.99"·"1kg" 표기, 대소문자 무관) — "100g" 같은 다른 중량 종목이나
// 국제 금과는 섞이지 않는다(1kg/1Kg 표기가 없으면 매치되지 않는다).
function looksLike1kgGold(itmsNm: string): boolean {
  const lower = itmsNm.toLowerCase()
  return itmsNm.includes('금') && itmsNm.includes('99.99') && lower.includes('1kg')
}

// srtnCd 정확 일치(04020000)를 1순위로 쓴다 — 코드가 문서에 명시돼 있어 표기
//변형(공백·소수점 등)에 흔들리지 않는 가장 안정적인 키다. 정확한 코드가 없을 때만
// itmsNm 보조 후보를 찾고, 그 경우엔 바로 확정하지 않고 실제 itmsNm·srtnCd를
// 로그로 남긴 뒤(§보조 후보를 바로 확정하지 말고 로그에 남김) 그 후보를 쓴다 —
// 어느 쪽으로도 "금 1kg 종목"임을 확인하지 못하면(즉, srtnCd도 정확히 일치하지
// 않고 itmsNm도 세 조건을 모두 만족하지 않으면) undefined를 반환해 값을 저장하지
// 않는다.
function findGoldRow(rows: GoldRow[]): GoldRow | undefined {
  const exact = rows.find((r) => normalizeSrtnCd(r.srtnCd) === TARGET_SRTN_CD)
  if (exact) return exact

  const candidate = rows.find((r) => looksLike1kgGold(r.itmsNm ?? ''))
  if (candidate) {
    console.warn(
      `[fsc-gold] srtnCd 정확 일치(${TARGET_SRTN_CD})가 없어 보조 후보로 매칭합니다 — ` +
        `itmsNm="${candidate.itmsNm ?? ''}", srtnCd="${normalizeSrtnCd(candidate.srtnCd)}" ` +
        `(금 1kg 종목이 맞는지 재확인이 필요할 수 있습니다).`,
    )
  }
  return candidate
}

export async function collectFscGold(): Promise<ProviderResult> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[fsc-gold] DATA_GO_KR_API_KEY가 없어 건너뜁니다.')
    return { status: 'missing_key', provider: PROVIDER }
  }

  const latest = await findLatestDataGoKr(BASE, apiKey, new Date(), 10, { likeSrtnCd: LIKE_SRTN_CD })
  if (latest.kind === 'unauthorized') {
    console.warn(`[fsc-gold] 인증/키 오류 — ${latest.detail}`)
    return { status: 'unauthorized', provider: PROVIDER, code: latest.detail }
  }
  if (latest.kind === 'rate-limited') {
    console.warn(`[fsc-gold] 호출 한도 초과 — ${latest.detail}`)
    return { status: 'rate_limited', provider: PROVIDER, code: latest.detail }
  }
  if (latest.kind === 'error') {
    console.warn(`[fsc-gold] 수집 실패 — ${latest.detail}`)
    return { status: 'failed', provider: PROVIDER, reason: latest.detail }
  }
  if (latest.kind === 'no-data') {
    console.warn('[fsc-gold] 최근 10일 안에서 금시세 데이터를 찾지 못했습니다.')
    // 진단용: 필터 없이 최근 10일을 다시 확인해(오늘 하루만으로는 그날이 휴장일일
    // 때 아무것도 못 보고 끝난다), 실제로 "금"을 포함한 종목명이 있는지 로그에
    // 남긴다 — 값을 지어내지 않고, 실제로 온 기준일·종목명·단축코드만 그대로
    // 보여준다. 키·전체 요청 URL은 남기지 않는다.
    const probe = await findLatestDataGoKr(BASE, apiKey, new Date(), 10)
    if (probe.kind === 'ok') {
      const goldLike = (probe.rows as GoldRow[])
        .filter((r) => (r.itmsNm ?? '').includes('금'))
        .map((r) => `기준일=${probe.dateStr} itmsNm=${r.itmsNm ?? ''} srtnCd=${normalizeSrtnCd(r.srtnCd)}`)
        .slice(0, 10)
      console.warn(`[fsc-gold] 참고: "금" 포함 종목 — ${goldLike.length ? goldLike.join(' / ') : '없음'}`)
    }
    return { status: 'not_released', provider: PROVIDER }
  }

  const rows = latest.rows as GoldRow[]
  const row = findGoldRow(rows)
  if (!row) {
    const seen = [...new Set(rows.map((r) => `${r.itmsNm ?? '?'}(${normalizeSrtnCd(r.srtnCd) || '?'})`))].slice(0, 10)
    const reason = `금 1kg 종목(srtnCd ${TARGET_SRTN_CD})임을 확인하지 못했습니다. 실제 종목: ${seen.length ? seen.join(', ') : '없음'}`
    console.warn(`[fsc-gold] ${reason}`)
    return { status: 'invalid_response', provider: PROVIDER, reason }
  }

  const value = toNumber(row.clpr)
  if (value === null) {
    console.warn('[fsc-gold] 금시세 종가(clpr) 값을 숫자로 해석하지 못했습니다.')
    return { status: 'invalid_response', provider: PROVIDER, reason: '금시세 종가(clpr) 값을 숫자로 해석하지 못했습니다.' }
  }
  const change = toNumber(row.vs)
  const fltRt = toNumber(row.fltRt)
  const referenceDate = yyyymmddToIso(latest.dateStr)

  // 값 자체는 공개 시세 정보라 비밀이 아니다 — 성공 시에도 남겨야, 이후 값이
  // 화면에 실제로 반영되지 않을 때(예: 다른 단계의 이상치 검증에서 걸러짐)
  // "애초에 못 가져온 것"과 "가져왔는데 버려진 것"을 구분할 수 있다.
  console.log(`[fsc-gold] 수집 성공: ${value}원/g (${referenceDate}, itmsNm="${row.itmsNm ?? ''}")`)

  return {
    status: 'success',
    provider: PROVIDER,
    indicators: [
      {
        id: 'gold-krx',
        category: 'gold',
        name: 'KRX 금시장(국내 금)',
        value,
        unit: '원/g',
        change,
        changeRate: fltRt,
        referenceDate,
        sourceId: PROVIDER,
        sourceName: '금융위원회(한국거래소 제공)',
        sourceUrl: 'https://www.data.go.kr/data/15094805/openapi.do',
        marketStatus: 'closed',
      } satisfies CollectedIndicator,
    ],
  }
}
