import { describe, expect, it } from 'vitest'
import { deriveMacroIndicators } from './indicatorMacro'
import type { BriefingItem, FinancialBriefing } from '../types/models'

function item(overrides: Partial<BriefingItem> = {}): BriefingItem {
  return {
    id: 'kr-base-rate',
    region: 'korea',
    category: 'interest_rate',
    title: '한국은행 기준금리',
    factSummary: '기준금리는 3.00%입니다.',
    value: 3.0,
    unit: '%',
    previousValue: 2.75,
    referenceDate: '2026-08-01',
    significance: '...',
    assetImplications: [],
    checklist: [],
    sources: [{ organization: '한국은행', title: '기준금리', url: 'https://www.bok.or.kr', accessedAt: '2026-08-01' }],
    tags: ['base_rate'],
    ...overrides,
  }
}

function briefing(items: BriefingItem[]): FinancialBriefing {
  return {
    yearMonth: '2026-08',
    generatedAt: '2026-08-23T00:00:00.000Z',
    reviewedAt: '2026-08-23T00:00:00.000Z',
    status: 'reviewed',
    summary: 'summary',
    items,
  }
}

describe('deriveMacroIndicators', () => {
  it('returns an empty array for a null briefing', () => {
    expect(deriveMacroIndicators(null)).toEqual([])
  })

  it('only includes macro-relevant categories (interest_rate/inflation/employment/growth)', () => {
    const result = deriveMacroIndicators(
      briefing([
        item({ category: 'interest_rate' }),
        item({ id: 'kr-cpi', category: 'inflation' }),
        item({ id: 'kr-tax', category: 'tax' }),
        item({ id: 'kr-fx', category: 'exchange_rate' }),
      ]),
    )
    expect(result.map((r) => r.sourceId)).toEqual(['kr-base-rate', 'kr-cpi'])
    expect(result.every((r) => r.category === 'macro')).toBe(true)
  })

  it('computes change and changeRate from value/previousValue', () => {
    const [indicator] = deriveMacroIndicators(briefing([item({ value: 3.0, previousValue: 2.75 })]))
    expect(indicator.change).toBeCloseTo(0.25)
    expect(indicator.changeRate).toBeCloseTo((0.25 / 2.75) * 100, 1)
  })

  it('marks an item with no value as unavailable/not-released', () => {
    const [indicator] = deriveMacroIndicators(briefing([item({ value: undefined, previousValue: undefined, unit: undefined })]))
    expect(indicator.value).toBeNull()
    expect(indicator.freshness).toBe('unavailable')
    expect(indicator.marketStatus).toBe('not-released')
  })

  it('falls back to the briefing summary source name when an item has no sources', () => {
    const [indicator] = deriveMacroIndicators(briefing([item({ sources: [] })]))
    expect(indicator.sourceName).toBe('재무 브리핑')
    expect(indicator.sourceUrl).toBe('')
  })
})
