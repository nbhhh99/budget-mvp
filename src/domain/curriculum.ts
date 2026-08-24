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

// §7: 진행 기록이 없으면 첫 과정만 열리고, 완료한 과정 다음 과정까지만 열린다.
// 날짜·경과 기간은 전혀 쓰지 않는다.
//
// 예외: itemIds가 비어 있는 "준비 중" 과정(§14 — 검증된 콘텐츠가 아직 없어 완료가
// 구조적으로 불가능한 과정)은 잠금 해제 기준에서 건너뛴다. 그렇지 않으면 이 과정이
// 중간에 있을 때 완료가 영원히 불가능해서 그 뒤의 모든(콘텐츠가 준비된) 과정까지
// 영구히 잠기게 된다. 준비 중 과정 자체는 계속 목록에 노출되고 "준비 중"으로
// 표시되며, 콘텐츠가 채워지면 자연스럽게 일반 과정처럼 완료 조건이 적용된다.
export function getUnlockedModuleIds(
  curriculum: CurriculumModule[],
  progress: CurriculumProgress[],
): string[] {
  const sorted = [...curriculum].sort((a, b) => a.order - b.order)

  const completedIds = new Set(
    progress.filter((item) => item.status === 'completed').map((item) => item.curriculumId),
  )

  const unlocked: string[] = []

  for (const module of sorted) {
    unlocked.push(module.id)
    const isPlaceholder = module.itemIds.length === 0
    if (!completedIds.has(module.id) && !isPlaceholder) {
      break
    }
  }

  return unlocked
}

export type ModuleUiStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'unavailable'

// 화면에 표시할 상태만 계산하는 순수 함수 — 색상에만 의존하지 않고 텍스트로도
// 구분할 수 있도록(§12) 별도 라벨은 화면 쪽에서 이 값에 매핑한다. 콘텐츠가 없는
// 과정은 잠금 여부와 무관하게 항상 'unavailable'(준비 중)로 표시한다.
export function getModuleUiStatus(
  module: CurriculumModule,
  unlockedModuleIds: string[],
  progressByCurriculumId: Map<string, CurriculumProgress>,
): ModuleUiStatus {
  if (module.itemIds.length === 0) return 'unavailable'
  const progress = progressByCurriculumId.get(module.id)
  if (progress?.status === 'completed') return 'completed'
  if (!unlockedModuleIds.includes(module.id)) return 'locked'
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
