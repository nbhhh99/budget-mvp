import { describe, expect, it } from 'vitest'
import { computeFreshness, formatChangeText, formatKstDateTime, getDirection } from './indicatorFormat'

describe('getDirection', () => {
  it('classifies positive/negative/zero/null/undefined change', () => {
    expect(getDirection(5)).toBe('up')
    expect(getDirection(-5)).toBe('down')
    expect(getDirection(0)).toBe('flat')
    expect(getDirection(null)).toBe('flat')
    expect(getDirection(undefined)).toBe('flat')
  })
})

describe('formatChangeText', () => {
  it('includes both the amount and rate with a direction word', () => {
    const text = formatChangeText(5.2, 0.42)
    expect(text).toContain('5.2')
    expect(text).toContain('+0.42%')
    expect(text).toContain('상승')
  })

  it('uses 하락 for negative change', () => {
    expect(formatChangeText(-3, -1.1)).toContain('하락')
  })

  it('handles missing change/changeRate gracefully', () => {
    expect(formatChangeText(null, null)).toBe('전일 대비 정보 없음')
  })
})

describe('computeFreshness', () => {
  const now = new Date('2026-08-25T12:00:00.000Z')

  it('is unavailable when value is null', () => {
    expect(computeFreshness({ value: null, updatedAt: now.toISOString(), category: 'exchange' }, now)).toBe('unavailable')
  })

  it('is fresh within the crypto 15-minute window and stale just past it', () => {
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString()
    const twentyMinAgo = new Date(now.getTime() - 20 * 60 * 1000).toISOString()
    expect(computeFreshness({ value: 1, updatedAt: tenMinAgo, category: 'crypto' }, now)).toBe('fresh')
    expect(computeFreshness({ value: 1, updatedAt: twentyMinAgo, category: 'crypto' }, now)).toBe('stale')
  })

  it('is fresh within the daily-category window (well under 36h)', () => {
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()
    expect(computeFreshness({ value: 1, updatedAt: twelveHoursAgo, category: 'exchange' }, now)).toBe('fresh')
  })

  it('is stale for an exchange indicator updated 3 days ago', () => {
    const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString()
    expect(computeFreshness({ value: 1, updatedAt: threeDaysAgo, category: 'exchange' }, now)).toBe('stale')
  })
})

describe('formatKstDateTime', () => {
  it('formats an ISO UTC timestamp as KST (UTC+9)', () => {
    // 2026-08-25T00:00:00Z -> 2026-08-25 09:00 KST
    expect(formatKstDateTime('2026-08-25T00:00:00.000Z')).toBe('2026.08.25 09:00')
  })

  it('returns a fallback string for an invalid date', () => {
    expect(formatKstDateTime('not-a-date')).toBe('알 수 없음')
  })
})
