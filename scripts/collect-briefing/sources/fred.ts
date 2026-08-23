import type { BriefingItem } from '../../../src/types/models'

// FRED(세인트루이스 연은) API. 무료 키 발급: https://fred.stlouisfed.org/docs/api/api_key.html
// 문서: https://fred.stlouisfed.org/docs/api/fred/series_observations.html
const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations'

interface FredObservation {
  date: string
  value: string
}

async function fetchLatestObservations(
  seriesId: string,
  apiKey: string,
  limit = 2,
): Promise<FredObservation[]> {
  const url = new URL(FRED_BASE)
  url.searchParams.set('series_id', seriesId)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('file_type', 'json')
  url.searchParams.set('sort_order', 'desc')
  url.searchParams.set('limit', String(limit))

  const res = await fetch(url)
  if (!res.ok) throw new Error(`FRED ${seriesId} 요청 실패: ${res.status}`)
  const json = (await res.json()) as { observations?: FredObservation[] }
  return (json.observations ?? []).filter((o) => o.value !== '.')
}

// 미국 연방기금 실효금리(FEDFUNDS, 월간). 정책 목표범위 자체(상하단)가 필요하면
// DFEDTARU/DFEDTARL 시리즈를 별도로 조회해야 한다 — 여기서는 우선 실효금리만 다룬다.
export async function collectFredItems(yearMonth: string): Promise<BriefingItem[] | null> {
  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) {
    console.log('[fred] FRED_API_KEY가 없어 건너뜁니다.')
    return null
  }

  try {
    const observations = await fetchLatestObservations('FEDFUNDS', apiKey)
    if (observations.length === 0) return null
    const latest = observations[0]
    const previous = observations[1]

    const item: BriefingItem = {
      id: `us-fed-funds-effective-${yearMonth}`,
      region: 'global',
      category: 'interest_rate',
      title: '미국 연방기금 실효금리',
      factSummary: `FRED 기준 미국 연방기금 실효금리는 ${latest.date} 기준 ${latest.value}%입니다.`,
      value: Number(latest.value),
      unit: '%',
      previousValue: previous ? Number(previous.value) : undefined,
      comparisonBasis: 'month_over_month',
      referenceDate: latest.date,
      significance:
        '미국 기준금리는 달러 가치와 환율, 해외 자산 가치에 영향을 줄 수 있는 여러 요인 중 하나입니다.',
      assetImplications: [
        {
          assetTypes: ['foreign_stock', 'foreign_currency'],
          explanation: '환율과 해외자산 가치에 영향을 줄 수 있는 요인 중 하나입니다.',
        },
      ],
      checklist: ['해외주식·외화 자산이 있다면 환율 흐름을 함께 확인해볼 수 있습니다.'],
      sources: [
        {
          organization: 'Federal Reserve Bank of St. Louis (FRED)',
          title: 'Federal Funds Effective Rate (FEDFUNDS)',
          url: 'https://fred.stlouisfed.org/series/FEDFUNDS',
          publishedAt: latest.date,
          accessedAt: new Date().toISOString().slice(0, 10),
        },
      ],
      tags: ['fed_funds_rate', 'fred'],
    }
    return [item]
  } catch (err) {
    console.warn('[fred] 수집 실패, 건너뜁니다:', err)
    return null
  }
}
