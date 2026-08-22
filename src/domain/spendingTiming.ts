import type { Transaction } from '../types/models'
import { filterByType } from './aggregate'

export interface DailyTotal {
  date: string
  amount: number
}

// 일별 지출 추이: 날짜순으로 정렬된 일별 합계 (지출이 없는 날은 포함하지 않음).
export function dailyExpenseTotals(transactions: Transaction[]): DailyTotal[] {
  const map = new Map<string, number>()
  for (const t of filterByType(transactions, 'expense')) {
    map.set(t.date, (map.get(t.date) ?? 0) + t.amount)
  }
  return [...map.entries()]
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// 날짜별 누적 지출 (같은 정렬 순서로 러닝 합계).
export function cumulativeExpenseTotals(daily: DailyTotal[]): DailyTotal[] {
  let running = 0
  return daily.map(({ date, amount }) => {
    running += amount
    return { date, amount: running }
  })
}

export function highestSpendingDay(daily: DailyTotal[]): DailyTotal | null {
  if (daily.length === 0) return null
  return daily.reduce((max, cur) => (cur.amount > max.amount ? cur : max), daily[0])
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export interface WeekdayAverage {
  weekday: number
  label: string
  average: number
  total: number
  dayCount: number
}

// 요일별 평균 지출 = 해당 요일 지출 합계 ÷ 기간 내 그 요일이 며칠 있었는지.
export function weekdayAverages(
  transactions: Transaction[],
  periodStart: string,
  periodEnd: string,
): WeekdayAverage[] {
  const totals = new Array(7).fill(0) as number[]
  for (const t of filterByType(transactions, 'expense')) {
    const [y, m, d] = t.date.split('-').map(Number)
    const weekday = new Date(y, m - 1, d).getDay()
    totals[weekday] += t.amount
  }

  const dayCounts = new Array(7).fill(0) as number[]
  const [sy, sm, sd] = periodStart.split('-').map(Number)
  const [ey, em, ed] = periodEnd.split('-').map(Number)
  const cursor = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)
  while (cursor <= end) {
    dayCounts[cursor.getDay()] += 1
    cursor.setDate(cursor.getDate() + 1)
  }

  return totals.map((total, weekday) => ({
    weekday,
    label: WEEKDAY_LABELS[weekday],
    total,
    dayCount: dayCounts[weekday],
    average: dayCounts[weekday] > 0 ? total / dayCounts[weekday] : 0,
  }))
}

export interface WeeklyTotal {
  week: number // 1주차부터 시작 (1~7일=1주차, 8~14일=2주차, ...)
  amount: number
}

// 주차별 지출: 달력 주가 아니라 일(day-of-month) 기준 7일 단위로 나눈다.
export function weeklyTotals(transactions: Transaction[]): WeeklyTotal[] {
  const map = new Map<number, number>()
  for (const t of filterByType(transactions, 'expense')) {
    const day = Number(t.date.slice(8, 10))
    const week = Math.ceil(day / 7)
    map.set(week, (map.get(week) ?? 0) + t.amount)
  }
  return [...map.entries()]
    .map(([week, amount]) => ({ week, amount }))
    .sort((a, b) => a.week - b.week)
}

export interface MonthPhaseTotals {
  early: number // 1~10일
  mid: number // 11~20일
  late: number // 21일~
}

export function monthPhaseTotals(transactions: Transaction[]): MonthPhaseTotals {
  const result: MonthPhaseTotals = { early: 0, mid: 0, late: 0 }
  for (const t of filterByType(transactions, 'expense')) {
    const day = Number(t.date.slice(8, 10))
    if (day <= 10) result.early += t.amount
    else if (day <= 20) result.mid += t.amount
    else result.late += t.amount
  }
  return result
}

export function largestSingleExpense(transactions: Transaction[]): Transaction | null {
  const expenses = filterByType(transactions, 'expense')
  if (expenses.length === 0) return null
  return expenses.reduce((max, cur) => (cur.amount > max.amount ? cur : max), expenses[0])
}

export interface FixedVariableRatio {
  fixed: number
  variable: number
  fixedPercentage: number | null
  variablePercentage: number | null
}

// 고정/변동 지출 비율: Category.isFixed로 사용자가 지정한 값을 기준으로 집계한다.
export function fixedVariableRatio(
  transactions: Transaction[],
  isFixedCategoryId: (categoryId: string) => boolean,
): FixedVariableRatio {
  let fixed = 0
  let variable = 0
  for (const t of filterByType(transactions, 'expense')) {
    if (isFixedCategoryId(t.categoryId)) fixed += t.amount
    else variable += t.amount
  }
  const total = fixed + variable
  return {
    fixed,
    variable,
    fixedPercentage: total > 0 ? (fixed / total) * 100 : null,
    variablePercentage: total > 0 ? (variable / total) * 100 : null,
  }
}

export interface BudgetPace {
  dayOfMonth: number
  totalDays: number
  expectedRatio: number // 오늘까지 지나간 날짜 비율 (%)
  actualUsageRatio: number | null // 실제 소진율 (%), 계획 없으면 null
  aheadOfPace: boolean | null // true면 예상보다 더 많이 쓴 상태
}

// 예산 소진 속도 = 오늘까지 지출이, 날짜가 지나간 비율만큼 고르게 썼다고 가정했을 때보다 빠른지 비교.
export function computeBudgetPace(
  actualExpenseSoFar: number,
  planExpenseTotal: number,
  dayOfMonth: number,
  totalDays: number,
): BudgetPace {
  const expectedRatio = (dayOfMonth / totalDays) * 100
  const actualUsageRatio =
    planExpenseTotal > 0 ? (actualExpenseSoFar / planExpenseTotal) * 100 : null
  return {
    dayOfMonth,
    totalDays,
    expectedRatio,
    actualUsageRatio,
    aheadOfPace: actualUsageRatio === null ? null : actualUsageRatio > expectedRatio,
  }
}
