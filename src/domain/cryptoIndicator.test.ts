import { describe, expect, it } from 'vitest'
import { CRYPTO_CACHE_TTL_MS, shouldRefetchCrypto } from './cryptoIndicator'
import type { CryptoIndicatorCache } from '../types/models'

function cache(fetchedAt: string): CryptoIndicatorCache {
  return { market: 'KRW-BTC', value: 100_000_000, change: null, changeRate: null, fetchedAt }
}

describe('shouldRefetchCrypto', () => {
  const now = new Date('2026-08-25T12:00:00.000Z')

  it('is true when there is no cached value at all', () => {
    expect(shouldRefetchCrypto(undefined, now)).toBe(true)
  })

  it('is false just under the 15-minute TTL', () => {
    const fetchedAt = new Date(now.getTime() - (CRYPTO_CACHE_TTL_MS - 1000)).toISOString()
    expect(shouldRefetchCrypto(cache(fetchedAt), now)).toBe(false)
  })

  it('is true just past the 15-minute TTL', () => {
    const fetchedAt = new Date(now.getTime() - (CRYPTO_CACHE_TTL_MS + 1000)).toISOString()
    expect(shouldRefetchCrypto(cache(fetchedAt), now)).toBe(true)
  })

  it('is true for a corrupted fetchedAt value', () => {
    expect(shouldRefetchCrypto(cache('not-a-date'), now)).toBe(true)
  })
})
