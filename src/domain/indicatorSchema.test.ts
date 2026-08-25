import { describe, expect, it } from 'vitest'
import {
  sanitizeIndicatorHistory,
  sanitizeIndicatorSnapshot,
  validateIndicatorSnapshot,
} from './indicatorSchema'
import type { IndicatorSnapshot, MarketIndicator } from '../types/models'

function indicator(overrides: Partial<MarketIndicator> = {}): MarketIndicator {
  return {
    id: 'fx-usd-krw',
    category: 'exchange',
    name: '원·달러 환율',
    value: 1350.5,
    unit: '원',
    change: 5.2,
    changeRate: 0.39,
    referenceDate: '2026-08-25',
    updatedAt: '2026-08-25T07:30:00.000Z',
    timezone: 'Asia/Seoul',
    sourceId: 'eximbank-fx',
    sourceName: '한국수출입은행',
    sourceUrl: 'https://www.koreaexim.go.kr',
    marketStatus: 'closed',
    freshness: 'fresh',
    ...overrides,
  }
}

function snapshot(indicators: MarketIndicator[] = [indicator()]): IndicatorSnapshot {
  return { generatedAt: '2026-08-25T07:30:00.000Z', indicators }
}

describe('validateIndicatorSnapshot', () => {
  it('accepts a well-formed snapshot', () => {
    const result = validateIndicatorSnapshot(snapshot())
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('rejects non-object input', () => {
    expect(validateIndicatorSnapshot(null).valid).toBe(false)
    expect(validateIndicatorSnapshot('oops').valid).toBe(false)
  })

  it('rejects a missing generatedAt', () => {
    const file = { ...snapshot(), generatedAt: 'not a date' }
    expect(validateIndicatorSnapshot(file).valid).toBe(false)
  })

  it('rejects an invalid category', () => {
    const file = snapshot([indicator({ category: 'nope' as MarketIndicator['category'] })])
    const result = validateIndicatorSnapshot(file)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('category'))).toBe(true)
  })

  it('rejects duplicate ids', () => {
    const file = snapshot([indicator({ id: 'dup' }), indicator({ id: 'dup' })])
    const result = validateIndicatorSnapshot(file)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('중복'))).toBe(true)
  })

  it('rejects an indicator with a null value but a non-null change', () => {
    const file = snapshot([indicator({ value: null, change: 1, changeRate: null })])
    const result = validateIndicatorSnapshot(file)
    expect(result.valid).toBe(false)
  })

  it('accepts a pending indicator with null value and no change', () => {
    const file = snapshot([
      indicator({ value: null, change: null, changeRate: null, freshness: 'pending', marketStatus: 'unknown' }),
    ])
    expect(validateIndicatorSnapshot(file).valid).toBe(true)
  })

  it('rejects a bad sourceUrl', () => {
    const file = snapshot([indicator({ sourceUrl: 'not-a-url' })])
    expect(validateIndicatorSnapshot(file).valid).toBe(false)
  })
})

describe('sanitizeIndicatorSnapshot', () => {
  it('keeps valid indicators and drops invalid ones, counting skips', () => {
    const file = snapshot([indicator({ id: 'good' }), indicator({ id: 'bad', category: 'nope' as MarketIndicator['category'] })])
    const result = sanitizeIndicatorSnapshot(file)
    expect(result.snapshot?.indicators.map((i) => i.id)).toEqual(['good'])
    expect(result.skippedCount).toBe(1)
  })

  it('returns null snapshot for malformed top-level input', () => {
    expect(sanitizeIndicatorSnapshot({ nope: true }).snapshot).toBeNull()
    expect(sanitizeIndicatorSnapshot(null).snapshot).toBeNull()
  })
})

describe('sanitizeIndicatorHistory', () => {
  it('keeps only well-formed points', () => {
    const points = sanitizeIndicatorHistory([
      { referenceDate: '2026-08-20', value: 1 },
      { referenceDate: 'bad-date', value: 2 },
      { referenceDate: '2026-08-21', value: 'oops' },
      { referenceDate: '2026-08-22', value: 3 },
    ])
    expect(points).toEqual([
      { referenceDate: '2026-08-20', value: 1 },
      { referenceDate: '2026-08-22', value: 3 },
    ])
  })

  it('returns an empty array for non-array input', () => {
    expect(sanitizeIndicatorHistory(null)).toEqual([])
    expect(sanitizeIndicatorHistory('oops')).toEqual([])
  })
})
