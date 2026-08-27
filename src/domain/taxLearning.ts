import type { CurriculumProgress } from '../types/models'
import type { TaxLesson, TaxStage } from '../content/taxLearning'

// 생활 세금 공부는 §2 요구사항대로 잠금 해제 구조가 없다 — "모든 과정을 처음부터
// 자유롭게 선택 가능"해야 하므로, 차근차근 경제사/생활로 읽는 경제가 쓰는
// getUnlockedModuleIds 같은 순차 잠금 로직은 의도적으로 재사용하지 않는다. 여기
// 함수들은 순수하게 진행률 계산과 "이어서 학습하기" 추천만 담당한다.

export interface TaxProgressCount {
  completed: number
  total: number
}

function isLessonComplete(lessonId: string, progress: CurriculumProgress[]): boolean {
  return progress.some((p) => p.curriculumId === lessonId && p.status === 'completed')
}

export function computeOverallTaxProgress(lessons: TaxLesson[], progress: CurriculumProgress[]): TaxProgressCount {
  const completed = lessons.filter((lesson) => isLessonComplete(lesson.id, progress)).length
  return { completed, total: lessons.length }
}

export function computeStageProgress(
  stage: TaxStage,
  lessons: TaxLesson[],
  progress: CurriculumProgress[],
): TaxProgressCount {
  const stageLessons = lessons.filter((lesson) => lesson.stageId === stage.id)
  const completed = stageLessons.filter((lesson) => isLessonComplete(lesson.id, progress)).length
  return { completed, total: stageLessons.length }
}

// §2 "이어서 학습하기" — 순서(order)대로 훑어 아직 완료하지 않은 첫 과정을 추천한다.
// 잠금 상태와 무관하게 전부 열려 있으므로, 완료 여부만 본다. 모든 과정을 완료하면
// null(화면에서 "모두 완료" 메시지로 처리).
export function getNextIncompleteLesson(lessons: TaxLesson[], progress: CurriculumProgress[]): TaxLesson | null {
  const sorted = [...lessons].sort((a, b) => a.order - b.order)
  return sorted.find((lesson) => !isLessonComplete(lesson.id, progress)) ?? null
}

export function isTaxLessonComplete(lessonId: string, progress: CurriculumProgress[]): boolean {
  return isLessonComplete(lessonId, progress)
}

export interface AdjacentLessons {
  prev: TaxLesson | null
  next: TaxLesson | null
}

// 이전/다음 학습 이동(§7 14) — 첫 번째 학습은 prev가, 마지막 학습은 next가 항상
// null이라 화면에서 그 자리를 빈 칸으로 처리한다. order로 정렬하므로 배열에 실려
// 있는 순서와 무관하게 항상 올바른 이웃을 찾는다.
export function getAdjacentLessons(lessonId: string, lessons: TaxLesson[]): AdjacentLessons {
  const sorted = [...lessons].sort((a, b) => a.order - b.order)
  const index = sorted.findIndex((lesson) => lesson.id === lessonId)
  if (index === -1) return { prev: null, next: null }
  return {
    prev: index > 0 ? sorted[index - 1] : null,
    next: index < sorted.length - 1 ? sorted[index + 1] : null,
  }
}
