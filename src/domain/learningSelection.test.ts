import { describe, expect, it } from 'vitest'
import { resolveLearningContentView } from './learningSelection'

describe('resolveLearningContentView', () => {
  it('returns ready when fetched succeeds while online', () => {
    const state = resolveLearningContentView({ online: true, fetched: { a: 1 }, cached: null })
    expect(state.kind).toBe('ready')
  })

  it('treats a successful fetch as offline_cached when offline', () => {
    const state = resolveLearningContentView({ online: false, fetched: { a: 1 }, cached: null })
    expect(state.kind).toBe('offline_cached')
  })

  it('falls back to cached content when fetch failed', () => {
    const state = resolveLearningContentView({ online: false, fetched: null, cached: { a: 2 } })
    expect(state.kind).toBe('offline_cached')
    if (state.kind === 'offline_cached') expect(state.content).toEqual({ a: 2 })
  })

  it('reports no_data with the online flag when nothing is available', () => {
    expect(resolveLearningContentView({ online: true, fetched: null, cached: null })).toEqual({
      kind: 'no_data',
      online: true,
    })
    expect(resolveLearningContentView({ online: false, fetched: null, cached: null })).toEqual({
      kind: 'no_data',
      online: false,
    })
  })
})
