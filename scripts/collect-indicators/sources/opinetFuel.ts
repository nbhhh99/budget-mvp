import type { CollectedIndicator, ProviderResult } from '../types'

const PROVIDER = 'opinet-fuel'

// 한국석유공사 오피넷 "전국 평균가격" Open API. 공공데이터포털에 등록돼 있다:
// https://www.data.go.kr/data/15150932/openapi.do (무료)
// 실제 GitHub Actions 실행에서 유효한 키로 호출했을 때 `RESULT.OIL 배열이 비어
// 있거나 없는 응답 형식 오류`가 관측됐다 — 원인이 "정말 빈 배열"인지 "OIL 자체가
// 없는 오류 응답"인지 이전 코드는 구분하지 못했다. 이번에 그 둘을 명확히 나눈다.
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

type OpinetParseOutcome =
  | { kind: 'ok'; rows: OpinetOilRow[] }
  | { kind: 'empty' } // RESULT.OIL이 실제로 빈 배열 — 정상 오류가 아니라 아직 발표 전일 가능성
  | { kind: 'error'; reason: string } // RESULT/OIL 누락, XML, 파싱 실패 등 — 빈 배열과 다르게 취급

// out=json으로 요청했는데 XML이 오거나, RESULT나 OIL 자체가 없는 경우는 "그날
// 데이터가 없다"가 아니라 오류 응답일 가능성이 높다 — 절대 빈 배열로 뭉뚱그리지
// 않고 실제로 무엇이 왔는지(다른 필드가 있는지, 타입이 무엇인지) 진단 가능한
// 사유로 남긴다(§오류 응답을 단순한 빈 배열로 처리하지 않음).
function parseOpinetResponse(rawText: string): OpinetParseOutcome {
  const trimmed = rawText.trim()
  if (trimmed.startsWith('<')) {
    return { kind: 'error', reason: 'JSON(out=json)을 요청했지만 XML 응답을 받았습니다.' }
  }

  let json: unknown
  try {
    json = JSON.parse(trimmed)
  } catch {
    return { kind: 'error', reason: 'JSON 파싱에 실패했습니다.' }
  }

  const result = (json as { RESULT?: unknown }).RESULT
  if (result === undefined || typeof result !== 'object' || result === null) {
    return { kind: 'error', reason: '응답에 RESULT 객체가 없습니다.' }
  }

  const oil = (result as { OIL?: unknown }).OIL
  if (oil === undefined) {
    const otherKeys = Object.keys(result as Record<string, unknown>).slice(0, 10)
    return {
      kind: 'error',
      reason: `RESULT에 OIL 필드가 없습니다(RESULT의 다른 필드: ${otherKeys.length ? otherKeys.join(', ') : '없음'}).`,
    }
  }
  if (Array.isArray(oil)) {
    return oil.length === 0 ? { kind: 'empty' } : { kind: 'ok', rows: oil as OpinetOilRow[] }
  }
  // 결과가 1건이면 배열이 아니라 단일 객체로 오는 API가 흔하다 — 배열로 정규화한다.
  if (typeof oil === 'object' && oil !== null) {
    return { kind: 'ok', rows: [oil as OpinetOilRow] }
  }
  return { kind: 'error', reason: `RESULT.OIL이 배열도 단일 객체도 아닙니다(타입: ${typeof oil}).` }
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

    const text = await res.text()
    const outcome = parseOpinetResponse(text)
    if (outcome.kind === 'error') {
      console.warn(`[opinet-fuel] 응답 형식 오류 — ${outcome.reason}`)
      return { status: 'invalid_response', provider: PROVIDER, reason: outcome.reason }
    }
    if (outcome.kind === 'empty') {
      console.warn('[opinet-fuel] RESULT.OIL이 빈 배열입니다(아직 발표 전일 수 있음).')
      return { status: 'not_released', provider: PROVIDER }
    }

    const rows = outcome.rows
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
      const seen = [...new Set(rows.map((r) => r.PRODCD).filter((c): c is string => Boolean(c)))].slice(0, 10)
      return {
        status: 'invalid_response',
        provider: PROVIDER,
        reason: `대상 유종(B027/D047) 코드가 응답에 없습니다. 실제 PRODCD: ${seen.length ? seen.join(', ') : '없음'}`,
      }
    }
    return { status: 'success', provider: PROVIDER, indicators: items }
  } catch (err) {
    console.warn('[opinet-fuel] 수집 실패:', err)
    return { status: 'failed', provider: PROVIDER, reason: err instanceof Error ? err.message : String(err) }
  }
}
