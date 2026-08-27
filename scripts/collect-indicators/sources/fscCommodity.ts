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
// fsc-index에서 실제로 확인된 문제(numOfRows=100 한 페이지만 받아 클라이언트에서
// 걸러내면 대상 종목이 다른 페이지에 있을 때 놓친다)와 같은 위험을 피하려고, 이
// 종목도 활용자가이드에 문서화된 itmsNm 요청 필터("검색값과 종목명이 일치하는
// 데이터를 검색")를 서버에 실어 보낸다 — 페이지 수와 무관하게 정확히 이 종목만
// 돌려받는다.
const BASE = 'https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService/getGoldPriceInfo'
const TARGET_ITMS_NM = '금 99.99_1Kg'
const TARGET_SRTN_CD = '04020000'

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

export async function collectFscGold(): Promise<ProviderResult> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[fsc-gold] DATA_GO_KR_API_KEY가 없어 건너뜁니다.')
    return { status: 'missing_key', provider: PROVIDER }
  }

  const latest = await findLatestDataGoKr(BASE, apiKey, new Date(), 10, { itmsNm: TARGET_ITMS_NM })
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
    // 진단용: itmsNm 필터 없이 오늘 날짜만 한 번 더(추가 조회 1회) 확인해, 실제로
    // "금"을 포함한 종목명이 있는지 로그에 남긴다 — TARGET_ITMS_NM 표기가 문서
    // 작성 시점(2022) 이후 바뀌었을 가능성을 다음 세션에서 바로 확인할 수 있게
    // 한다(값을 지어내지 않고, 실제로 온 종목명만 그대로 보여준다).
    const probe = await findLatestDataGoKr(BASE, apiKey, new Date(), 1)
    if (probe.kind === 'ok') {
      const goldLike = (probe.rows as GoldRow[])
        .filter((r) => (r.itmsNm ?? '').includes('금'))
        .map((r) => `${r.itmsNm}(${r.srtnCd})`)
        .slice(0, 10)
      console.warn(`[fsc-gold] 참고: 오늘자 응답에서 "금" 포함 종목명: ${goldLike.length ? goldLike.join(', ') : '없음'}`)
    }
    return { status: 'not_released', provider: PROVIDER }
  }

  const rows = latest.rows as GoldRow[]
  // itmsNm 필터를 걸었으니 보통 이 한 건만 온다 — 그래도 srtnCd로 한 번 더
  // 교차검증하고(1차 키가 더 안정적이라는 문서 근거), 못 찾으면(필터가 느슨하게
  // 적용된 경우 대비) 실제로 뭐가 왔는지 그대로 남긴다.
  const row = rows.find((r) => r.srtnCd === TARGET_SRTN_CD) ?? rows.find((r) => (r.itmsNm ?? '').trim() === TARGET_ITMS_NM)
  if (!row) {
    const seen = [...new Set(rows.map((r) => `${r.itmsNm ?? '?'}(${r.srtnCd ?? '?'})`))].slice(0, 10)
    const reason = `응답에서 "${TARGET_ITMS_NM}"(${TARGET_SRTN_CD}) 종목을 찾지 못했습니다. 실제 종목: ${seen.length ? seen.join(', ') : '없음'}`
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
  console.log(`[fsc-gold] 수집 성공: ${value}원/g (${referenceDate})`)

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
