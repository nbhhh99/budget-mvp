import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchBriefingIndex, fetchBriefingMonth } from './briefingData'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchBriefingIndex / fetchBriefingMonth', () => {
  it('requests only a static same-origin-relative JSON path — no user data in the URL or request body', async () => {
    const fetchSpy = vi.fn(async (..._args: unknown[]) => ({
      ok: true,
      json: async () => ({ entries: [] }),
    }))
    vi.stubGlobal('fetch', fetchSpy)

    await fetchBriefingIndex()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toMatch(/^\/?data\/briefings\/index\.json$/)
    expect(init).toBeUndefined() // no method/body/headers carrying any payload
  })

  it('requests exactly the given yearMonth and nothing else derived from app state', async () => {
    const fetchSpy = vi.fn(async (..._args: unknown[]) => ({
      ok: true,
      json: async () => ({
        yearMonth: '2026-08',
        generatedAt: '2026-08-23T00:00:00.000Z',
        status: 'reviewed',
        summary: 's',
        items: [],
      }),
    }))
    vi.stubGlobal('fetch', fetchSpy)

    await fetchBriefingMonth('2026-08')

    const [url] = fetchSpy.mock.calls[0]
    expect(String(url)).toMatch(/^\/?data\/briefings\/2026-08\.json$/)
  })

  it('returns null when the network request throws (offline)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    expect(await fetchBriefingIndex()).toBeNull()
    const result = await fetchBriefingMonth('2026-08')
    expect(result.briefing).toBeNull()
    expect(result.skippedItemCount).toBe(0)
  })

  it('returns null when the response is not ok (e.g. 404 — no briefing for that month)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })))
    const result = await fetchBriefingMonth('2099-01')
    expect(result.briefing).toBeNull()
  })

  it('returns null index when the JSON has no entries array', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({}) })))
    expect(await fetchBriefingIndex()).toBeNull()
  })

  it('sanitizes the month payload and reports skipped items instead of throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          yearMonth: '2026-08',
          generatedAt: '2026-08-23T00:00:00.000Z',
          status: 'reviewed',
          summary: 's',
          items: [{ id: 'broken' }], // missing everything else
        }),
      })),
    )
    const result = await fetchBriefingMonth('2026-08')
    expect(result.briefing?.items).toHaveLength(0)
    expect(result.skippedItemCount).toBe(1)
  })
})
