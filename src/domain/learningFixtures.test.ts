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
})
