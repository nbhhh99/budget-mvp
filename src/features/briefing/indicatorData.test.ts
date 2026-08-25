import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchIndicatorHistory, fetchIndicatorSnapshot } from './indicatorData'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchIndicatorSnapshot / fetchIndicatorHistory', () => {
  it('requests only a static same-origin-relative JSON path — no user data in the URL or request body', async () => {
    const fetchSpy = vi.fn(async (..._args: unknown[]) => ({
      ok: true,
      json: async () => ({ generatedAt: '2026-08-25T00:00:00.000Z', indicators: [] }),
    }))
    vi.stubGlobal('fetch', fetchSpy)

    await fetchIndicatorSnapshot()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toMatch(/^\/?data\/indicators\/latest\.json$/)
    expect(init).toBeUndefined()
  })

  it('requests exactly the given history id and nothing else', async () => {
    const fetchSpy = vi.fn(async (..._args: unknown[]) => ({ ok: true, json: async () => [] }))
    vi.stubGlobal('fetch', fetchSpy)

    await fetchIndicatorHistory('fx-usd-krw')

    const [url] = fetchSpy.mock.calls[0]
    expect(String(url)).toMatch(/^\/?data\/indicators\/history\/fx-usd-krw\.json$/)
  })

  it('returns null snapshot when the network request throws (offline)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    const result = await fetchIndicatorSnapshot()
    expect(result.snapshot).toBeNull()
    expect(result.skippedCount).toBe(0)
  })

  it('returns an empty history array on a 404 (no history yet for a brand-new indicator)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })))
    expect(await fetchIndicatorHistory('brand-new')).toEqual([])
  })

  it('sanitizes the snapshot payload and reports skipped indicators instead of throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          generatedAt: '2026-08-25T00:00:00.000Z',
          indicators: [{ id: 'broken' }], // missing everything else
        }),
      })),
    )
    const result = await fetchIndicatorSnapshot()
    expect(result.snapshot?.indicators).toHaveLength(0)
    expect(result.skippedCount).toBe(1)
  })
})
