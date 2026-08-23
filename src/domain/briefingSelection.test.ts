import { describe, expect, it } from 'vitest'
import {
  computeLatestReviewedYearMonth,
  getPreviousReviewedYearMonth,
  listReviewedYearMonths,
  resolveBriefingView,
} from './briefingSelection'
import type { BriefingIndexEntry, FinancialBriefing } from '../types/models'

const ENTRIES: BriefingIndexEntry[] = [
  { yearMonth: '2026-06', status: 'reviewed', updatedAt: '2026-06-01T00:00:00.000Z' },
  { yearMonth: '2026-07', status: 'reviewed', updatedAt: '2026-07-01T00:00:00.000Z' },
  { yearMonth: '2026-08', status: 'draft', updatedAt: '2026-08-01T00:00:00.000Z' },
]

function briefing(yearMonth: string): FinancialBriefing {
  return {
    yearMonth,
    generatedAt: '2026-08-01T00:00:00.000Z',
    status: 'reviewed',
    summary: 's',
    items: [],
  }
}

describe('listReviewedYearMonths', () => {
  it('only includes reviewed months, newest first', () => {
    expect(listReviewedYearMonths(ENTRIES)).toEqual(['2026-07', '2026-06'])
  })
})

describe('computeLatestReviewedYearMonth', () => {
  it('returns the newest reviewed month, ignoring drafts', () => {
    expect(computeLatestReviewedYearMonth(ENTRIES)).toBe('2026-07')
  })

  it('returns null when nothing is reviewed', () => {
    expect(computeLatestReviewedYearMonth([{ yearMonth: '2026-08', status: 'draft', updatedAt: '' }])).toBeNull()
  })
})

describe('getPreviousReviewedYearMonth', () => {
  it('returns the reviewed month right before the given one', () => {
    expect(getPreviousReviewedYearMonth(ENTRIES, '2026-07')).toBe('2026-06')
  })

  it('returns null when the given month is the oldest reviewed month', () => {
    expect(getPreviousReviewedYearMonth(ENTRIES, '2026-06')).toBeNull()
  })

  it('returns null when the given month is not in the reviewed list at all (e.g. a draft)', () => {
    expect(getPreviousReviewedYearMonth(ENTRIES, '2026-08')).toBeNull()
  })
})

describe('resolveBriefingView', () => {
  it('returns loading is left to the caller — ready when fetched data is present', () => {
    const state = resolveBriefingView({ online: true, fetched: briefing('2026-08'), cached: null })
    expect(state.kind).toBe('ready')
  })

  it('falls back to cached data when fetch failed but a cache exists (offline)', () => {
    const state = resolveBriefingView({ online: false, fetched: null, cached: briefing('2026-07') })
    expect(state.kind).toBe('offline_cached')
    if (state.kind === 'offline_cached') expect(state.briefing.yearMonth).toBe('2026-07')
  })

  it('treats a successful fetch as offline_cached (not ready) when offline — it must have come from a cache', () => {
    const state = resolveBriefingView({ online: false, fetched: briefing('2026-08'), cached: null })
    expect(state.kind).toBe('offline_cached')
    if (state.kind === 'offline_cached') expect(state.briefing.yearMonth).toBe('2026-08')
  })

  it('falls back to cached data even while online if the fetch came back empty', () => {
    const state = resolveBriefingView({ online: true, fetched: null, cached: briefing('2026-07') })
    expect(state.kind).toBe('offline_cached')
  })

  it('reports no_data with online=false when offline and there is no cache', () => {
    const state = resolveBriefingView({ online: false, fetched: null, cached: null })
    expect(state).toEqual({ kind: 'no_data', online: false })
  })

  it('reports no_data with online=true when online but nothing is available at all', () => {
    const state = resolveBriefingView({ online: true, fetched: null, cached: null })
    expect(state).toEqual({ kind: 'no_data', online: true })
  })

  it('carries the skipped item count through on a partial load', () => {
    const state = resolveBriefingView({
      online: true,
      fetched: briefing('2026-08'),
      cached: null,
      skippedItemCount: 2,
    })
    expect(state.kind).toBe('ready')
    if (state.kind === 'ready') expect(state.skippedItemCount).toBe(2)
  })
})
