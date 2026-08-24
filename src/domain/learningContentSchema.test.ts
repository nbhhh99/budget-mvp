import { describe, expect, it } from 'vitest'
import { sanitizeConceptCardsFile, validateConceptCardsFile } from './learningContentSchema'
import type { ConceptCard } from '../types/models'

function validConcept(overrides: Partial<ConceptCard> = {}): ConceptCard {
  return {
    id: 'emergency-fund',
    title: '비상자금',
    shortDefinition: '갑작스러운 지출에 대비해 따로 마련해두는 돈이에요.',
    body: '비상자금은 실직, 질병 등 예상치 못한 상황에 대비해 마련해두는 자금입니다.',
    keyPoints: ['생활비 몇 개월치가 준비되어 있는지 확인해볼 수 있어요.'],
    relatedConceptIds: [],
    category: 'daily-finance',
    sourceIds: ['fss-edu'],
    reviewedAt: '2026-08-24',
    version: 1,
    status: 'reviewed',
    ...overrides,
  }
}

function inReviewConcept(overrides: Partial<ConceptCard> = {}): ConceptCard {
  return {
    id: 'stub-term',
    title: '검토 중 개념',
    shortDefinition: '',
    body: '',
    keyPoints: [],
    relatedConceptIds: [],
    category: 'economy-market',
    sourceIds: [],
    reviewedAt: '',
    version: 1,
    status: 'in_review',
    ...overrides,
  }
}

describe('validateConceptCardsFile', () => {
  it('accepts a well-formed reviewed concept card array', () => {
    const result = validateConceptCardsFile([validConcept()])
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('accepts an in_review stub with empty body/sourceIds/reviewedAt', () => {
    const result = validateConceptCardsFile([inReviewConcept()])
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('rejects non-array input', () => {
    expect(validateConceptCardsFile({}).valid).toBe(false)
  })

  it('rejects a reviewed card with no sourceIds', () => {
    const result = validateConceptCardsFile([validConcept({ sourceIds: [] })])
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('출처'))).toBe(true)
  })

  it('rejects an invalid category value', () => {
    // @ts-expect-error intentionally malformed for the test
    const result = validateConceptCardsFile([validConcept({ category: 'not-a-category' })])
    expect(result.valid).toBe(false)
  })

  it('rejects an invalid status value', () => {
    // @ts-expect-error intentionally malformed for the test
    const result = validateConceptCardsFile([validConcept({ status: 'draft' })])
    expect(result.valid).toBe(false)
  })

  it('rejects a reviewed card with an empty body', () => {
    const result = validateConceptCardsFile([validConcept({ body: '' })])
    expect(result.valid).toBe(false)
  })

  it('rejects a malformed reviewedAt date on a reviewed card', () => {
    const result = validateConceptCardsFile([validConcept({ reviewedAt: '2026/08/24' })])
    expect(result.valid).toBe(false)
  })

  it('rejects duplicate ids in the same file', () => {
    const result = validateConceptCardsFile([validConcept(), validConcept()])
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('중복'))).toBe(true)
  })
})

describe('sanitizeConceptCardsFile', () => {
  it('keeps valid cards and drops only the broken one', () => {
    const broken = { ...validConcept({ id: 'broken' }), sourceIds: [] }
    const result = sanitizeConceptCardsFile([validConcept(), broken])
    expect(result.cards).toHaveLength(1)
    expect(result.skippedCount).toBe(1)
  })

  it('returns an empty list (not a throw) for non-array input', () => {
    const result = sanitizeConceptCardsFile('nope')
    expect(result.cards).toEqual([])
    expect(result.itemErrors.length).toBeGreaterThan(0)
  })
})
