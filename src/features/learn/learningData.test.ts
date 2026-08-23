import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchConceptCards, fetchMonthlyLesson, fetchMonthlyLessonIndex } from './learningData'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchConceptCards / fetchMonthlyLesson*', () => {
  it('requests only a static same-origin-relative JSON path for concepts — no user data', async () => {
    const fetchSpy = vi.fn(async (..._args: unknown[]) => ({ ok: true, json: async () => [] }))
    vi.stubGlobal('fetch', fetchSpy)

    await fetchConceptCards()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toMatch(/^\/?data\/learning\/concepts\.json$/)
    expect(init).toBeUndefined()
  })

  it('requests exactly the given yearMonth for a monthly lesson and nothing else', async () => {
    const fetchSpy = vi.fn(async (..._args: unknown[]) => ({ ok: true, json: async () => null }))
    vi.stubGlobal('fetch', fetchSpy)

    await fetchMonthlyLesson('2026-08')

    const [url] = fetchSpy.mock.calls[0]
    expect(String(url)).toMatch(/^\/?data\/learning\/monthly\/2026-08\.json$/)
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

  it('returns empty/null (not throws) on network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      }),
    )
    expect((await fetchConceptCards()).concepts).toEqual([])
    expect(await fetchMonthlyLessonIndex()).toBeNull()
    expect(await fetchMonthlyLesson('2026-08')).toBeNull()
  })

  it('returns null index when the JSON has no entries array', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({}) })))
    expect(await fetchMonthlyLessonIndex()).toBeNull()
  })
})
