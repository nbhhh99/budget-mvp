// null은 "계산 불가"(계획 없음/분모 0) 상태를 뜻하므로 0%와 구분해 "—"로 표시한다 (§14).
export function formatPercent(value: number | null): string {
  if (value === null) return '—'
  return `${value.toFixed(1)}%`
}

export function formatSignedWon(amount: number): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : ''
  return `${sign}${Math.abs(amount).toLocaleString('ko-KR')}원`
}

// 차트 축 눈금처럼 좁은 공간에 쓰는 축약 표기 (예: 1,200,000 -> "120만").
export function formatCompactWon(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '−' : ''
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(1)}억`
  if (abs >= 10_000) return `${sign}${Math.round(abs / 10_000)}만`
  return `${sign}${abs.toLocaleString('ko-KR')}`
}
