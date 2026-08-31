import type { MarketIndicator } from '../../types/models'
import { computeFreshness, shouldRefetchCrypto } from '../../domain'
import { fetchUpbitTicker } from './upbitClient'
import { indicatorCryptoCacheRepo } from '../../db'

export const CRYPTO_MARKETS: { market: string; id: string; name: string }[] = [
  { market: 'KRW-BTC', id: 'crypto-btc', name: '비트코인(BTC/KRW)' },
  { market: 'KRW-ETH', id: 'crypto-eth', name: '이더리움(ETH/KRW)' },
]

// IndicatorsScreen(목록)과 IndicatorDetailScreen(상세) 둘 다 코인 카드를 그려야
// 해서 공통 함수로 뺐다. 캐시가 15분 이내면 재요청하지 않고(stale-while-revalidate,
// §3/§4), 오프라인이면 마지막 캐시값 + '오프라인 저장값' 취급이 되도록 freshness를
// 계산해서 돌려준다.
export async function loadCryptoIndicators(): Promise<MarketIndicator[]> {
  const now = new Date()
  const results: MarketIndicator[] = []

  const marketsToFetch: string[] = []
  const cachedByMarket = new Map<string, Awaited<ReturnType<typeof indicatorCryptoCacheRepo.getCached>>>()
  for (const { market } of CRYPTO_MARKETS) {
    const cached = await indicatorCryptoCacheRepo.getCached(market)
    cachedByMarket.set(market, cached)
    if (shouldRefetchCrypto(cached, now)) marketsToFetch.push(market)
  }

  let freshQuotes: Awaited<ReturnType<typeof fetchUpbitTicker>> = null
  if (marketsToFetch.length > 0) {
    freshQuotes = await fetchUpbitTicker(marketsToFetch)
    if (freshQuotes) {
      for (const quote of freshQuotes) {
        await indicatorCryptoCacheRepo.setCached(quote.market, {
          value: quote.value,
          change: quote.change,
          changeRate: quote.changeRate,
        })
      }
    }
  }

  for (const { market, id, name } of CRYPTO_MARKETS) {
    const fresh = freshQuotes?.find((q) => q.market === market)
    const cached = fresh ? undefined : cachedByMarket.get(market)
    const source = fresh
      ? { value: fresh.value, change: fresh.change, changeRate: fresh.changeRate, fetchedAt: now.toISOString() }
      : cached

    if (!source) {
      results.push({
        id,
        category: 'crypto',
        name,
        value: null,
        unit: '원',
        change: null,
        changeRate: null,
        referenceDate: now.toISOString().slice(0, 10),
        updatedAt: now.toISOString(),
        timezone: 'Asia/Seoul',
        sourceId: 'upbit',
        sourceName: '업비트',
        sourceUrl: 'https://upbit.com',
        marketStatus: 'unknown',
        freshness: 'unavailable',
      })
      continue
    }

    results.push({
      id,
      category: 'crypto',
      name,
      value: source.value,
      unit: '원',
      change: source.change,
      changeRate: source.changeRate,
      referenceDate: now.toISOString().slice(0, 10),
      updatedAt: source.fetchedAt,
      timezone: 'Asia/Seoul',
      sourceId: 'upbit',
      sourceName: '업비트',
      sourceUrl: 'https://upbit.com',
      marketStatus: 'unknown', // 24시간 거래되는 시장이라 개장/휴장 개념이 없다(§2)
      freshness: computeFreshness(
        { value: source.value, updatedAt: source.fetchedAt, referenceDate: now.toISOString().slice(0, 10), category: 'crypto' },
        now,
      ),
    })
  }
  return results
}
