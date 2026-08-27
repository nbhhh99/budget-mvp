import type { CurriculumModule, CurriculumProgress, LearningContent } from '../types/models'

// §6: 필수 항목 id가 하나도 없으면(준비 중 과정) 자동 완료 처리하지 않는다.
export function isModuleComplete(contents: LearningContent[], completedItemIds: string[]): boolean {
  const requiredIds = contents.filter((item) => item.required).map((item) => item.id)
  return requiredIds.length > 0 && requiredIds.every((id) => completedItemIds.includes(id))
}

export interface ModuleProgressCount {
  completed: number
  total: number
}

// 진행률은 항상 이 값에서 계산하고(완료 필수 항목 수 / 전체 필수 항목 수), 별도의
// 퍼센트 값을 저장하지 않는다(§5).
export function computeModuleProgress(
  contents: LearningContent[],
  completedItemIds: string[],
): ModuleProgressCount {
  const required = contents.filter((item) => item.required)
  const completed = required.filter((item) => completedItemIds.includes(item.id)).length
  return { completed, total: required.length }
}

export type ModuleUiStatus = 'available' | 'in_progress' | 'completed' | 'unavailable'

// 화면에 표시할 상태만 계산하는 순수 함수 — 순차 잠금 없이 모든 과정을 처음부터
// 자유롭게 선택할 수 있다(과거에는 이전 과정을 완료해야 다음이 열리는 잠금 구조가
// 있었지만 제거했다). 콘텐츠가 없는(준비 중) 과정만 예외로 'unavailable'을
// 반환한다 — 잠긴 게 아니라 아직 검증된 콘텐츠 자체가 없어서다.
export function getModuleUiStatus(
  module: CurriculumModule,
  progressByCurriculumId: Map<string, CurriculumProgress>,
): ModuleUiStatus {
  if (module.itemIds.length === 0) return 'unavailable'
  const progress = progressByCurriculumId.get(module.id)
  if (progress?.status === 'completed') return 'completed'
  if (progress?.status === 'in_progress') return 'in_progress'
  return 'available'
}

export interface RecommendedModule {
  module: CurriculumModule
  status: 'not_started' | 'in_progress'
}

// §8: 완료되지 않은 첫 번째 과정을 추천한다. 자산 구성이나 수익률로 임의로
// 고르지 않는다. 모든 과정이 완료되면 null(화면에서 전체 완료 메시지 표시).
// 콘텐츠가 없는 "준비 중" 과정은 추천하지 않는다(추천해도 학습을 시작할 수 없음).
// 잠금 여부와 무관하게 순서(order)만 본다 — 순차 잠금이 없어졌어도 "다음 학습"
// 추천 자체는 여전히 순서대로 안내하는 게 자연스럽다.
export function getRecommendedModule(
  curriculum: CurriculumModule[],
  progress: CurriculumProgress[],
): RecommendedModule | null {
  const sorted = [...curriculum].sort((a, b) => a.order - b.order)
  const progressByCurriculumId = new Map(progress.map((p) => [p.curriculumId, p]))

  for (const module of sorted) {
    if (module.itemIds.length === 0) continue
    const moduleProgress = progressByCurriculumId.get(module.id)
    if (moduleProgress?.status === 'completed') continue
    return { module, status: moduleProgress?.status === 'in_progress' ? 'in_progress' : 'not_started' }
  }

  return null
}
