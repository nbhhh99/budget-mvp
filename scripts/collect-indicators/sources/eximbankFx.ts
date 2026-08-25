import type { CollectedIndicator } from '../types'

// 한국수출입은행 환율정보 Open API. 인증키는 공공데이터포털 활용신청으로 발급받는다:
// https://www.data.go.kr/data/3068846/openapi.do (무료, 즉시~단기 승인)
// 실제 데이터 서버는 공공데이터포털 프록시가 아니라 한국수출입은행 자체 호스트다.
// 이 세션에서 실제 요청을 보내 응답 형식을 직접 확인했다(result=3은 "인증코드 오류"라는
// 문서화된 에러코드로, 엔드포인트가 살아있음을 확인해준다 — 추측이 아니다).
const EXIM_BASE = 'https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON'

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

async function fetchRatesForDate(dateStr: string, apiKey: string): Promise<ExchangeRateRow[] | null> {
  const url = new URL(EXIM_BASE)
  url.searchParams.set('authkey', apiKey)
  url.searchParams.set('searchdate', dateStr)
  url.searchParams.set('data', 'AP01') // AP01 = 환율

  const res = await fetch(url)
  if (!res.ok) throw new Error(`한국수출입은행 환율 API 요청 실패: ${res.status}`)
  const rows = (await res.json()) as ExchangeRateRow[]
  if (!Array.isArray(rows) || rows.length === 0) return null
  if (rows[0].result !== 1) return null // 휴장일·주말 등 해당일 고시가 없음
  return rows
}

// 영업일이 아닌 날(주말·공휴일)은 응답이 비어 있으므로, 최근 영업일을 찾을 때까지
// 최대 며칠 전으로 거슬러 올라간다.
async function findLatestAvailable(
  startDate: Date,
  apiKey: string,
  maxLookbackDays = 5,
): Promise<{ dateStr: string; rows: ExchangeRateRow[] } | null> {
  for (let i = 0; i < maxLookbackDays; i++) {
    const d = new Date(startDate.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = toKstDateString(d)
    const rows = await fetchRatesForDate(dateStr, apiKey)
    if (rows) return { dateStr, rows }
  }
  return null
}

export async function collectEximbankFx(): Promise<CollectedIndicator[] | null> {
  const apiKey = process.env.EXIMBANK_API_KEY
  if (!apiKey) {
    console.log('[eximbank-fx] EXIMBANK_API_KEY가 없어 건너뜁니다.')
    return null
  }

  try {
    const now = new Date()
    const latest = await findLatestAvailable(now, apiKey)
    if (!latest) {
      console.warn('[eximbank-fx] 최근 영업일 고시환율을 찾지 못했습니다.')
      return null
    }
    const referenceDate = formatIso(latest.dateStr)
    // 전일 비교값은 "고시일 하루 전"부터 거슬러 올라가 가장 최근 영업일을 찾는다.
    const previousLookup = await findLatestAvailable(new Date(Date.parse(referenceDate) - 24 * 60 * 60 * 1000), apiKey)

    const items: CollectedIndicator[] = []
    for (const target of TARGET_CURRENCIES) {
      const row = latest.rows.find((r) => r.cur_unit === target.curUnit)
      const value = parseRate(row?.deal_bas_r ?? null)
      if (value === null) continue

      const prevRow = previousLookup?.rows.find((r) => r.cur_unit === target.curUnit)
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
    return items.length > 0 ? items : null
  } catch (err) {
    console.warn('[eximbank-fx] 수집 실패, 건너뜁니다:', err)
    return null
  }
}

function formatIso(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
}
