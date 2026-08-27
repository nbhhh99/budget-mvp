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

// srtnCd(단축코드)를 1차 키로, itmsNm(종목명)을 보조 확인으로 쓴다 — 코드가 문서에
// 명시돼 있어 더 안정적이라고 판단했다.
function findRow(rows: GoldRow[]): GoldRow | undefined {
  return rows.find((r) => r.srtnCd === TARGET_SRTN_CD) ?? rows.find((r) => (r.itmsNm ?? '').trim() === TARGET_ITMS_NM)
}

export async function collectFscGold(): Promise<ProviderResult> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[fsc-gold] DATA_GO_KR_API_KEY가 없어 건너뜁니다.')
    return { status: 'missing_key', provider: PROVIDER }
  }

  const latest = await findLatestDataGoKr(BASE, apiKey, new Date())
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
    return { status: 'not_released', provider: PROVIDER }
  }

  const rows = latest.rows as GoldRow[]
  const row = findRow(rows)
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
