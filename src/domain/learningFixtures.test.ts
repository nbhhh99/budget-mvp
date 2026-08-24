// 정적으로 번들되는 학습 콘텐츠(돈 개념 사전·차근차근 경제사)가 항상 스키마와
// 서로 간의 참조 무결성을 지키는지 확인하는 회귀 테스트.
import { describe, expect, it } from 'vitest'
import { validateConceptCardsFile } from './learningContentSchema'
import { isModuleComplete } from './curriculum'
import { CONCEPTS } from '../content/concepts'
import { LEARNING_SOURCES } from '../content/learningSources'
import { ECONOMIC_HISTORY_CONTENTS, ECONOMIC_HISTORY_MODULES, HISTORY_BODIES } from '../content/economicHistory'

describe('CONCEPTS (돈 개념 사전)', () => {
  it('is a non-empty array that passes strict validation', () => {
    expect(CONCEPTS.length).toBeGreaterThan(0)
    const result = validateConceptCardsFile(CONCEPTS)
    expect(result.errors).toEqual([])
    expect(result.valid).toBe(true)
  })

  it('has no duplicate ids', () => {
    const ids = CONCEPTS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every relatedConceptIds entry points at another id that actually exists', () => {
    const ids = new Set(CONCEPTS.map((c) => c.id))
    for (const concept of CONCEPTS) {
      for (const relatedId of concept.relatedConceptIds) {
        expect(ids.has(relatedId), `${concept.id} -> ${relatedId}`).toBe(true)
      }
    }
  })

  it('every sourceIds entry points at a source that exists in the catalog', () => {
    const sourceIds = new Set(LEARNING_SOURCES.map((s) => s.id))
    for (const concept of CONCEPTS) {
      for (const sourceId of concept.sourceIds) {
        expect(sourceIds.has(sourceId), `${concept.id} -> source ${sourceId}`).toBe(true)
      }
    }
  })
})

// 이전에 '검토 중' 스텁이었던 26개 개념이 실제 콘텐츠로 채워졌는지 확인하는
// 회귀 테스트. 이 목록에서 하나라도 빠지면(또는 다시 in_review가 되면) 실패한다.
const FILLED_STUB_IDS = [
  'equal-principal-and-interest',
  'equal-principal',
  'bullet-repayment',
  'downside-risk',
  'compound-return',
  'rebalancing',
  'market-cap',
  'stock-index',
  'commodity',
  'foreign-currency-asset',
  'fund-distribution',
  'protection-insurance',
  'savings-insurance',
  'renewable-insurance',
  'non-renewable-insurance',
  'waiting-period',
  'reduction-period',
  'surrender-value',
  'tax-deferral',
  'gain-loss-offset',
  'oil-shock',
  'business-cycle',
  'fiscal-deficit',
  'trade-balance',
  'foreign-reserves',
  'asset-bubble',
]

describe('26개 완성 대상 개념(이전 in_review 스텁)', () => {
  it('has exactly the expected 26 ids, each present in CONCEPTS', () => {
    expect(FILLED_STUB_IDS).toHaveLength(26)
    const ids = new Set(CONCEPTS.map((c) => c.id))
    for (const id of FILLED_STUB_IDS) {
      expect(ids.has(id), id).toBe(true)
    }
  })

  it('none of the 26 are still in_review', () => {
    for (const id of FILLED_STUB_IDS) {
      const concept = CONCEPTS.find((c) => c.id === id)
      expect(concept?.status, id).toBe('reviewed')
    }
  })

  it('all 26 have a non-empty shortDefinition and body', () => {
    for (const id of FILLED_STUB_IDS) {
      const concept = CONCEPTS.find((c) => c.id === id)
      expect(concept?.shortDefinition.trim(), id).not.toBe('')
      expect(concept?.body.trim(), id).not.toBe('')
    }
  })

  it('all 26 have at least 2 keyPoints', () => {
    for (const id of FILLED_STUB_IDS) {
      const concept = CONCEPTS.find((c) => c.id === id)
      expect(concept?.keyPoints.length ?? 0, id).toBeGreaterThanOrEqual(2)
    }
  })

  it('all 26 have at least one official sourceId and a reviewedAt date', () => {
    for (const id of FILLED_STUB_IDS) {
      const concept = CONCEPTS.find((c) => c.id === id)
      expect(concept?.sourceIds.length ?? 0, id).toBeGreaterThanOrEqual(1)
      expect(concept?.reviewedAt, id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('no card anywhere in CONCEPTS is in_review anymore (all 26 stubs were the only ones)', () => {
    const stillInReview = CONCEPTS.filter((c) => c.status === 'in_review').map((c) => c.id)
    expect(stillInReview).toEqual([])
  })
})

describe('LEARNING_SOURCES', () => {
  it('has no duplicate ids', () => {
    const ids = LEARNING_SOURCES.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('ECONOMIC_HISTORY_MODULES / ECONOMIC_HISTORY_CONTENTS (차근차근 경제사)', () => {
  it('has exactly 16 modules with contiguous order 1..16', () => {
    expect(ECONOMIC_HISTORY_MODULES).toHaveLength(16)
    const orders = ECONOMIC_HISTORY_MODULES.map((m) => m.order).sort((a, b) => a - b)
    expect(orders).toEqual(Array.from({ length: 16 }, (_, i) => i + 1))
  })

  it('has no duplicate module ids', () => {
    const ids = ECONOMIC_HISTORY_MODULES.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("every module's itemIds exactly matches its actual content entries", () => {
    for (const module of ECONOMIC_HISTORY_MODULES) {
      const actualIds = ECONOMIC_HISTORY_CONTENTS.filter((c) => c.curriculumId === module.id)
        .map((c) => c.id)
        .sort()
      expect([...module.itemIds].sort(), module.id).toEqual(actualIds)
    }
  })

  it('has no orphan content entries pointing at a nonexistent module', () => {
    const moduleIds = new Set(ECONOMIC_HISTORY_MODULES.map((m) => m.id))
    for (const content of ECONOMIC_HISTORY_CONTENTS) {
      expect(moduleIds.has(content.curriculumId), content.id).toBe(true)
    }
  })

  it('modules with real content (non-empty itemIds) can actually reach completed', () => {
    for (const module of ECONOMIC_HISTORY_MODULES) {
      if (module.itemIds.length === 0) continue
      const contents = ECONOMIC_HISTORY_CONTENTS.filter((c) => c.curriculumId === module.id)
      expect(isModuleComplete(contents, module.itemIds), module.id).toBe(true)
    }
  })

  it('every quiz item has a single clearly-correct answer', () => {
    for (const content of ECONOMIC_HISTORY_CONTENTS) {
      if (content.type !== 'quiz' || !content.quiz) continue
      expect(content.quiz.choices.length, content.id).toBeGreaterThanOrEqual(2)
      expect(content.quiz.correctIndex, content.id).toBeGreaterThanOrEqual(0)
      expect(content.quiz.correctIndex, content.id).toBeLessThan(content.quiz.choices.length)
    }
  })

  it('every module with real content has a matching HISTORY_BODIES entry', () => {
    for (const module of ECONOMIC_HISTORY_MODULES) {
      if (module.itemIds.length === 0) continue
      expect(HISTORY_BODIES[module.id], module.id).toBeDefined()
    }
  })

  it("every module's sourceIds entry points at a source that exists in the catalog", () => {
    const sourceIds = new Set(LEARNING_SOURCES.map((s) => s.id))
    for (const module of ECONOMIC_HISTORY_MODULES) {
      for (const sourceId of module.sourceIds ?? []) {
        expect(sourceIds.has(sourceId), `${module.id} -> source ${sourceId}`).toBe(true)
      }
    }
  })

  it("every HISTORY_BODIES relatedConceptIds entry points at a concept card that exists", () => {
    const conceptIds = new Set(CONCEPTS.map((c) => c.id))
    for (const [moduleId, body] of Object.entries(HISTORY_BODIES)) {
      for (const conceptId of body.relatedConceptIds) {
        expect(conceptIds.has(conceptId), `${moduleId} -> concept ${conceptId}`).toBe(true)
      }
    }
  })

  it("every module's conceptIds entry points at a concept card that exists", () => {
    const conceptIds = new Set(CONCEPTS.map((c) => c.id))
    for (const module of ECONOMIC_HISTORY_MODULES) {
      for (const conceptId of module.conceptIds ?? []) {
        expect(conceptIds.has(conceptId), `${module.id} -> concept ${conceptId}`).toBe(true)
      }
    }
  })
})

// 이전에 '검토 중'이었던 10개 경제사 과정이 실제 콘텐츠로 채워졌는지 확인하는 회귀 테스트.
const FILLED_HISTORY_MODULE_IDS = [
  'history-joint-stock-market',
  'history-industrial-revolution',
  'history-bretton-woods',
  'history-oil-shock',
  'history-korea-growth',
  'history-asian-financial-crisis',
  'history-dotcom-bubble',
  'history-european-debt-crisis',
  'history-covid-economy',
  'history-digital-finance',
]

describe('10개 완성 대상 경제사 과정(이전 검토 중 스텁)', () => {
  it('has exactly the expected 10 ids, each present in ECONOMIC_HISTORY_MODULES', () => {
    expect(FILLED_HISTORY_MODULE_IDS).toHaveLength(10)
    const ids = new Set(ECONOMIC_HISTORY_MODULES.map((m) => m.id))
    for (const id of FILLED_HISTORY_MODULE_IDS) {
      expect(ids.has(id), id).toBe(true)
    }
  })

  it('none of the 10 are still stubbed out (empty itemIds)', () => {
    for (const id of FILLED_HISTORY_MODULE_IDS) {
      const module = ECONOMIC_HISTORY_MODULES.find((m) => m.id === id)
      expect(module?.itemIds.length ?? 0, id).toBeGreaterThan(0)
    }
  })

  it('all 10 have estimatedMinutes and a HISTORY_BODIES entry', () => {
    for (const id of FILLED_HISTORY_MODULE_IDS) {
      const module = ECONOMIC_HISTORY_MODULES.find((m) => m.id === id)
      expect(module?.estimatedMinutes, id).toBeGreaterThan(0)
      expect(HISTORY_BODIES[id], id).toBeDefined()
    }
  })

  it('no module anywhere has empty itemIds anymore (all 16 are complete)', () => {
    const stillStubbed = ECONOMIC_HISTORY_MODULES.filter((m) => m.itemIds.length === 0).map((m) => m.id)
    expect(stillStubbed).toEqual([])
  })
})

// 새로 추가된 주식 용어 카드가 모두 실제 콘텐츠(reviewed)로 채워져 있는지 확인하는 회귀 테스트.
const NEW_STOCK_CONCEPT_IDS = [
  'stock',
  'joint-stock-company',
  'limited-liability',
  'shareholder',
  'stock-market',
  'equity',
  'par-value',
  'common-and-preferred-stock',
  'shareholder-meeting-and-voting-right',
  'authorized-and-issued-shares',
  'kospi-kosdaq',
  'listing',
  'ipo',
  'primary-and-secondary-market',
  'order-types',
  'trading-hours-and-price-limit',
  'circuit-breaker-and-sidecar',
  'trading-halt-and-market-alert',
  'per',
  'pbr',
  'eps',
  'bps',
  'roe',
  'intrinsic-value-vs-market-price',
  'treasury-stock-buyback',
  'ex-dividend-and-record-date',
  'capital-increase',
  'capital-reduction',
  'stock-split-and-merger',
  'convertible-bond-and-bw',
  'disclosure',
  'dart',
  'financial-statement-basics',
  'market-risk-and-idiosyncratic-risk',
  'short-selling',
  'blue-chip-stock',
  'foreign-and-institutional-investors',
  'etf-mechanics',
  'nav-tracking-error-and-premium-discount',
]

describe('신규 추가된 주식 용어 카드', () => {
  it('has at least 35 new stock-related concept ids, each present and reviewed in CONCEPTS', () => {
    expect(NEW_STOCK_CONCEPT_IDS.length).toBeGreaterThanOrEqual(35)
    for (const id of NEW_STOCK_CONCEPT_IDS) {
      const concept = CONCEPTS.find((c) => c.id === id)
      expect(concept, id).toBeDefined()
      expect(concept?.status, id).toBe('reviewed')
    }
  })

  it('all have at least 2 keyPoints, a non-empty body, and at least one sourceId', () => {
    for (const id of NEW_STOCK_CONCEPT_IDS) {
      const concept = CONCEPTS.find((c) => c.id === id)
      expect(concept?.keyPoints.length ?? 0, id).toBeGreaterThanOrEqual(2)
      expect(concept?.body.trim(), id).not.toBe('')
      expect(concept?.sourceIds.length ?? 0, id).toBeGreaterThanOrEqual(1)
    }
  })

  it('no new stock concept id duplicates another entry in CONCEPTS', () => {
    const allIds = CONCEPTS.map((c) => c.id)
    for (const id of NEW_STOCK_CONCEPT_IDS) {
      expect(allIds.filter((x) => x === id), id).toHaveLength(1)
    }
  })
})
