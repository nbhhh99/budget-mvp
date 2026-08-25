import type { CollectedIndicator, ProviderResult } from '../types'

// 미국 에너지정보청(EIA) Open Data API v2. 무료 키 발급: https://www.eia.gov/opendata/register.php
// 미국 연방 통계기관의 공개 데이터라 재배포 제한이 없다(공공영역).
//
// 이 세션에서 EIA 자체 공식 페이지(https://www.eia.gov/dnav/pet/hist/rwtcd.htm,
// https://www.eia.gov/dnav/pet/hist/rbrted.htm)와, EIA의 API Dashboard가 실제로
// 만들어낸 조회 URL(검색으로 확인한
// https://www.eia.gov/opendata/browser/petroleum/pri/spt?frequency=daily&data=value;&facets=series;&series=RBRTE;...)
// 로 다음을 확인했다(series id를 추측한 것이 아니라 EIA 자신의 페이지·URL에서
// 그대로 읽은 값이다):
//   - route: petroleum/pri/spt (Petroleum > Prices > Spot Prices)
//   - Cushing, OK WTI 현물가격(달러/배럴) series id: RWTC
//   - Europe Brent 현물가격(달러/배럴) series id: RBRTE
//   - frequency: daily
// API v2 base URL(https://api.eia.gov/v2/)과 "/v2/{route}/data 뒤에 facets·data
// 컬럼·기간·정렬을 쿼리 파라미터로 붙인다"는 요청 형식은 EIA 공식 API v2 문서
// (eia.gov/opendata/documentation.php)에서 확인했다. 다만 유효한 키로 실제 응답을
// 받아 필드명을 직접 검증하지는 못했다(이 세션에는 등록된 EIA_API_KEY가 없다) —
// 아래 파싱은 EIA가 문서화한 표준 v2 응답 스키마(response.data[].{period,value,
// series,units})를 기준으로 작성했고, 필드가 다르면 값을 지어내지 않고
// invalid_response로 보고한다.
//
// 두바이유는 장외 벤치마크(통상 Platts 등 유료 라이선스로 고시)라 공식 무료 API를
// 찾지 못해 이 프로젝트에서는 지원하지 않는다(§6 "비공식 웹 크롤링으로 우회하지 않음").
const EIA_BASE = 'https://api.eia.gov/v2/petroleum/pri/spt/data/'
const PROVIDER = 'eia'

const SERIES: { seriesId: string; id: string; name: string }[] = [
  { seriesId: 'RWTC', id: 'oil-wti', name: 'WTI' },
  { seriesId: 'RBRTE', id: 'oil-brent', name: 'Brent' },
]

interface EiaRow {
  period: string // 'YYYY-MM-DD'
  series?: string
  value: number | string | null
  units?: string
}

interface EiaResponse {
  response?: {
    data?: EiaRow[]
  }
  error?: string
}

function toNumber(raw: number | string | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === '.' || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) ? n : null
}

// EIA는 데이터가 없는 날을 값 '.'으로 표시하거나 아예 행을 생략한다(휴장일 등).
// 최신 값 하나와, 등락률 계산용 "그 직전의 유효한 값" 하나를 얻을 때까지
// period 내림차순으로 최근 몇 개를 받아 앞에서부터 훑는다.
async function fetchLatestTwo(
  seriesId: string,
  apiKey: string,
): Promise<{ kind: 'ok'; latest: EiaRow; previous: EiaRow | null } | { kind: 'empty' } | { kind: 'http-error'; status: number }> {
  const url = new URL(EIA_BASE)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('frequency', 'daily')
  url.searchParams.append('data[]', 'value')
  url.searchParams.append('facets[series][]', seriesId)
  url.searchParams.append('sort[0][column]', 'period')
  url.searchParams.append('sort[0][direction]', 'desc')
  url.searchParams.set('length', '10') // 결측치를 건너뛰어도 유효값 2개를 찾을 수 있도록 넉넉히 받는다

  const res = await fetch(url)
  if (res.status === 401 || res.status === 403) return { kind: 'http-error', status: res.status }
  if (!res.ok) return { kind: 'http-error', status: res.status }

  const json = (await res.json()) as EiaResponse
  const rows = (json.response?.data ?? []).filter((r) => toNumber(r.value) !== null)
  if (rows.length === 0) return { kind: 'empty' }
  return { kind: 'ok', latest: rows[0], previous: rows[1] ?? null }
}

export async function collectEiaOil(): Promise<ProviderResult> {
  const apiKey = process.env.EIA_API_KEY
  if (!apiKey) {
    console.log('[eia-oil] EIA_API_KEY가 없어 건너뜁니다.')
    return { status: 'missing_key', provider: PROVIDER }
  }

  const items: CollectedIndicator[] = []
  for (const target of SERIES) {
    try {
      const result = await fetchLatestTwo(target.seriesId, apiKey)
      if (result.kind === 'http-error') {
        if (result.status === 401 || result.status === 403) {
          console.warn(`[eia-oil] ${target.seriesId} 인증 실패(HTTP ${result.status}) — EIA_API_KEY 값을 확인해야 합니다.`)
          return { status: 'unauthorized', provider: PROVIDER, code: `HTTP ${result.status}` }
        }
        console.warn(`[eia-oil] ${target.seriesId} 요청 실패(HTTP ${result.status}).`)
        return { status: 'failed', provider: PROVIDER, reason: `HTTP ${result.status}`, httpStatus: result.status }
      }
      if (result.kind === 'empty') {
        console.warn(`[eia-oil] ${target.seriesId} 최근 구간에 유효한 값이 없습니다(발표 지연 가능).`)
        continue
      }

      const value = toNumber(result.latest.value)
      if (value === null) continue
      const prevValue = toNumber(result.previous?.value)
      const change = prevValue !== null ? Number((value - prevValue).toFixed(2)) : null
      const changeRate = change !== null && prevValue ? Number(((change / prevValue) * 100).toFixed(2)) : null

      items.push({
        id: target.id,
        category: 'oil',
        name: target.name,
        symbol: target.seriesId,
        value,
        unit: '달러/배럴',
        change,
        changeRate,
        referenceDate: result.latest.period,
        sourceId: 'eia',
        sourceName: 'U.S. Energy Information Administration',
        sourceUrl: 'https://www.eia.gov/opendata',
        marketStatus: 'closed',
      })
    } catch (err) {
      console.warn(`[eia-oil] ${target.seriesId} 수집 실패:`, err)
      return { status: 'failed', provider: PROVIDER, reason: err instanceof Error ? err.message : String(err) }
    }
  }

  if (items.length === 0) {
    return { status: 'not_released', provider: PROVIDER }
  }
  return { status: 'success', provider: PROVIDER, indicators: items }
}
