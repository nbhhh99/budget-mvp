import { describe, expect, it } from 'vitest'
import { scoreConceptCards, sortByRelevance } from './learningRelevance'
import type { ConceptCard } from '../types/models'

function makeCard(overrides: Partial<ConceptCard>): ConceptCard {
  return {
    id: 'c',
    title: 't',
    oneLineSummary: 's',
    definition: 'd',
    example: 'e',
    whyItMatters: 'w',
    relatedAssetTypes: [],
    checklist: [],
    sources: [],
    reviewedAt: '2026-08-24',
    estimatedMinutes: 1,
    difficulty: 'basic',
    ...overrides,
  }
}

describe('scoreConceptCards', () => {
  it('never removes cards, even with zero relevance', () => {
    const cards = [makeCard({ id: 'a' }), makeCard({ id: 'b', relatedAssetTypes: ['crypto'] })]
    const scored = scoreConceptCards(cards, new Set())
    expect(scored).toHaveLength(2)
  })

  it('scores higher when more held asset types match', () => {
    const card = makeCard({ relatedAssetTypes: ['cash_deposit', 'debt', 'pension'] })
    const scored = scoreConceptCards([card], new Set(['cash_deposit', 'debt']))
    expect(scored[0].relevanceScore).toBe(2)
  })

  it('scores zero when nothing matches', () => {
    const card = makeCard({ relatedAssetTypes: ['crypto'] })
    const scored = scoreConceptCards([card], new Set(['cash_deposit']))
    expect(scored[0].relevanceScore).toBe(0)
  })
})

describe('sortByRelevance', () => {
  it('orders highest relevance first without dropping any items', () => {
    const items = [
      { id: 'low', relevanceScore: 0 },
      { id: 'high', relevanceScore: 3 },
      { id: 'mid', relevanceScore: 1 },
    ]
    const sorted = sortByRelevance(items)
    expect(sorted.map((i) => i.id)).toEqual(['high', 'mid', 'low'])
    expect(sorted).toHaveLength(3)
  })

  it('does not mutate the original array', () => {
    const items = [
      { id: 'a', relevanceScore: 0 },
      { id: 'b', relevanceScore: 1 },
    ]
    const original = [...items]
    sortByRelevance(items)
    expect(items).toEqual(original)
  })
})
