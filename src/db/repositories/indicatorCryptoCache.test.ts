import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../schema'
import { clearAll, getCached, setCached } from './indicatorCryptoCache'

describe('indicatorCryptoCache repository', () => {
  beforeEach(async () => {
    await db.indicatorCryptoCache.clear()
  })

  it('returns undefined for a market that has never been cached', async () => {
    expect(await getCached('KRW-BTC')).toBeUndefined()
  })

  it('setCached stores the value with a fresh fetchedAt timestamp', async () => {
    await setCached('KRW-BTC', { value: 100_000_000, change: 1_000_000, changeRate: 1.02 })
    const cached = await getCached('KRW-BTC')
    expect(cached?.market).toBe('KRW-BTC')
    expect(cached?.value).toBe(100_000_000)
    expect(cached?.change).toBe(1_000_000)
    expect(cached?.changeRate).toBe(1.02)
    expect(Number.isNaN(Date.parse(cached!.fetchedAt))).toBe(false)
  })

  it('setCached overwrites the previous value for the same market (upsert)', async () => {
    await setCached('KRW-BTC', { value: 1, change: null, changeRate: null })
    await setCached('KRW-BTC', { value: 2, change: null, changeRate: null })
    expect((await getCached('KRW-BTC'))?.value).toBe(2)
    expect(await db.indicatorCryptoCache.count()).toBe(1)
  })

  it('clearAll removes every cached market', async () => {
    await setCached('KRW-BTC', { value: 1, change: null, changeRate: null })
    await setCached('KRW-ETH', { value: 2, change: null, changeRate: null })
    await clearAll()
    expect(await db.indicatorCryptoCache.count()).toBe(0)
  })
})
