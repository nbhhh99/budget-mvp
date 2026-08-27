import type { CollectedIndicator, ProviderResult } from '../types'

const PROVIDER = 'opinet-fuel'

// 한국석유공사 오피넷 "전국 평균가격" Open API. 공공데이터포털에 등록돼 있다:
// https://www.data.go.kr/data/15150932/openapi.do (무료)
//
// 실제 GitHub Actions 실행 로그에 다음 한 줄만 남았다:
//   [opinet-fuel] 응답에 OIL 데이터가 없습니다(형식이 예상과 다르거나 데이터 없음).
// 이 메시지만으로는 인증 오류인지 정상적인 빈 응답인지 구분할 수 없었다 — 그래서
// 이번에 각 단계에서 안전하게(비밀 없이) 진단 가능한 정보를 남기도록 로깅을
// 전면 보강했다. 오피넷 자체의 오류코드 체계는 공식 문서로 확인하지 못했으므로
// 코드값을 지어내지 않고, 실제로 온 값을 있는 그대로 로그·reason에 남긴다.
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

// 응답 어딘가에 있을 수 있는 오류코드/메시지 필드를 흔한 이름들로 찾아본다. 오피넷의
// 공식 오류코드 체계를 문서로 확인하지 못했으므로 이 이름들이 맞는다고 가정하지
// 않는다 — 있으면 값을 그대로 노출하고(추측 없이), 없으면 그냥 undefined로 둔다.
const ERROR_CODE_KEYS = ['CODE', 'code', 'RESULT_CODE', 'resultCode', 'ERRCD', 'errCode']
const ERROR_MSG_KEYS = ['MSG', 'msg', 'MESSAGE', 'message', 'RESULT_MSG', 'resultMsg', 'errMsg']

function findFirst(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const v = obj[key]
    if (typeof v === 'string' && v.length > 0) return v
    if (typeof v === 'number') return String(v)
  }
  return undefined
}

type OpinetParseOutcome =
  | { kind: 'ok'; rows: OpinetOilRow[]; shape: 'array' | 'object' }
  | { kind: 'empty' } // RESULT.OIL이 실제로 빈 배열 — 아직 발표 전일 가능성(정상 오류 아님)
  | { kind: 'error'; reason: string; apiCode?: string; apiMsg?: string }

// out=json으로 요청했는데 XML이 오거나, RESULT나 OIL 자체가 없는 경우는 "그날
// 데이터가 없다"가 아니라 오류 응답일 가능성이 높다 — 절대 빈 배열로 뭉뚱그리지
// 않고 실제로 무엇이 왔는지(최상위 필드명, API 자체 오류코드/메시지가 있다면 그 값,
// 배열인지 단일 객체인지) 진단 가능한 형태로 남긴다. 전체 응답 본문은 어떤 경로로도
// 로그에 남기지 않는다.
function parseOpinetResponse(rawText: string): OpinetParseOutcome {
  const trimmed = rawText.trim()
  if (trimmed.startsWith('<')) {
    console.warn('[opinet-fuel] 응답 형식: XML (JSON을 요청(out=json)했는데 XML 응답을 받음)')
    return { kind: 'error', reason: 'JSON(out=json)을 요청했지만 XML 응답을 받았습니다.' }
  }
  console.log('[opinet-fuel] 응답 형식: JSON')

  let json: unknown
  try {
    json = JSON.parse(trimmed)
  } catch {
    return { kind: 'error', reason: 'JSON 파싱에 실패했습니다.' }
  }

  if (typeof json !== 'object' || json === null) {
    return { kind: 'error', reason: `최상위 응답이 객체가 아닙니다(타입: ${typeof json}).` }
  }
  const topObj = json as Record<string, unknown>
  // 최상위 필드명만 기록한다 — 값(특히 키가 섞여 들어올 가능성이 있는 필드)은
  // 여기서 남기지 않는다.
  console.log(`[opinet-fuel] 응답 최상위 필드명: ${Object.keys(topObj).join(', ') || '없음'}`)

  const result = topObj.RESULT
  if (result === undefined || typeof result !== 'object' || result === null) {
    const apiCode = findFirst(topObj, ERROR_CODE_KEYS)
    const apiMsg = findFirst(topObj, ERROR_MSG_KEYS)
    return {
      kind: 'error',
      reason: '응답에 RESULT 객체가 없습니다(응답 형식이 바뀌었을 수 있음).',
      apiCode,
      apiMsg,
    }
  }

  const resultObj = result as Record<string, unknown>
  const oil = resultObj.OIL
  if (oil === undefined) {
    const otherKeys = Object.keys(resultObj).slice(0, 10)
    const apiCode = findFirst(resultObj, ERROR_CODE_KEYS)
    const apiMsg = findFirst(resultObj, ERROR_MSG_KEYS)
    return {
      kind: 'error',
      reason: `RESULT에 OIL 필드가 없습니다(RESULT의 다른 필드: ${otherKeys.length ? otherKeys.join(', ') : '없음'}).`,
      apiCode,
      apiMsg,
    }
  }
  if (Array.isArray(oil)) {
    console.log(`[opinet-fuel] RESULT.OIL 형태: 배열(${oil.length}건)`)
    return oil.length === 0 ? { kind: 'empty' } : { kind: 'ok', rows: oil as OpinetOilRow[], shape: 'array' }
  }
  // 결과가 1건이면 배열이 아니라 단일 객체로 오는 API가 흔하다 — 배열로 정규화한다.
  if (typeof oil === 'object' && oil !== null) {
    console.log('[opinet-fuel] RESULT.OIL 형태: 단일 객체(1건)')
    return { kind: 'ok', rows: [oil as OpinetOilRow], shape: 'object' }
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
    // HTTP 상태코드 자체는 민감정보가 아니다 — 항상 기록한다(키·전체 URL은 아래
    // 어떤 로그에도 남기지 않는다).
    console.log(`[opinet-fuel] HTTP 상태코드: ${res.status}`)

    // HTTP 401(Unauthorized)과 403(Forbidden)은 표준적으로 원인이 다르다 —
    // 401은 자격증명 자체가 유효하지 않음(인증키 오류), 403은 자격증명은
    // 받아들여졌지만 이 API 접근 권한이 없음(활용신청 미승인)을 뜻한다. 오피넷의
    // 실제 응답이 이 관례를 따르는지는 유효한 키로 확인 전까지 단정할 수 없어
    // "추정"으로 표기한다.
    if (res.status === 401) {
      console.warn('[opinet-fuel] HTTP 401 — 인증키 오류로 추정됩니다(키 값 자체가 유효하지 않음).')
      return { status: 'unauthorized', provider: PROVIDER, code: '인증키 오류로 추정 (HTTP 401)' }
    }
    if (res.status === 403) {
      console.warn('[opinet-fuel] HTTP 403 — API 활용 미승인으로 추정됩니다(키는 인식되지만 접근 권한 없음).')
      return { status: 'unauthorized', provider: PROVIDER, code: 'API 활용 미승인으로 추정 (HTTP 403)' }
    }
    if (!res.ok) {
      return { status: 'failed', provider: PROVIDER, reason: `HTTP ${res.status}`, httpStatus: res.status }
    }

    const text = await res.text()
    const outcome = parseOpinetResponse(text)
    if (outcome.kind === 'error') {
      const detail = [
        outcome.reason,
        outcome.apiCode ? `API 오류코드: ${outcome.apiCode}` : null,
        outcome.apiMsg ? `API 오류 메시지: ${outcome.apiMsg}` : null,
      ]
        .filter((s): s is string => Boolean(s))
        .join(' / ')
      console.warn(`[opinet-fuel] 응답 형식 오류 — ${detail}`)
      return { status: 'invalid_response', provider: PROVIDER, reason: detail, httpStatus: res.status }
    }
    if (outcome.kind === 'empty') {
      console.warn('[opinet-fuel] RESULT.OIL이 빈 배열입니다(빈 데이터 — 아직 발표 전일 수 있음).')
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
