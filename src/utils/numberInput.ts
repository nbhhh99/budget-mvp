export function parseDigitsToNumber(raw: string): number {
  const digitsOnly = raw.replace(/[^0-9]/g, '')
  return digitsOnly === '' ? 0 : Number(digitsOnly)
}

// 계산기 화면의 금리·기간처럼 소수점과 음수가 필요한 입력을 안전하게 숫자로 바꾼다.
// 형식이 이상하면(예: 소수점 두 개) NaN 대신 0을 반환한다.
export function parseDecimalInput(raw: string): number {
  const cleaned = raw.replace(/[^0-9.-]/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}
