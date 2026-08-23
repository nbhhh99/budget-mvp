import { describe, expect, it } from 'vitest'
import { checkUnitConsistency, sanitizeBriefingFile, validateBriefingFile } from './briefingSchema'
import type { FinancialBriefing } from '../types/models'

function validBriefing(): FinancialBriefing {
  return {
    yearMonth: '2026-08',
    generatedAt: '2026-08-23T00:00:00.000Z',
    status: 'reviewed',
    reviewedAt: '2026-08-23T00:00:00.000Z',
    summary: '이번 달 한눈에 보기',
    items: [
      {
        id: 'kr-base-rate-2026-08',
        region: 'korea',
        category: 'interest_rate',
        title: '한국은행 기준금리',
        factSummary: '한국은행이 기준금리를 결정했습니다.',
        value: 2.75,
        unit: '%',
        previousValue: 2.75,
        comparisonBasis: 'none',
        referenceDate: '2026-08-21',
        significance: '기준금리는 예금·대출 금리에 영향을 줄 수 있습니다.',
        assetImplications: [
          { assetTypes: ['cash_deposit'], explanation: '예금 금리에 영향을 줄 수 있습니다.' },
        ],
        checklist: ['예금 만기 시 적용금리를 확인해볼 수 있습니다.'],
        sources: [
          {
            organization: '한국은행',
            title: '통화정책방향 결정',
            url: 'https://www.bok.or.kr/example',
            publishedAt: '2026-08-21',
            accessedAt: '2026-08-23',
          },
        ],
        tags: ['base_rate'],
      },
    ],
  }
}

describe('validateBriefingFile', () => {
  it('accepts a well-formed briefing', () => {
    const result = validateBriefingFile(validBriefing())
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('rejects non-object input', () => {
    expect(validateBriefingFile(null).valid).toBe(false)
    expect(validateBriefingFile('nope').valid).toBe(false)
  })

  it('rejects a malformed yearMonth', () => {
    const file = { ...validBriefing(), yearMonth: '2026/08' }
    const result = validateBriefingFile(file)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('yearMonth'))).toBe(true)
  })

  it('rejects an item with no sources (§10 requires at least one)', () => {
    const file = validBriefing()
    file.items[0].sources = []
    const result = validateBriefingFile(file)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('출처'))).toBe(true)
  })

  it('rejects a source missing a URL', () => {
    const file = validBriefing()
    // @ts-expect-error intentionally malformed for the test
    delete file.items[0].sources[0].url
    const result = validateBriefingFile(file)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('URL'))).toBe(true)
  })

  it('rejects an invalid referenceDate format', () => {
    const file = validBriefing()
    file.items[0].referenceDate = '2026.08.21'
    const result = validateBriefingFile(file)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('referenceDate'))).toBe(true)
  })

  it('rejects an invalid category value', () => {
    const file = validBriefing()
    // @ts-expect-error intentionally malformed for the test
    file.items[0].category = 'stock_price'
    const result = validateBriefingFile(file)
    expect(result.valid).toBe(false)
  })

  it('rejects an invalid policyStatus value', () => {
    const file = validBriefing()
    // @ts-expect-error intentionally malformed for the test
    file.items[0].policyStatus = 'maybe'
    const result = validateBriefingFile(file)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('policyStatus'))).toBe(true)
  })

  it('rejects a value present without a unit', () => {
    const file = validBriefing()
    delete file.items[0].unit
    const result = validateBriefingFile(file)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('unit'))).toBe(true)
  })

  it('rejects an interest_rate item with no tags to disambiguate which rate it is', () => {
    const file = validBriefing()
    file.items[0].tags = []
    const result = validateBriefingFile(file)
    expect(result.valid).toBe(false)
  })

  it('rejects an assetImplications entry with empty assetTypes', () => {
    const file = validBriefing()
    file.items[0].assetImplications = [{ assetTypes: [], explanation: '설명' }]
    const result = validateBriefingFile(file)
    expect(result.valid).toBe(false)
  })
})

describe('sanitizeBriefingFile', () => {
  it('returns the full briefing untouched when everything is valid', () => {
    const result = sanitizeBriefingFile(validBriefing())
    expect(result.briefing?.items).toHaveLength(1)
    expect(result.skippedItemCount).toBe(0)
  })

  it('returns null when the top-level structure itself is broken', () => {
    const result = sanitizeBriefingFile({ not: 'a briefing' })
    expect(result.briefing).toBeNull()
    expect(result.itemErrors.length).toBeGreaterThan(0)
  })

  it('returns null for non-object input', () => {
    expect(sanitizeBriefingFile('nope').briefing).toBeNull()
    expect(sanitizeBriefingFile(null).briefing).toBeNull()
  })

  it('keeps the valid items and drops only the broken one, reporting the skipped count', () => {
    const file = validBriefing()
    const brokenItem = { ...file.items[0], id: 'broken', sources: [] }
    file.items.push(brokenItem)
    const result = sanitizeBriefingFile(file)
    expect(result.briefing?.items).toHaveLength(1)
    expect(result.briefing?.items[0].id).toBe(file.items[0].id)
    expect(result.skippedItemCount).toBe(1)
    expect(result.itemErrors.length).toBeGreaterThan(0)
  })

  it('still returns a briefing with an empty items array when every item is broken', () => {
    const file = validBriefing()
    file.items[0].sources = []
    const result = sanitizeBriefingFile(file)
    expect(result.briefing?.items).toHaveLength(0)
    expect(result.skippedItemCount).toBe(1)
  })
})

describe('checkUnitConsistency', () => {
  it('returns no warnings when there is no previous briefing', () => {
    expect(checkUnitConsistency(null, validBriefing())).toEqual([])
  })

  it('returns no warnings when units match across months', () => {
    const previous = validBriefing()
    const current = validBriefing()
    expect(checkUnitConsistency(previous, current)).toEqual([])
  })

  it('warns when the same region+category pair changes unit month to month', () => {
    const previous = validBriefing()
    const current = validBriefing()
    current.items[0].unit = 'bp'
    const warnings = checkUnitConsistency(previous, current)
    expect(warnings.length).toBe(1)
    expect(warnings[0]).toContain('단위')
  })
})
