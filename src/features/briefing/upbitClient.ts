// 업비트(Upbit) 공개 시세 API. 인증키가 필요 없는 공개 REST 엔드포인트이며, 이
// 세션에서 curl로 직접 응답 헤더를 확인해 `Access-Control-Allow-Origin: *`가
// 설정돼 있음을 검증했다(브라우저에서 다른 오리진으로도 직접 호출 가능) — 그래서
// 이 지표만 GitHub Actions 없이 프론트엔드가 바로 호출한다(§4).
const UPBIT_TICKER_URL = 'https://api.upbit.com/v1/ticker'

interface UpbitTickerRow {
  market: string
  trade_price: number
  signed_change_price?: number
  signed_change_rate?: number
  change?: 'RISE' | 'EVEN' | 'FALL'
  change_price?: number
  change_rate?: number
  trade_timestamp?: number
}

export interface UpbitQuote {
  market: string
  value: number
  change: number | null
  changeRate: number | null // %
}

const FETCH_TIMEOUT_MS = 8000

// 실패해도 예외를 던지지 않고 null을 반환한다 — 코인 카드 하나가 실패해도
// 나머지 화면에 영향을 주지 않기 위해서다(§4/§7 "부분 오류 시 전체 화면을 오류
// 화면으로 바꾸지 않기").
export async function fetchUpbitTicker(markets: string[]): Promise<UpbitQuote[] | null> {
  if (markets.length === 0) return []
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const url = new URL(UPBIT_TICKER_URL)
    url.searchParams.set('markets', markets.join(','))
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null
    const rows = (await res.json()) as UpbitTickerRow[]
    if (!Array.isArray(rows)) return null

    return rows
      .filter((row) => typeof row.trade_price === 'number')
      .map((row) => {
        const signedChange = typeof row.signed_change_price === 'number' ? row.signed_change_price : deriveSignedValue(row.change, row.change_price)
        const signedChangeRate = typeof row.signed_change_rate === 'number' ? row.signed_change_rate : deriveSignedValue(row.change, row.change_rate)
        return {
          market: row.market,
          value: row.trade_price,
          change: signedChange !== null ? signedChange : null,
          changeRate: signedChangeRate !== null ? Number((signedChangeRate * 100).toFixed(2)) : null,
        }
      })
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function deriveSignedValue(direction: UpbitTickerRow['change'] | undefined, magnitude: number | undefined): number | null {
  if (typeof magnitude !== 'number') return null
  if (direction === 'FALL') return -magnitude
  return magnitude
}
