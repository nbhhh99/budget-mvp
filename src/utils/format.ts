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

// 억/천만/만원 단위를 사람이 한눈에 읽기 쉽게 표기한다(예: 100,000,000 -> "1억원").
// 딱 떨어지지 않는 금액은 억 단위까지만 소수 첫째 자리로 반올림하고, 그보다 작은
// 금액은 쉼표 구분 원 단위 그대로 보여준다 — 재무 브리핑처럼 제도상 금액을
// 강조해 보여줘야 하는 곳에서 쓴다(§ 사용자 피드백: 숫자만 나열하면 가시성이 떨어짐).
export function formatKoreanWon(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '−' : ''
  if (abs >= 100_000_000) {
    const eok = abs / 100_000_000
    const rounded = Number.isInteger(eok) ? eok : Number(eok.toFixed(1))
    return `${sign}${rounded}억원`
  }
  if (abs >= 10_000_000 && abs % 10_000_000 === 0) {
    return `${sign}${abs / 10_000_000}천만원`
  }
  if (abs >= 10_000 && abs % 10_000 === 0) {
    return `${sign}${abs / 10_000}만원`
  }
  return `${sign}${abs.toLocaleString('ko-KR')}원`
}
