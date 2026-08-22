// 분모가 없거나 0 이하이면 계산 불가로 간주해 null을 반환한다 (§14 0/미설정 처리 기준).
// null과 0을 구분해야 하므로 이 값은 절대 0으로 대체하지 않는다 — 호출부에서 "—"로 표시.
export function computeRate(
  numerator: number,
  denominator: number | null | undefined,
): number | null {
  if (denominator === null || denominator === undefined || denominator <= 0) {
    return null
  }
  return (numerator / denominator) * 100
}

export function percentChange(current: number, previous: number | null | undefined): number | null {
  if (previous === null || previous === undefined || previous === 0) {
    return null
  }
  return ((current - previous) / previous) * 100
}
