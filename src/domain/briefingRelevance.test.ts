import { describe, expect, it } from 'vitest'
import {
  computeHeldAssetTypes,
  scoreBriefingItems,
  selectSummaryItems,
  type ScoredBriefingItem,
} from './briefingRelevance'
import type { BriefingItem, Category, Transaction } from '../types/models'

function makeCategory(id: string, overrides: Partial<Category> = {}): Category {
  return {
    id,
    group: 'saving',
    name: id,
    order: 0,
    color: '#000',
    hidden: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeTx(categoryId: string, type: Transaction['type']): Transaction {
  return {
    id: `${categoryId}-${type}`,
    type,
    amount: 1000,
    categoryId,
    date: '2026-08-01',
    time: '00:00',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  }
}

function makeItem(overrides: Partial<BriefingItem>): BriefingItem {
  return {
    id: 'item',
    region: 'korea',
    category: 'interest_rate',
    title: 'title',
    factSummary: 'fact',
    referenceDate: '2026-08-01',
    significance: 'sig',
    assetImplications: [],
    checklist: [],
    sources: [],
    tags: [],
    ...overrides,
  }
}

describe('computeHeldAssetTypes', () => {
  it('detects a held asset type from a saving-type transaction in a tagged saving category', () => {
    const axa = makeCategory('axa', { assetType: 'pension' })
    const held = computeHeldAssetTypes([axa], [makeTx('axa', 'saving')])
    expect(held.has('pension')).toBe(true)
  })

  it('ignores a saving category transaction of the wrong transaction type', () => {
    const axa = makeCategory('axa', { assetType: 'pension' })
    // recorded as expense, not saving — shouldn't count as holding the asset
    const held = computeHeldAssetTypes([axa], [makeTx('axa', 'expense')])
    expect(held.has('pension')).toBe(false)
  })

  it('detects debt from an expense-type transaction in a debt-tagged expense category', () => {
    const interest = makeCategory('interest', { group: 'expense', assetType: 'debt' })
    const held = computeHeldAssetTypes([interest], [makeTx('interest', 'expense')])
    expect(held.has('debt')).toBe(true)
  })

  it('ignores categories with no assetType set', () => {
    const stock = makeCategory('stock')
    const held = computeHeldAssetTypes([stock], [makeTx('stock', 'saving')])
    expect(held.size).toBe(0)
  })

  it('ignores transactions referencing an unknown category', () => {
    const held = computeHeldAssetTypes([], [makeTx('ghost', 'saving')])
    expect(held.size).toBe(0)
  })
})

describe('scoreBriefingItems', () => {
  it('never removes items, even with zero relevance', () => {
    const items = [makeItem({ id: 'a' }), makeItem({ id: 'b' })]
    const scored = scoreBriefingItems(items, new Set())
    expect(scored).toHaveLength(2)
    expect(scored.every((i) => i.relevanceScore === 0)).toBe(true)
  })

  it('scores higher when more of the held asset types are referenced', () => {
    const item = makeItem({
      assetImplications: [
        { assetTypes: ['cash_deposit', 'debt'], explanation: 'x' },
        { assetTypes: ['pension'], explanation: 'y' },
      ],
    })
    const scored = scoreBriefingItems([item], new Set(['cash_deposit', 'debt']))
    expect(scored[0].relevanceScore).toBe(2)
  })
})

describe('selectSummaryItems', () => {
  function scored(overrides: Partial<ScoredBriefingItem>): ScoredBriefingItem {
    return { ...makeItem({}), relevanceScore: 0, ...overrides }
  }

  it('buckets items into korea/global/policy and orders by relevance', () => {
    const items = [
      scored({ id: 'kr-low', region: 'korea', relevanceScore: 0 }),
      scored({ id: 'kr-high', region: 'korea', relevanceScore: 5 }),
      scored({ id: 'gl-1', region: 'global', relevanceScore: 1 }),
      scored({ id: 'tax-1', category: 'tax', region: 'korea', relevanceScore: 0 }),
    ]
    const selection = selectSummaryItems(items)
    expect(selection.korea.map((i) => i.id)).toEqual(['kr-high', 'kr-low'])
    expect(selection.global.map((i) => i.id)).toEqual(['gl-1'])
    expect(selection.policy.map((i) => i.id)).toEqual(['tax-1'])
  })

  it('caps each bucket at its documented maximum', () => {
    const koreaItems = Array.from({ length: 6 }, (_, i) =>
      scored({ id: `kr-${i}`, region: 'korea', relevanceScore: i }),
    )
    const policyItems = Array.from({ length: 5 }, (_, i) =>
      scored({ id: `pol-${i}`, category: 'financial_policy', relevanceScore: i }),
    )
    const selection = selectSummaryItems([...koreaItems, ...policyItems])
    expect(selection.korea.length).toBeLessThanOrEqual(4)
    expect(selection.policy.length).toBeLessThanOrEqual(3)
  })

  it('always prioritizes deposit_protection/tax items in the policy bucket even with low relevance', () => {
    const items = [
      scored({ id: 'financial-1', category: 'financial_policy', relevanceScore: 10 }),
      scored({ id: 'financial-2', category: 'financial_policy', relevanceScore: 9 }),
      scored({ id: 'financial-3', category: 'financial_policy', relevanceScore: 8 }),
      scored({ id: 'deposit-protection-1', category: 'deposit_protection', relevanceScore: 0 }),
    ]
    const selection = selectSummaryItems(items)
    expect(selection.policy.map((i) => i.id)).toContain('deposit-protection-1')
  })
})
