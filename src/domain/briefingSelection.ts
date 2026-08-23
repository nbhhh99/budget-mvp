import type { FinancialBriefing } from '../types/models'

// yearMonth/status만 있으면 되는 최소 형태 — BriefingIndexEntry와 MonthlyLessonIndexEntry가
// 둘 다 구조적으로 이 타입을 만족해서, 이번 달 돈 공부의 월 선택에도 그대로 재사용한다.
interface YearMonthStatusEntry {
  yearMonth: string
  status: 'draft' | 'reviewed'
}

// §10: 기본 화면에는 reviewed 상태의 데이터만 표시한다.
export function listReviewedYearMonths(entries: YearMonthStatusEntry[]): string[] {
  return entries
    .filter((e) => e.status === 'reviewed')
    .map((e) => e.yearMonth)
    .sort()
    .reverse()
}

export function computeLatestReviewedYearMonth(entries: YearMonthStatusEntry[]): string | null {
  const months = listReviewedYearMonths(entries)
  return months.length > 0 ? months[0] : null
}

export function getPreviousReviewedYearMonth(
  entries: YearMonthStatusEntry[],
  currentYearMonth: string,
): string | null {
  const months = listReviewedYearMonths(entries) // 최신순
  const idx = months.indexOf(currentYearMonth)
  if (idx === -1) return null
  return months[idx + 1] ?? null
}

export type BriefingViewState =
  | { kind: 'loading' }
  | { kind: 'ready'; briefing: FinancialBriefing; skippedItemCount: number }
  | { kind: 'offline_cached'; briefing: FinancialBriefing }
  | { kind: 'no_data'; online: boolean }

// §6 상태 화면: 로딩/최신자료없음/오프라인/마지막 저장본/일부만 로드를 하나의
// 순수 함수로 정리해 컴포넌트에서는 분기만 렌더링하면 되게 한다.
export function resolveBriefingView(params: {
  online: boolean
  fetched: FinancialBriefing | null
  skippedItemCount?: number
  cached: FinancialBriefing | null
}): BriefingViewState {
  const { online, fetched, cached, skippedItemCount = 0 } = params
  // 오프라인일 때 fetch()가 성공했다면(서비스워커 프리캐시가 대신 응답한 경우 등)
  // 실제로는 마지막 저장본을 보여주는 것이므로 "최신"이 아니라 "오프라인 저장본"으로
  // 표시한다.
  if (fetched && online) return { kind: 'ready', briefing: fetched, skippedItemCount }
  if (fetched && !online) return { kind: 'offline_cached', briefing: fetched }
  if (cached) return { kind: 'offline_cached', briefing: cached }
  return { kind: 'no_data', online }
}
