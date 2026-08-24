import { describe, expect, it } from 'vitest'
import { filterByCategory, searchConcepts, sortConceptsAlphabetically } from './conceptSearch'
import type { ConceptCard } from '../types/models'

function card(overrides: Partial<ConceptCard> = {}): ConceptCard {
  return {
    id: 'x',
    title: '복리',
    shortDefinition: '이자에 이자가 붙는 방식이에요.',
    body: '',
    keyPoints: [],
    relatedConceptIds: [],
    category: 'money-interest',
    sourceIds: ['bok-edu'],
    reviewedAt: '2026-08-24',
    version: 1,
    status: 'reviewed',
    ...overrides,
  }
}

describe('searchConcepts', () => {
  const cards = [
    card({ id: 'a', title: '복리' }),
    card({ id: 'b', title: '금리', shortDefinition: '돈을 빌리거나 맡길 때 적용되는 이자의 비율이에요.' }),
    card({ id: 'c', title: 'ISA' }),
  ]

  it('returns everything for an empty query', () => {
    expect(searchConcepts(cards, '')).toHaveLength(3)
    expect(searchConcepts(cards, '   ')).toHaveLength(3)
  })

  it('matches by title', () => {
    expect(searchConcepts(cards, '복리').map((c) => c.id)).toEqual(['a'])
  })

  it('matches by shortDefinition too', () => {
    expect(searchConcepts(cards, '이자의 비율').map((c) => c.id)).toEqual(['b'])
  })

  it('is case-insensitive', () => {
    expect(searchConcepts(cards, 'isa').map((c) => c.id)).toEqual(['c'])
  })

  it('returns an empty array when nothing matches', () => {
    expect(searchConcepts(cards, '존재하지않는단어')).toEqual([])
  })

  it('matches by alias (case-insensitive)', () => {
    const withAlias = [
      ...cards,
      card({ id: 'd', title: '주가수익비율(PER)', shortDefinition: '주가를 주당순이익으로 나눈 값이에요.', aliases: ['PER', '피이알', '주가수익비율'] }),
    ]
    expect(searchConcepts(withAlias, 'per').map((c) => c.id)).toEqual(['d'])
    expect(searchConcepts(withAlias, '피이알').map((c) => c.id)).toEqual(['d'])
  })

  it('does not fail when a card has no aliases field', () => {
    expect(() => searchConcepts(cards, '복리')).not.toThrow()
  })
})

describe('filterByCategory', () => {
  const cards = [
    card({ id: 'a', category: 'money-interest' }),
    card({ id: 'b', category: 'investing' }),
  ]

  it('returns everything for "all"', () => {
    expect(filterByCategory(cards, 'all')).toHaveLength(2)
  })

  it('filters to a single category', () => {
    expect(filterByCategory(cards, 'investing').map((c) => c.id)).toEqual(['b'])
  })
})

describe('sortConceptsAlphabetically', () => {
  it('sorts by Korean title order', () => {
    const cards = [card({ id: 'a', title: '환율' }), card({ id: 'b', title: '금리' })]
    expect(sortConceptsAlphabetically(cards).map((c) => c.id)).toEqual(['b', 'a'])
  })

  it('does not mutate the input array', () => {
    const cards = [card({ id: 'a', title: '환율' }), card({ id: 'b', title: '금리' })]
    sortConceptsAlphabetically(cards)
    expect(cards.map((c) => c.id)).toEqual(['a', 'b'])
  })
})
