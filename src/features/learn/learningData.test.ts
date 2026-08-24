import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchConceptCards } from './learningData'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchConceptCards', () => {
  it('requests only a static same-origin-relative JSON path — no user data', async () => {
    const fetchSpy = vi.fn(async (..._args: unknown[]) => ({ ok: true, json: async () => [] }))
    vi.stubGlobal('fetch', fetchSpy)

    await fetchConceptCards()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toMatch(/^\/?data\/learning\/concepts\.json$/)
    expect(init).toBeUndefined()
  })

  it('sanitizes concept payloads, dropping only invalid cards instead of throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => [{ id: 'broken' }] })),
    )
    const result = await fetchConceptCards()
    expect(result.concepts).toHaveLength(0)
    expect(result.skippedCount).toBe(1)
  })

  it('returns an empty list (not throws) on network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      }),
    )
    expect((await fetchConceptCards()).concepts).toEqual([])
  })
})
