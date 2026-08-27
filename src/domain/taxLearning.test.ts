import { describe, expect, it } from 'vitest'
import type { CurriculumProgress } from '../types/models'
import { computeOverallTaxProgress, computeStageProgress, getAdjacentLessons, getNextIncompleteLesson, isTaxLessonComplete } from './taxLearning'
import { TAX_LESSONS, TAX_STAGES } from '../content/taxLearning'

function progress(curriculumId: string, status: CurriculumProgress['status'] = 'completed'): CurriculumProgress {
  return { curriculumId, status, completedItemIds: [`${curriculumId}-complete`], curriculumVersion: 'tax-learning-v1' }
}

describe('computeOverallTaxProgress', () => {
  it('returns 0/25 when nothing is completed', () => {
    expect(computeOverallTaxProgress(TAX_LESSONS, [])).toEqual({ completed: 0, total: 25 })
  })

  it('counts only lessons with status completed', () => {
    const result = computeOverallTaxProgress(TAX_LESSONS, [
      progress('tax-learning-01', 'completed'),
      progress('tax-learning-02', 'in_progress'), // 완료가 아니라 세면 안 된다
    ])
    expect(result).toEqual({ completed: 1, total: 25 })
  })

  it('ignores progress records from other curricula(다른 커리큘럼 진행 기록과 섞이지 않는다)', () => {
    const result = computeOverallTaxProgress(TAX_LESSONS, [
      { curriculumId: 'life-economy-intro', status: 'completed', completedItemIds: [], curriculumVersion: 'real-life-economy-v1' },
    ])
    expect(result).toEqual({ completed: 0, total: 25 })
  })
})

describe('computeStageProgress', () => {
  it('counts only lessons that belong to the given stage', () => {
    const stage1 = TAX_STAGES.find((s) => s.id === 'stage-basics')!
    expect(stage1.lessonIds).toHaveLength(6)
    const result = computeStageProgress(stage1, TAX_LESSONS, [progress('tax-learning-01'), progress('tax-learning-07')])
    // tax-learning-07은 stage-employee 소속이라 1단계 진행률에 반영되면 안 된다.
    expect(result).toEqual({ completed: 1, total: 6 })
  })
})

describe('getNextIncompleteLesson', () => {
  it('recommends the first lesson when nothing has been completed', () => {
    const next = getNextIncompleteLesson(TAX_LESSONS, [])
    expect(next?.id).toBe('tax-learning-01')
  })

  it('recommends the first incomplete lesson in order, skipping completed ones', () => {
    const next = getNextIncompleteLesson(TAX_LESSONS, [progress('tax-learning-01'), progress('tax-learning-02')])
    expect(next?.id).toBe('tax-learning-03')
  })

  it('does not require completing lessons in order — a later lesson can be done first', () => {
    // §2 "모든 과정을 처음부터 자유롭게 선택 가능" — 25번을 먼저 끝내도 1번이 추천된다.
    const next = getNextIncompleteLesson(TAX_LESSONS, [progress('tax-learning-25')])
    expect(next?.id).toBe('tax-learning-01')
  })

  it('returns null once all 25 lessons are completed', () => {
    const all = TAX_LESSONS.map((lesson) => progress(lesson.id))
    expect(getNextIncompleteLesson(TAX_LESSONS, all)).toBeNull()
  })
})

describe('isTaxLessonComplete', () => {
  it('is false with no progress records', () => {
    expect(isTaxLessonComplete('tax-learning-01', [])).toBe(false)
  })

  it('is true once completed, and reflects re-study without losing completion', () => {
    const records = [progress('tax-learning-01')]
    expect(isTaxLessonComplete('tax-learning-01', records)).toBe(true)
  })

  it('is false when status is in_progress rather than completed', () => {
    expect(isTaxLessonComplete('tax-learning-01', [progress('tax-learning-01', 'in_progress')])).toBe(false)
  })
})

describe('getAdjacentLessons', () => {
  it('the first lesson(order 1) has no prev — the prev button slot is empty', () => {
    const { prev, next } = getAdjacentLessons('tax-learning-01', TAX_LESSONS)
    expect(prev).toBeNull()
    expect(next?.id).toBe('tax-learning-02')
  })

  it('the last lesson(order 25) has no next — the next button slot is empty', () => {
    const { prev, next } = getAdjacentLessons('tax-learning-25', TAX_LESSONS)
    expect(prev?.id).toBe('tax-learning-24')
    expect(next).toBeNull()
  })

  it('a middle lesson has both neighbors, matching global order across stage boundaries', () => {
    // tax-learning-06(1단계 마지막)과 tax-learning-07(2단계 첫 학습) 사이 이동 —
    // 단계가 달라도 order로 이어져야 한다.
    expect(getAdjacentLessons('tax-learning-06', TAX_LESSONS).next?.id).toBe('tax-learning-07')
    expect(getAdjacentLessons('tax-learning-07', TAX_LESSONS).prev?.id).toBe('tax-learning-06')
  })

  it('returns nulls for an unknown lesson id', () => {
    expect(getAdjacentLessons('does-not-exist', TAX_LESSONS)).toEqual({ prev: null, next: null })
  })
})
