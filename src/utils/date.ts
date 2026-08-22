// 모든 날짜/시간은 UTC 변환 없이 KST 로컬 값을 그대로 문자열로 다룬다 (§20).

export function todayDateString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function nowTimeString(): string {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  return `${h}:${min}`
}

export function currentYearMonth(): string {
  return todayDateString().slice(0, 7)
}

export function yearMonthOf(dateString: string): string {
  return dateString.slice(0, 7)
}

export function shiftYearMonth(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split('-').map(Number)
  const date = new Date(y, m - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function daysInMonth(yearMonth: string): number {
  const [y, m] = yearMonth.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function lastDateOfMonth(yearMonth: string): string {
  return `${yearMonth}-${String(daysInMonth(yearMonth)).padStart(2, '0')}`
}

export function formatKoreanYearMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split('-')
  return `${y}년 ${Number(m)}월`
}

export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function formatDateWithWeekday(dateString: string): string {
  const [y, m, d] = dateString.split('-').map(Number)
  const date = new Date(y, m - 1, d) // 문자열 파싱 시 UTC 취급되는 것을 피하기 위해 로컬 구성요소로 직접 생성
  return `${m}월 ${d}일 (${WEEKDAYS[date.getDay()]})`
}
