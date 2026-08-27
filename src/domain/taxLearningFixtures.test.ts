// 생활 세금 공부 25개 과정 콘텐츠의 무결성을 확인하는 회귀 테스트.
// (다른 커리큘럼 콘텐츠 회귀 테스트는 learningFixtures.test.ts에 있다 — 이 파일은
// 세금 학습 콘텐츠가 커서 별도 파일로 분리했다.)
import { describe, expect, it } from 'vitest'
import {
  TAX_LEARNING_CONTENTS,
  TAX_LEARNING_MODULES,
  TAX_LEARNING_VERSION,
  TAX_LESSONS,
  TAX_STAGES,
} from '../content/taxLearning'
import { LEARNING_SOURCES } from '../content/learningSources'
import { isModuleComplete } from './curriculum'

describe('TAX_LESSONS — 25개 과정 구조', () => {
  it('has exactly 25 lessons', () => {
    expect(TAX_LESSONS).toHaveLength(25)
  })

  it('has no duplicate lesson ids', () => {
    const ids = TAX_LESSONS.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has order exactly 1..25 with no gaps or duplicates', () => {
    const orders = TAX_LESSONS.map((l) => l.order).sort((a, b) => a - b)
    expect(orders).toEqual(Array.from({ length: 25 }, (_, i) => i + 1))
  })

  it('every lesson id follows the tax-learning-NN naming convention and matches its order', () => {
    for (const lesson of TAX_LESSONS) {
      expect(lesson.id, `order ${lesson.order}`).toBe(`tax-learning-${String(lesson.order).padStart(2, '0')}`)
    }
  })
})

describe('TAX_STAGES — 4단계 배치', () => {
  it('has exactly 4 stages', () => {
    expect(TAX_STAGES).toHaveLength(4)
  })

  it('together the 4 stages cover all 25 lessons exactly once (no gaps, no overlap)', () => {
    const allLessonIdsInStages = TAX_STAGES.flatMap((s) => s.lessonIds)
    expect(allLessonIdsInStages).toHaveLength(25)
    expect(new Set(allLessonIdsInStages).size).toBe(25)
    const lessonIds = new Set(TAX_LESSONS.map((l) => l.id))
    for (const id of allLessonIdsInStages) {
      expect(lessonIds.has(id), id).toBe(true)
    }
  })

  it("every lesson's stageId matches the stage that actually lists it", () => {
    const stageByLessonId = new Map<string, string>()
    for (const stage of TAX_STAGES) {
      for (const lessonId of stage.lessonIds) stageByLessonId.set(lessonId, stage.id)
    }
    for (const lesson of TAX_LESSONS) {
      expect(stageByLessonId.get(lesson.id), lesson.id).toBe(lesson.stageId)
    }
  })

  it('stage lesson counts match the spec: 6, 7, 6, 6', () => {
    const counts = [...TAX_STAGES].sort((a, b) => a.order - b.order).map((s) => s.lessonIds.length)
    expect(counts).toEqual([6, 7, 6, 6])
  })

  it('within each stage, lesson order is contiguous and ascending', () => {
    for (const stage of TAX_STAGES) {
      const lessons = stage.lessonIds.map((id) => TAX_LESSONS.find((l) => l.id === id)!)
      const orders = lessons.map((l) => l.order)
      expect(orders, stage.id).toEqual([...orders].sort((a, b) => a - b))
    }
  })
})

describe('TAX_LESSONS — 필수 섹션 존재', () => {
  it('every lesson has all required narrative sections filled in', () => {
    for (const lesson of TAX_LESSONS) {
      expect(lesson.todayQuestion.trim().length, `${lesson.id} todayQuestion`).toBeGreaterThan(0)
      expect(lesson.coreSentence.trim().length, `${lesson.id} coreSentence`).toBeGreaterThan(0)
      expect(lesson.lifeExample.trim().length, `${lesson.id} lifeExample`).toBeGreaterThan(0)
      expect(lesson.numberExample.description.trim().length, `${lesson.id} numberExample.description`).toBeGreaterThan(0)
      expect(lesson.numberExample.lines.length, `${lesson.id} numberExample.lines`).toBeGreaterThan(0)
      expect(lesson.numberExample.caveat.trim().length, `${lesson.id} numberExample.caveat`).toBeGreaterThan(0)
    }
  })

  it('every lesson has 3~5 explanation paragraphs(쉽게 이해하기)', () => {
    for (const lesson of TAX_LESSONS) {
      expect(lesson.explanation.length, lesson.id).toBeGreaterThanOrEqual(3)
      expect(lesson.explanation.length, lesson.id).toBeLessThanOrEqual(5)
      for (const p of lesson.explanation) expect(p.trim().length, lesson.id).toBeGreaterThan(0)
    }
  })

  it('every lesson has 2~4 pitfalls(헷갈리기 쉬운 점)', () => {
    for (const lesson of TAX_LESSONS) {
      expect(lesson.pitfalls.length, lesson.id).toBeGreaterThanOrEqual(2)
      expect(lesson.pitfalls.length, lesson.id).toBeLessThanOrEqual(4)
      for (const p of lesson.pitfalls) expect(p.trim().length, lesson.id).toBeGreaterThan(0)
    }
  })
})

describe('TAX_LESSONS — 확인 문제(퀴즈)', () => {
  it('every lesson has exactly 2 quiz questions', () => {
    for (const lesson of TAX_LESSONS) {
      expect(lesson.quiz, lesson.id).toHaveLength(2)
    }
  })

  it('every quiz question has a valid correctIndex, non-empty choices, and an explanation', () => {
    for (const lesson of TAX_LESSONS) {
      for (const [i, q] of lesson.quiz.entries()) {
        const label = `${lesson.id} quiz[${i}]`
        expect(q.question.trim().length, label).toBeGreaterThan(0)
        expect(q.choices.length, label).toBeGreaterThanOrEqual(2)
        expect(q.correctIndex, label).toBeGreaterThanOrEqual(0)
        expect(q.correctIndex, label).toBeLessThan(q.choices.length)
        expect(q.explanation.trim().length, label).toBeGreaterThan(0)
      }
    }
  })

  it('every OX-format question has exactly the two OX choices', () => {
    for (const lesson of TAX_LESSONS) {
      for (const q of lesson.quiz) {
        if (q.format === 'ox') expect(q.choices, lesson.id).toEqual(['맞다', '아니다'])
      }
    }
  })
})

describe('TAX_LESSONS — 공식 출처와 메타데이터', () => {
  const sourceIds = new Set(LEARNING_SOURCES.map((s) => s.id))

  it('every lesson references at least one official source', () => {
    for (const lesson of TAX_LESSONS) {
      expect(lesson.meta.officialSourceIds.length, lesson.id).toBeGreaterThanOrEqual(1)
    }
  })

  it('every referenced source id actually exists in the LEARNING_SOURCES catalog(빈 출처·잘못된 참조 없음)', () => {
    for (const lesson of TAX_LESSONS) {
      for (const sourceId of lesson.meta.officialSourceIds) {
        expect(sourceIds.has(sourceId), `${lesson.id} -> source ${sourceId}`).toBe(true)
      }
    }
  })

  it('every referenced source has a well-formed https URL and an official publisher(개인 블로그·언론 기사가 아님)', () => {
    const OFFICIAL_PUBLISHERS = ['국세청', '행정안전부·지방자치단체', '법제처', '기획재정부', '금융위원회', '금융감독원', '국민연금공단']
    for (const lesson of TAX_LESSONS) {
      for (const sourceId of lesson.meta.officialSourceIds) {
        const source = LEARNING_SOURCES.find((s) => s.id === sourceId)
        expect(source, `${lesson.id} -> ${sourceId}`).toBeDefined()
        if (!source) continue
        expect(source.url.startsWith('https://'), `${lesson.id} -> ${sourceId} url`).toBe(true)
        expect(source.sourceType, `${lesson.id} -> ${sourceId}`).toBe('official')
        // 세금 학습이 참조하는 출처는 정부·공공기관이어야 한다(§4 "개인 블로그·카페·
        // 언론 기사·상업용 세무 서비스는 핵심 근거로 사용하지 마").
        const isKnownOfficial = OFFICIAL_PUBLISHERS.some((p) => source.publisher.includes(p.split('·')[0]))
        expect(isKnownOfficial, `${lesson.id} -> ${sourceId} publisher=${source.publisher}`).toBe(true)
      }
    }
  })

  it('every lesson has a non-empty baseYear and lastReviewedAt', () => {
    for (const lesson of TAX_LESSONS) {
      expect(lesson.meta.baseYear.trim().length, lesson.id).toBeGreaterThan(0)
      expect(lesson.meta.lastReviewedAt, lesson.id).toMatch(/^\d{4}\.\d{2}\.\d{2}$/)
    }
  })

  it('variableItems is always an array (may be empty when nothing in the lesson is year-sensitive)', () => {
    for (const lesson of TAX_LESSONS) {
      expect(Array.isArray(lesson.meta.variableItems), lesson.id).toBe(true)
    }
  })
})

describe('TAX_LEARNING_MODULES / TAX_LEARNING_CONTENTS — 진행 기록 엔진과의 연결', () => {
  it('has one shadow module and one shadow content item per lesson, all tagged with TAX_LEARNING_VERSION', () => {
    expect(TAX_LEARNING_MODULES).toHaveLength(25)
    expect(TAX_LEARNING_CONTENTS).toHaveLength(25)
    for (const module of TAX_LEARNING_MODULES) {
      expect(module.curriculumVersion, module.id).toBe(TAX_LEARNING_VERSION)
    }
  })

  it("every module's itemIds exactly matches its actual shadow content entry", () => {
    for (const module of TAX_LEARNING_MODULES) {
      const actualIds = TAX_LEARNING_CONTENTS.filter((c) => c.curriculumId === module.id).map((c) => c.id)
      expect(actualIds, module.id).toEqual(module.itemIds)
    }
  })

  it('every shadow module can actually reach completed(퀴즈 정답 여부와 무관하게 완료 처리가 가능해야 한다)', () => {
    for (const module of TAX_LEARNING_MODULES) {
      const contents = TAX_LEARNING_CONTENTS.filter((c) => c.curriculumId === module.id)
      expect(isModuleComplete(contents, module.itemIds), module.id).toBe(true)
    }
  })

  it('shadow module ids do not collide with other curricula id spaces(economic-history-*, life-economy-*)', () => {
    for (const module of TAX_LEARNING_MODULES) {
      expect(module.id.startsWith('tax-learning-')).toBe(true)
      expect(module.id.startsWith('history-')).toBe(false)
      expect(module.id.startsWith('life-economy-')).toBe(false)
    }
  })
})
