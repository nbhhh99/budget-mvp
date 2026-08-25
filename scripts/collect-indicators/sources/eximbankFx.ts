import type { CollectedIndicator, ProviderResult } from '../types'

// 한국수출입은행 환율정보 Open API. 인증키는 공공데이터포털 활용신청으로 발급받는다:
// https://www.data.go.kr/data/3068846/openapi.do (무료, 즉시~단기 승인)
// 실제 데이터 서버는 공공데이터포털 프록시가 아니라 한국수출입은행 자체 호스트다.
// 이 세션에서 실제 요청을 보내 응답 형식을 직접 확인했다(result=3은 "인증코드 오류"라는
// 문서화된 에러코드로, 엔드포인트가 살아있음을 확인해준다 — 추측이 아니다).
const EXIM_BASE = 'https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON'
const PROVIDER = 'eximbank-fx'

interface ExchangeRateRow {
  result: number // 1=정상, 2=DATA코드 오류, 3=인증코드 오류, 4=일일제한횟수 마감
  cur_unit: string | null // 'USD', 'JPY(100)', 'EUR' ...
  cur_nm: string | null
  deal_bas_r: string | null // 매매기준율, 콤마 포함 문자열(예: '1,350.50')
}

// 원하는 통화만 뽑아 표시명·id를 붙인다. 일본 엔은 100엔 단위로 고시되므로 화면에는
// "원/100엔"으로 명확히 표기한다(§2 "필요하면 원·엔, 원·유로를 확장할 수 있는 구조").
const TARGET_CURRENCIES: { curUnit: string; id: string; name: string }[] = [
  { curUnit: 'USD', id: 'fx-usd-krw', name: '원·달러 환율' },
  { curUnit: 'JPY(100)', id: 'fx-jpy100-krw', name: '원·100엔 환율' },
  { curUnit: 'EUR', id: 'fx-eur-krw', name: '원·유로 환율' },
]

function toKstDateString(date: Date): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return `${kst.getUTCFullYear()}${String(kst.getUTCMonth() + 1).padStart(2, '0')}${String(kst.getUTCDate()).padStart(2, '0')}`
}

function parseRate(raw: string | null): number | null {
  if (!raw) return null
  const n = Number(raw.replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

// 결과: 'ok'(정상 고시), 'no-data'(그날 고시 없음 — 휴일/고시 전, 재시도 대상),
// 'unauthorized'(인증키 오류), 'rate-limited'(일일 호출 한도 초과 — 재시도해도 소용없음).
type FetchOutcome =
  | { kind: 'ok'; rows: ExchangeRateRow[] }
  | { kind: 'no-data' }
  | { kind: 'unauthorized' }
  | { kind: 'rate-limited' }

async function fetchRatesForDate(dateStr: string, apiKey: string): Promise<FetchOutcome> {
  const url = new URL(EXIM_BASE)
  url.searchParams.set('authkey', apiKey)
  url.searchParams.set('searchdate', dateStr)
  url.searchParams.set('data', 'AP01') // AP01 = 환율

  const res = await fetch(url)
  if (!res.ok) throw new Error(`한국수출입은행 환율 API 요청 실패: ${res.status}`)
  const rows = (await res.json()) as ExchangeRateRow[]
  if (!Array.isArray(rows) || rows.length === 0) return { kind: 'no-data' }

  const result = rows[0].result
  // result=3(인증코드 오류)·4(일일제한횟수 마감)는 "그날 고시가 없는 것"과 원인이
  // 전혀 다르다 — 설정/한도 문제이지 데이터 미발표가 아니므로 절대 같은 취급을
  // 하지 않는다(§3 "인증 오류를 데이터 없음으로 처리하지 않음").
  if (result === 3) return { kind: 'unauthorized' }
  if (result === 4) return { kind: 'rate-limited' }
  if (result !== 1) return { kind: 'no-data' } // result=2(DATA코드 오류) 등 그 외는 데이터 없음으로 취급
  return { kind: 'ok', rows }
}

// 영업일이 아닌 날(주말·공휴일)은 응답이 비어 있으므로, 최근 영업일을 찾을 때까지
// 최근 7일 안에서 거슬러 올라간다(§3 "오늘 데이터가 없으면 최근 7일 안의 최신
// 영업일 조회"). 인증 오류·호출 한도 초과는 재시도해도 결과가 바뀌지 않으므로
// 그 즉시 위로 전파한다.
async function findLatestAvailable(
  startDate: Date,
  apiKey: string,
  maxLookbackDays = 7,
): Promise<
  | { kind: 'ok'; dateStr: string; rows: ExchangeRateRow[] }
  | { kind: 'no-data' }
  | { kind: 'unauthorized' }
  | { kind: 'rate-limited' }
> {
  for (let i = 0; i < maxLookbackDays; i++) {
    const d = new Date(startDate.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = toKstDateString(d)
    const outcome = await fetchRatesForDate(dateStr, apiKey)
    if (outcome.kind === 'unauthorized' || outcome.kind === 'rate-limited') return outcome
    if (outcome.kind === 'ok') return { kind: 'ok', dateStr, rows: outcome.rows }
    // no-data면 하루 더 거슬러 올라간다.
  }
  return { kind: 'no-data' }
}

function formatIso(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
}

export async function collectEximbankFx(): Promise<ProviderResult> {
  const apiKey = process.env.EXIMBANK_API_KEY
  if (!apiKey) {
    console.log('[eximbank-fx] EXIMBANK_API_KEY가 없어 건너뜁니다.')
    return { status: 'missing_key', provider: PROVIDER }
  }

  try {
    const now = new Date()
    const latest = await findLatestAvailable(now, apiKey)
    if (latest.kind === 'unauthorized') {
      console.warn('[eximbank-fx] 인증키 오류(result=3) — EXIMBANK_API_KEY 값 또는 활용신청 승인 상태를 확인해야 합니다.')
      return { status: 'unauthorized', provider: PROVIDER, code: 'result=3' }
    }
    if (latest.kind === 'rate-limited') {
      console.warn('[eximbank-fx] 일일 호출 한도 초과(result=4).')
      return { status: 'rate_limited', provider: PROVIDER, code: 'result=4' }
    }
    if (latest.kind === 'no-data') {
      console.warn('[eximbank-fx] 최근 7일 안에서 고시환율을 찾지 못했습니다.')
      return { status: 'not_released', provider: PROVIDER }
    }

    const referenceDate = formatIso(latest.dateStr)
    // 전일 비교값은 "고시일 하루 전"부터 거슬러 올라가 가장 최근 영업일을 찾는다.
    // 이 조회는 비교값이 없어도(null) 본 조회 자체는 성공으로 취급한다.
    const previousLookup = await findLatestAvailable(new Date(Date.parse(referenceDate) - 24 * 60 * 60 * 1000), apiKey)
    const previousRows = previousLookup.kind === 'ok' ? previousLookup.rows : null

    const items: CollectedIndicator[] = []
    for (const target of TARGET_CURRENCIES) {
      const row = latest.rows.find((r) => r.cur_unit === target.curUnit)
      const value = parseRate(row?.deal_bas_r ?? null)
      if (value === null) continue

      const prevRow = previousRows?.find((r) => r.cur_unit === target.curUnit)
      const prevValue = parseRate(prevRow?.deal_bas_r ?? null)
      const change = prevValue !== null ? Number((value - prevValue).toFixed(2)) : null
      const changeRate = change !== null && prevValue ? Number(((change / prevValue) * 100).toFixed(2)) : null

      items.push({
        id: target.id,
        category: 'exchange',
        name: target.name,
        symbol: target.curUnit,
        value,
        unit: '원',
        change,
        changeRate,
        referenceDate,
        sourceId: 'eximbank-fx',
        sourceName: '한국수출입은행',
        sourceUrl: 'https://www.koreaexim.go.kr',
        marketStatus: 'closed',
      })
    }

    if (items.length === 0) {
      return { status: 'invalid_response', provider: PROVIDER, reason: '응답에 대상 통화(USD/JPY/EUR) 필드가 없습니다.' }
    }
    return { status: 'success', provider: PROVIDER, indicators: items }
  } catch (err) {
    console.warn('[eximbank-fx] 수집 실패:', err)
    return { status: 'failed', provider: PROVIDER, reason: err instanceof Error ? err.message : String(err) }
  }
}
