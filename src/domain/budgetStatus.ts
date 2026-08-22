import { computeRate } from './rate'

export type BudgetStatus = 'unset' | 'ok' | 'warning' | 'over'

export interface BudgetUsage {
  planAmount: number | null
  actualAmount: number
  diff: number | null // 계획 − 실제, 계획 없으면 null
  usageRatio: number | null // %, 계획 없으면 null
  status: BudgetStatus
}

const WARNING_THRESHOLD_PERCENT = 80
const OVER_THRESHOLD_PERCENT = 100

// 예산 소진율 = 실제 지출 ÷ 계획 예산 × 100 (계획 예산이 없거나 0이면 "unset", 계산하지 않음) (§14)
export function computeBudgetUsage(
  planAmount: number | undefined,
  actualAmount: number,
): BudgetUsage {
  if (planAmount === undefined || planAmount <= 0) {
    return { planAmount: null, actualAmount, diff: null, usageRatio: null, status: 'unset' }
  }

  const usageRatio = computeRate(actualAmount, planAmount)!
  const diff = planAmount - actualAmount

  let status: BudgetStatus = 'ok'
  if (usageRatio >= OVER_THRESHOLD_PERCENT) status = 'over'
  else if (usageRatio >= WARNING_THRESHOLD_PERCENT) status = 'warning'

  return { planAmount, actualAmount, diff, usageRatio, status }
}
