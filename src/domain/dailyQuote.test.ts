import { describe, expect, it } from 'vitest'
import { getDailyQuote, getDailyQuoteIndex } from './dailyQuote'

const QUOTES = ['a', 'b', 'c', 'd', 'e']

describe('getDailyQuoteIndex', () => {
  it('returns the same index for the same date every time (deterministic)', () => {
    const a = getDailyQuoteIndex('2026-08-24', QUOTES.length)
    const b = getDailyQuoteIndex('2026-08-24', QUOTES.length)
    expect(a).toBe(b)
  })

  it('returns a valid in-range index for different dates', () => {
    const dates = ['2026-01-01', '2026-08-24', '2030-12-31', '1999-01-01']
    for (const d of dates) {
      const idx = getDailyQuoteIndex(d, QUOTES.length)
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(QUOTES.length)
    }
  })

  it('advances by one index for consecutive days (until it wraps around)', () => {
    const day1 = getDailyQuoteIndex('2026-08-24', QUOTES.length)
    const day2 = getDailyQuoteIndex('2026-08-25', QUOTES.length)
    expect(day2).toBe((day1 + 1) % QUOTES.length)
  })

  it('returns 0 when quoteCount is zero or negative', () => {
    expect(getDailyQuoteIndex('2026-08-24', 0)).toBe(0)
    expect(getDailyQuoteIndex('2026-08-24', -3)).toBe(0)
  })

  it('returns 0 (not NaN) for an unparsable date string', () => {
    expect(getDailyQuoteIndex('not-a-date', QUOTES.length)).toBe(0)
  })
})

describe('getDailyQuote', () => {
  it('returns the same quote for the same date on repeated calls', () => {
    expect(getDailyQuote(QUOTES, '2026-08-24')).toBe(getDailyQuote(QUOTES, '2026-08-24'))
  })

  it('returns a quote that is actually in the provided list', () => {
    const quote = getDailyQuote(QUOTES, '2026-08-24')
    expect(quote).not.toBeNull()
    expect(QUOTES).toContain(quote)
  })

  it('returns null for an empty quote list instead of throwing', () => {
    expect(getDailyQuote([], '2026-08-24')).toBeNull()
  })
})
