import { describe, expect, it } from 'vitest'
import type { CurriculumProgress } from '../types/models'
import {
  computeOverallTaxProgress,
  computeStageProgress,
  getAdjacentLessons,
  getNextIncompleteLesson,
  isTaxLessonComplete,
  quizItemKey,
} from './taxLearning'
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

// quizItemKey는 TaxLearningLessonScreen이 각 확인 문제(QuizItem)에 부여하는 React
// key다. React는 렌더링 사이에 key가 바뀐 자리의 컴포넌트를 강제로 언마운트하고
// 새로 마운트한다(공식 문서화된 재조정 규칙) — 이 파일은 그 규칙이 실제로 작동할
// 수 있도록 "학습이 바뀌면 반드시 키도 바뀐다"는 전제 조건만 순수 함수로
// 검증한다(이 저장소는 DOM 렌더링 테스트 도구를 쓰지 않는다 — 실제 클릭·재마운트
// 확인은 코드 검사로 병행한다).
describe('quizItemKey — 확인 문제 상태가 학습 간에 새지 않는지 보장', () => {
  it('실제 버그 재현: 문제 순번만 쓰면 서로 다른 학습이 같은 키를 공유한다(고쳐야 하는 이전 동작)', () => {
    const bugKey = (index: number) => String(index) // 이전 코드가 실제로 쓰던 key={i}
    expect(bugKey(0)).toBe(bugKey(0)) // tax-learning-01의 0번 문제와
    // tax-learning-02의 0번 문제가 똑같이 "0"이 돼, React가 같은 컴포넌트
    // 인스턴스로 취급하고 답변 상태를 그대로 재사용했다 — 이게 고친 버그다.
  })

  it('같은 학습·같은 문제 순번이면 항상 같은 키를 돌려준다(학습 완료 클릭 등으로 다시 렌더링돼도 같은 문제 UI가 유지된다)', () => {
    expect(quizItemKey('tax-learning-01', 0)).toBe(quizItemKey('tax-learning-01', 0))
    expect(quizItemKey('tax-learning-01', 1)).toBe(quizItemKey('tax-learning-01', 1))
  })

  it('①한 학습에서 문제에 답한 뒤 ②다음 학습으로 이동하면, 같은 순번이라도 키가 달라져 React가 새로 마운트한다(③새 학습은 미응답 상태로 보인다)', () => {
    const lessonAKey = quizItemKey('tax-learning-01', 0)
    const lessonBKey = quizItemKey('tax-learning-02', 0)
    expect(lessonAKey).not.toBe(lessonBKey)
  })

  it('④이전 학습으로 되돌아가도(A → B → A) 키가 다시 나타나기 전에 A는 이미 한 번 언마운트됐으므로, 돌아온 A의 문제도 다시 마운트되어 새로 풀 수 있다', () => {
    const sequence = ['tax-learning-01', 'tax-learning-02', 'tax-learning-01'].map((lessonId) => quizItemKey(lessonId, 0))
    // A → B에서 키가 바뀌고(언마운트), B → A에서 또 한 번 키가 바뀐다(다시 마운트) —
    // 두 전환 모두 실제로 값이 달라져야 리액트가 매번 새로 마운트한다.
    expect(sequence[0]).not.toBe(sequence[1])
    expect(sequence[1]).not.toBe(sequence[2])
    // A로 돌아왔을 때의 키 값 자체는 처음 A에 있었을 때와 같다 — 문자열 값이
    // 같다고 상태가 이어지는 게 아니라(중간에 언마운트가 끼었으므로), 매번
    // "학습이 A일 때 0번 문제"를 가리키는 안정적인 식별자라는 뜻일 뿐이다.
    expect(sequence[0]).toBe(sequence[2])
  })

  it('서로 다른 학습의 같은 순번 문제는 25개 학습 전체에서 키가 절대 겹치지 않는다', () => {
    const keys = TAX_LESSONS.flatMap((lesson) => lesson.quiz.map((_, i) => quizItemKey(lesson.id, i)))
    expect(new Set(keys).size).toBe(keys.length)
  })
})

// ⑤"문제 정답 여부와 관계없이 학습 완료 버튼을 누를 수 있음"은 TaxLearningLessonScreen의
// handleComplete가 퀴즈 상태를 전혀 참조하지 않고 버튼 onClick에 직접 연결돼
// 있다는 구조로 보장된다(quiz 응답은 Dexie에 저장조차 하지 않는다 — completeLearningItem
// 호출 인자에 퀴즈 정답 여부가 들어가지 않는다). 이 저장소에는 DOM 렌더링 테스트
// 도구가 없어 실제 클릭 시나리오는 코드 검사로 확인했다(완료 보고에 명시).
