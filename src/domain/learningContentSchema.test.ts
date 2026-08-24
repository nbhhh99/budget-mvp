import { describe, expect, it } from 'vitest'
import { sanitizeConceptCardsFile, validateConceptCardsFile } from './learningContentSchema'
import type { ConceptCard } from '../types/models'

function validConcept(overrides: Partial<ConceptCard> = {}): ConceptCard {
  return {
    id: 'emergency-fund',
    title: '비상자금',
    oneLineSummary: '갑작스러운 지출에 대비해 따로 마련해두는 돈이에요.',
    definition: '비상자금은 실직, 질병 등 예상치 못한 상황에 대비해 마련해두는 자금입니다.',
    example: '생활비의 3~6개월치를 CMA나 예금에 따로 두는 경우가 많습니다.',
    whyItMatters: '비상자금이 있으면 급한 지출이 생겨도 투자자산을 급하게 팔지 않아도 됩니다.',
    relatedAssetTypes: ['cash_deposit'],
    checklist: ['생활비 몇 개월치가 준비되어 있는지 확인해볼 수 있습니다.'],
    sources: [
      {
        organization: '금융감독원',
        title: 'e-금융교육센터',
        url: 'https://www.fss.or.kr/edu/main/main.do',
        accessedAt: '2026-08-24',
      },
    ],
    reviewedAt: '2026-08-24',
    estimatedMinutes: 2,
    difficulty: 'basic',
    ...overrides,
  }
}

describe('validateConceptCardsFile', () => {
  it('accepts a well-formed concept card array', () => {
    const result = validateConceptCardsFile([validConcept()])
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('rejects non-array input', () => {
    expect(validateConceptCardsFile({}).valid).toBe(false)
  })

  it('rejects a card with no sources', () => {
    const result = validateConceptCardsFile([validConcept({ sources: [] })])
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('출처'))).toBe(true)
  })

  it('rejects an invalid difficulty value', () => {
    // @ts-expect-error intentionally malformed for the test
    const result = validateConceptCardsFile([validConcept({ difficulty: 'expert' })])
    expect(result.valid).toBe(false)
  })

  it('rejects a non-positive estimatedMinutes', () => {
    const result = validateConceptCardsFile([validConcept({ estimatedMinutes: 0 })])
    expect(result.valid).toBe(false)
  })

  it('rejects a malformed reviewedAt date', () => {
    const result = validateConceptCardsFile([validConcept({ reviewedAt: '2026/08/24' })])
    expect(result.valid).toBe(false)
  })
})

describe('sanitizeConceptCardsFile', () => {
  it('keeps valid cards and drops only the broken one', () => {
    const broken = { ...validConcept({ id: 'broken' }), sources: [] }
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
