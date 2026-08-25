import type { CollectedIndicator, ProviderResult } from '../types'

const PROVIDER = 'opinet-fuel'

// 한국석유공사 오피넷 "전국 평균가격" Open API. 공공데이터포털에 등록돼 있다:
// https://www.data.go.kr/data/15150932/openapi.do (무료)
// 이 세션에서 실제로 요청을 보내 살아있는 엔드포인트인지 확인했다(무효 키로도
// {"RESULT":{"OIL":[]}} 형태의 구조화된 JSON이 돌아온다 — 추측이 아니라 관측한 값이다).
// 다만 유효한 키로 받은 실제 응답 필드명(PRODCD/PRICE/DIFF)까지는 이 세션에서
// 검증하지 못해, 아래 파싱은 방어적으로 작성했다 — 필드명이 예상과 다르면 그
// 항목만 조용히 건너뛰고(값을 지어내지 않음) 나머지 로직에는 영향을 주지 않는다.
const OPINET_BASE = 'https://www.opinet.co.kr/api/avgAllPrice.do'

interface OpinetOilRow {
  PRODCD?: string
  PRICE?: string | number
  DIFF?: string | number
  TRADE_DT?: string
}

const TARGET_PRODUCTS: { prodCode: string; id: string; name: string }[] = [
  { prodCode: 'B027', id: 'fuel-gasoline', name: '전국 평균 휘발유' },
  { prodCode: 'D047', id: 'fuel-diesel', name: '전국 평균 경유' },
]

function toNumber(raw: string | number | undefined): number | null {
  if (raw === undefined) return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

export async function collectOpinetFuel(): Promise<ProviderResult> {
  const apiKey = process.env.OPINET_API_KEY
  if (!apiKey) {
    console.log('[opinet-fuel] OPINET_API_KEY가 없어 건너뜁니다.')
    return { status: 'missing_key', provider: PROVIDER }
  }

  try {
    const url = new URL(OPINET_BASE)
    url.searchParams.set('code', apiKey)
    url.searchParams.set('out', 'json')

    const res = await fetch(url)
    if (res.status === 401 || res.status === 403) {
      console.warn(`[opinet-fuel] 인증 실패(HTTP ${res.status}) — OPINET_API_KEY 값 또는 이용 승인 상태를 확인해야 합니다.`)
      return { status: 'unauthorized', provider: PROVIDER, code: `HTTP ${res.status}` }
    }
    if (!res.ok) {
      return { status: 'failed', provider: PROVIDER, reason: `HTTP ${res.status}`, httpStatus: res.status }
    }
    const json = (await res.json()) as { RESULT?: { OIL?: OpinetOilRow[] } }
    const rows = json.RESULT?.OIL
    if (!Array.isArray(rows) || rows.length === 0) {
      console.warn('[opinet-fuel] 응답에 OIL 데이터가 없습니다(형식이 예상과 다르거나 데이터 없음).')
      return { status: 'invalid_response', provider: PROVIDER, reason: 'RESULT.OIL 배열이 비어 있거나 없습니다.' }
    }

    const today = new Date()
    const referenceDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const items: CollectedIndicator[] = []
    for (const target of TARGET_PRODUCTS) {
      const row = rows.find((r) => r.PRODCD === target.prodCode)
      const value = toNumber(row?.PRICE)
      if (value === null) continue
      const change = toNumber(row?.DIFF)
      const changeRate = change !== null && value !== 0 ? Number(((change / (value - change)) * 100).toFixed(2)) : null

      items.push({
        id: target.id,
        category: 'fuel',
        name: target.name,
        value,
        unit: '원/리터',
        change,
        changeRate,
        referenceDate,
        sourceId: 'opinet-fuel',
        sourceName: '한국석유공사 오피넷',
        sourceUrl: 'https://www.opinet.co.kr',
        marketStatus: 'unknown',
      })
    }
    if (items.length === 0) {
      return { status: 'invalid_response', provider: PROVIDER, reason: '대상 유종(B027/D047) 코드가 응답에 없습니다.' }
    }
    return { status: 'success', provider: PROVIDER, indicators: items }
  } catch (err) {
    console.warn('[opinet-fuel] 수집 실패:', err)
    return { status: 'failed', provider: PROVIDER, reason: err instanceof Error ? err.message : String(err) }
  }
}
