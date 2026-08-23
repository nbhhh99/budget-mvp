// 이번 달 돈 공부(월별 콘텐츠)용 로딩/오프라인/자료없음 상태 판정.
// briefingSelection.ts의 resolveBriefingView와 같은 규칙을 콘텐츠 타입만 제네릭으로 바꿔 재사용한다.

export type LearningContentViewState<T> =
  | { kind: 'loading' }
  | { kind: 'ready'; content: T }
  | { kind: 'offline_cached'; content: T }
  | { kind: 'no_data'; online: boolean }

export function resolveLearningContentView<T>(params: {
  online: boolean
  fetched: T | null
  cached: T | null
}): LearningContentViewState<T> {
  const { online, fetched, cached } = params
  if (fetched && online) return { kind: 'ready', content: fetched }
  if (fetched && !online) return { kind: 'offline_cached', content: fetched }
  if (cached) return { kind: 'offline_cached', content: cached }
  return { kind: 'no_data', online }
}
