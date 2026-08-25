import type { CryptoIndicatorCache } from '../types/models'

export const CRYPTO_CACHE_TTL_MS = 15 * 60 * 1000

// 코인은 업비트 공개 API를 브라우저가 직접 호출하는 유일한 지표라, 15분 TTL로
// 캐시하고 화면 진입 시 stale-while-revalidate 방식으로 갱신한다(§3/§4).
export function shouldRefetchCrypto(cached: CryptoIndicatorCache | undefined, now: Date, ttlMs = CRYPTO_CACHE_TTL_MS): boolean {
  if (!cached) return true
  const fetchedAt = Date.parse(cached.fetchedAt)
  if (Number.isNaN(fetchedAt)) return true
  return now.getTime() - fetchedAt > ttlMs
}

export function isCryptoCacheStale(cached: CryptoIndicatorCache | undefined, now: Date, ttlMs = CRYPTO_CACHE_TTL_MS): boolean {
  return shouldRefetchCrypto(cached, now, ttlMs)
}
