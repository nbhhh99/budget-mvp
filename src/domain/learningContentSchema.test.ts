import { describe, expect, it } from 'vitest'
import {
  sanitizeConceptCardsFile,
  sanitizeMonthlyLesson,
  validateConceptCardsFile,
  validateMonthlyLesson,
} from './learningContentSchema'
import type { ConceptCard, MonthlyMoneyLesson } from '../types/models'

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

function validLesson(overrides: Partial<MonthlyMoneyLesson> = {}): MonthlyMoneyLesson {
  return {
    id: '2026-08-base-rate',
    yearMonth: '2026-08',
    title: '기준금리가 바뀌면 예금과 대출에는 어떤 일이 생길까?',
    subtitle: '이번 달 한국은행 기준금리 인상과 연결된 학습 주제',
    relatedBriefingItemIds: ['kr-base-rate-2026-08'],
    learningGoals: ['기준금리와 시장금리의 관계를 이해합니다.'],
    sections: [{ heading: '기준금리란', body: '한국은행이 정하는 정책금리입니다.' }],
    reflectionQuestion: '내가 가진 예금·대출은 금리 변화에 어떻게 반응할까요?',
    relatedConceptIds: ['nominal-vs-real-rate'],
    relatedCalculatorIds: ['compound_interest'],
    sources: [
      {
        organization: '한국은행',
        title: '기준금리 추이',
        url: 'https://www.bok.or.kr/portal/singl/baseRate/list.do',
        accessedAt: '2026-08-24',
      },
    ],
    status: 'reviewed',
    reviewedAt: '2026-08-24T00:00:00.000Z',
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

describe('validateMonthlyLesson', () => {
  it('accepts a well-formed lesson', () => {
    const result = validateMonthlyLesson(validLesson())
    expect(result.valid).toBe(true)
  })

  it('rejects a lesson with no sections', () => {
    const result = validateMonthlyLesson(validLesson({ sections: [] }))
    expect(result.valid).toBe(false)
  })

  it('rejects a lesson with no sources', () => {
    const result = validateMonthlyLesson(validLesson({ sources: [] }))
    expect(result.valid).toBe(false)
  })

  it('rejects an invalid status', () => {
    // @ts-expect-error intentionally malformed for the test
    const result = validateMonthlyLesson(validLesson({ status: 'archived' }))
    expect(result.valid).toBe(false)
  })

  it('rejects a malformed yearMonth', () => {
    const result = validateMonthlyLesson(validLesson({ yearMonth: '2026/08' }))
    expect(result.valid).toBe(false)
  })
})

describe('sanitizeMonthlyLesson', () => {
  it('returns the lesson when valid', () => {
    expect(sanitizeMonthlyLesson(validLesson())).not.toBeNull()
  })

  it('returns null when invalid instead of throwing', () => {
    expect(sanitizeMonthlyLesson({ not: 'a lesson' })).toBeNull()
  })
})
