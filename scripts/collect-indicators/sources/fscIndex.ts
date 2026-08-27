import type { CollectedIndicator, ProviderResult } from '../types'
import { findLatestDataGoKr, yyyymmddToIso } from './dataGoKrEnvelope'

const PROVIDER = 'fsc-index'

// 금융위원회_지수시세정보 Open API(활용자가이드 문서로 확인된 엔드포인트·필드):
//   GET https://apis.data.go.kr/1160100/service/GetMarketIndexInfoService/getStockMarketIndex
//   basDt(기준일)·idxNm(지수명)·clpr(종가)·vs(전일 대비)·fltRt(등락률)
// serviceKey/numOfRows/pageNo/resultType/basDt 파라미터는 활용자가이드가 아니라
// data.go.kr 포털 공통 REST 규격이라(dataGoKrEnvelope.ts 참고) 여기 포함해도 추측이
// 아니다.
const BASE = 'https://apis.data.go.kr/1160100/service/GetMarketIndexInfoService/getStockMarketIndex'

interface IndexRow {
  basDt?: string
  idxNm?: string
  clpr?: string | number
  vs?: string | number
  fltRt?: string | number
}

// idxNm은 활용자가이드의 요청/응답 예제에 정확히 "코스피"로 나온다(공백·접미사 없음).
// 문서에 "코스닥" 예제는 없지만 같은 응답 스키마·명명 규칙(주가지수시세 오퍼레이션이
// KRX300·코스피·코스닥 등을 함께 조회한다고 명시)을 따르므로 대칭으로 "코스닥"을
// 쓴다. 코스피200·코스닥150 같은 하위지수와 혼동하지 않도록 정확히 일치하는 항목만
// 채택하고, 하나도 일치하지 않으면(idxNm 표기가 실제로 다르면) 값을 지어내지 않고
// 실제로 내려온 idxNm 값을 그대로 보고한다.
// 2024-12-06 이후 KOSPI·KOSDAQ 하위 섹터 지수명이 일부 바뀌었다고 문서에 안내돼
// 있지만(예: 음식료품→음식료·담배), "코스피"/"코스닥" 자체 표기는 영향받지 않는다.
const TARGETS: { id: string; name: string; idxNm: string }[] = [
  { id: 'stock-kospi', name: 'KOSPI', idxNm: '코스피' },
  { id: 'stock-kosdaq', name: 'KOSDAQ', idxNm: '코스닥' },
]

function toNumber(raw: string | number | undefined): number | null {
  if (raw === undefined) return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

function findRow(rows: IndexRow[], idxNm: string): IndexRow | undefined {
  return rows.find((r) => (r.idxNm ?? '').trim() === idxNm)
}

// 실제 GitHub Actions 실행에서 코스피/코스닥을 못 찾은 원인이 밝혀졌다: 이 API는
// 그 날짜의 수백 개 지수를 idxNm 순서 없이(코드/등록 순으로 보이는) 내려주고,
// numOfRows=100 한 페이지만 받아 클라이언트에서 걸러내면 코스피/코스닥이 뒤쪽
// 페이지에 있을 때 영영 놓친다(실제로 "IT 서비스, K-샤프지수..." 같은 100건만
// 받고 끝났다). 활용자가이드의 요청 메시지 명세에 idxNm이 "검색값과 지수명이
// 일치하는 데이터를 검색"하는 서버측 필터로 문서화돼 있으므로, 지수마다 별도
// 요청에 idxNm을 필터로 실어 보내 서버가 정확히 그 한 건만 돌려주게 한다 —
// 페이지 수와 무관하게 항상 찾을 수 있다.
export async function collectFscIndex(): Promise<ProviderResult> {
  const apiKey = process.env.DATA_GO_KR_API_KEY
  if (!apiKey) {
    console.log('[fsc-index] DATA_GO_KR_API_KEY가 없어 건너뜁니다.')
    return { status: 'missing_key', provider: PROVIDER }
  }

  const items: CollectedIndicator[] = []
  const notFound: string[] = []
  let sawAnyDate = false

  for (const target of TARGETS) {
    const latest = await findLatestDataGoKr(BASE, apiKey, new Date(), 10, { idxNm: target.idxNm })
    if (latest.kind === 'unauthorized') {
      console.warn(`[fsc-index] 인증/키 오류 — ${latest.detail}`)
      return { status: 'unauthorized', provider: PROVIDER, code: latest.detail }
    }
    if (latest.kind === 'rate-limited') {
      console.warn(`[fsc-index] 호출 한도 초과 — ${latest.detail}`)
      return { status: 'rate_limited', provider: PROVIDER, code: latest.detail }
    }
    if (latest.kind === 'error') {
      console.warn(`[fsc-index] ${target.name} 수집 실패 — ${latest.detail}`)
      continue // 인증·한도 문제가 아니면 다른 지수는 계속 시도한다
    }
    if (latest.kind === 'no-data') {
      console.warn(`[fsc-index] ${target.name}: 최근 10일 안에서 데이터를 찾지 못했습니다.`)
      continue
    }

    sawAnyDate = true
    const rows = latest.rows as IndexRow[]
    const row = findRow(rows, target.idxNm)
    if (!row) {
      // idxNm 필터를 걸었는데도 응답 행의 idxNm이 정확히 일치하지 않으면(예:
      // API가 필터를 느슨하게 적용) 실제로 뭐가 왔는지 남긴다 — 지어내지 않는다.
      const seen = [...new Set(rows.map((r) => r.idxNm).filter((n): n is string => Boolean(n)))].slice(0, 5)
      notFound.push(`${target.name}(실제 idxNm: ${seen.length ? seen.join(', ') : '없음'})`)
      continue
    }
    const value = toNumber(row.clpr)
    if (value === null) {
      console.warn(`[fsc-index] ${target.name} 종가(clpr) 값을 숫자로 해석하지 못했습니다.`)
      continue
    }
    const change = toNumber(row.vs)
    const changeRate = toNumber(row.fltRt)
    const referenceDate = yyyymmddToIso(latest.dateStr)

    // 전일 비교값과 교차검증하기 위한 하루 전 조회다(§제공 등락률과 직접 계산한
    // 등락률 교차검증). 실패해도 치명적이지 않다 — 실패하면 교차검증만 건너뛰고
    // API가 제공한 vs/fltRt를 그대로 신뢰한다.
    const previous = await findLatestDataGoKr(
      BASE,
      apiKey,
      new Date(Date.parse(referenceDate) - 24 * 60 * 60 * 1000),
      10,
      { idxNm: target.idxNm },
    )
    if (previous.kind === 'ok') {
      const prevRow = findRow(previous.rows as IndexRow[], target.idxNm)
      const prevValue = prevRow ? toNumber(prevRow.clpr) : null
      if (prevValue !== null && change !== null) {
        const expected = Number((value - prevValue).toFixed(2))
        if (Math.abs(expected - change) > Math.max(1, value * 0.01)) {
          console.warn(
            `[fsc-index] ${target.name} API 제공 등락(vs=${change})이 직접 계산한 값(${expected})과 크게 달라 필드 해석을 재확인해야 합니다.`,
          )
        }
      }
    }

    items.push({
      id: target.id,
      category: 'stock',
      name: target.name,
      value,
      unit: '포인트',
      change,
      changeRate,
      referenceDate,
      sourceId: PROVIDER,
      sourceName: '금융위원회(한국거래소 제공)',
      sourceUrl: 'https://www.data.go.kr/data/15094807/openapi.do',
      marketStatus: 'closed',
    })
  }

  if (items.length > 0) {
    return { status: 'success', provider: PROVIDER, indicators: items }
  }
  if (notFound.length > 0) {
    const reason = `대상 지수를 찾지 못했습니다: ${notFound.join(' / ')}`
    console.warn(`[fsc-index] ${reason}`)
    return { status: 'invalid_response', provider: PROVIDER, reason }
  }
  if (!sawAnyDate) {
    return { status: 'not_released', provider: PROVIDER }
  }
  return { status: 'invalid_response', provider: PROVIDER, reason: '코스피/코스닥 종가(clpr) 값을 숫자로 해석하지 못했습니다.' }
}
