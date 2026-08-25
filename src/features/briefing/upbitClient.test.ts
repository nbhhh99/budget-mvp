import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchUpbitTicker } from './upbitClient'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchUpbitTicker', () => {
  it('requests the given markets and nothing else derived from app state', async () => {
    const fetchSpy = vi.fn(async (..._args: unknown[]) => ({ ok: true, json: async () => [] }))
    vi.stubGlobal('fetch', fetchSpy)

    await fetchUpbitTicker(['KRW-BTC', 'KRW-ETH'])

    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('markets=KRW-BTC%2CKRW-ETH')
    expect((init as RequestInit).signal).toBeDefined()
  })

  it('returns [] immediately for an empty market list without calling fetch', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    expect(await fetchUpbitTicker([])).toEqual([])
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('parses signed_change_price/rate when present', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          { market: 'KRW-BTC', trade_price: 100_000_000, signed_change_price: -1_000_000, signed_change_rate: -0.01 },
        ],
      })),
    )
    const result = await fetchUpbitTicker(['KRW-BTC'])
    expect(result).toEqual([{ market: 'KRW-BTC', value: 100_000_000, change: -1_000_000, changeRate: -1 }])
  })

  it('derives sign from the change field when signed_change_price/rate are absent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => [{ market: 'KRW-ETH', trade_price: 5_000_000, change: 'FALL', change_price: 50_000, change_rate: 0.01 }],
      })),
    )
    const [quote] = (await fetchUpbitTicker(['KRW-ETH']))!
    expect(quote.change).toBe(-50_000)
    expect(quote.changeRate).toBe(-1)
  })

  it('returns null on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })))
    expect(await fetchUpbitTicker(['KRW-BTC'])).toBeNull()
  })

  it('returns null when fetch throws (offline/network error)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    expect(await fetchUpbitTicker(['KRW-BTC'])).toBeNull()
  })

  it('drops rows with a non-numeric trade_price instead of throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => [{ market: 'KRW-BTC', trade_price: 'oops' }] })),
    )
    expect(await fetchUpbitTicker(['KRW-BTC'])).toEqual([])
  })
})
