import { currentYearMonth, lastDateOfMonth, shiftYearMonth, yearMonthOf } from '../../utils/date'

export type StatsPeriod =
  | { type: 'month'; yearMonth: string }
  | { type: 'last3' }
  | { type: 'last6' }
  | { type: 'custom'; start: string; end: string }

export interface ResolvedPeriod {
  startDate: string
  endDate: string
  months: string[] // 포함된 연월, 오름차순
}

export function resolvePeriod(period: StatsPeriod): ResolvedPeriod {
  if (period.type === 'month') {
    return {
      startDate: `${period.yearMonth}-01`,
      endDate: lastDateOfMonth(period.yearMonth),
      months: [period.yearMonth],
    }
  }

  if (period.type === 'last3' || period.type === 'last6') {
    const count = period.type === 'last3' ? 3 : 6
    const current = currentYearMonth()
    const months = Array.from({ length: count }, (_, i) =>
      shiftYearMonth(current, -(count - 1 - i)),
    )
    return {
      startDate: `${months[0]}-01`,
      endDate: lastDateOfMonth(months[months.length - 1]),
      months,
    }
  }

  const startYm = yearMonthOf(period.start)
  const endYm = yearMonthOf(period.end)
  const months: string[] = []
  let cursor = startYm
  while (cursor <= endYm) {
    months.push(cursor)
    cursor = shiftYearMonth(cursor, 1)
  }
  return { startDate: period.start, endDate: period.end, months }
}
