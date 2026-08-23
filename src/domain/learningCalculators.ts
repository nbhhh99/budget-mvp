import { computeRate } from './rate'

// 계산기는 전부 "가정에 따른 예시"이지 예측이나 보장이 아니다. 화면에서
// 반드시 "계산 결과는 입력한 가정에 따른 예시이며 실제 수익이나 미래 결과를
// 보장하지 않습니다" 안내를 함께 보여준다.
function safeRound(n: number): number {
  return Number.isFinite(n) ? Math.round(n) : 0
}

// ── 복리 계산기 ──────────────────────────────────────────────────

export interface CompoundInterestInput {
  initialAmount: number
  monthlyContribution: number
  months: number
  annualRatePercent: number
}

export interface CompoundInterestYearPoint {
  year: number
  principal: number
  balance: number
}

export interface CompoundInterestResult {
  totalPrincipal: number
  assumedGain: number
  projectedTotal: number
  yearly: CompoundInterestYearPoint[]
}

export function computeCompoundInterest(input: CompoundInterestInput): CompoundInterestResult {
  const initialAmount = Math.max(0, input.initialAmount || 0)
  const monthlyContribution = Math.max(0, input.monthlyContribution || 0)
  const months = Math.max(0, Math.floor(input.months || 0))
  const monthlyRate = (input.annualRatePercent || 0) / 100 / 12

  let balance = initialAmount
  const yearly: CompoundInterestYearPoint[] = []
  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + monthlyRate) + monthlyContribution
    if (m % 12 === 0 || m === months) {
      const principalSoFar = initialAmount + monthlyContribution * m
      yearly.push({
        year: Math.ceil(m / 12),
        principal: safeRound(principalSoFar),
        balance: safeRound(balance),
      })
    }
  }

  const totalPrincipal = initialAmount + monthlyContribution * months
  const projectedTotal = months === 0 ? initialAmount : balance
  return {
    totalPrincipal: safeRound(totalPrincipal),
    assumedGain: safeRound(projectedTotal - totalPrincipal),
    projectedTotal: safeRound(projectedTotal),
    yearly,
  }
}

// ── 물가 반영 계산기 ─────────────────────────────────────────────
// futureNominalCost: 지금과 같은 구매력을 유지하려면 미래에 필요한 명목금액
// realValueOfHoldingCash: 지금 금액을 그대로 현금으로 들고 있을 때, years 후 오늘 기준 실질가치
// purchasingPowerLost: currentAmount - realValueOfHoldingCash (물가로 감소한 구매력)

export interface InflationAdjustedInput {
  currentAmount: number
  years: number
  annualInflationRatePercent: number
}

export interface InflationAdjustedResult {
  futureNominalCost: number
  realValueOfHoldingCash: number
  purchasingPowerLost: number
}

export function computeInflationAdjustedValue(
  input: InflationAdjustedInput,
): InflationAdjustedResult {
  const currentAmount = Math.max(0, input.currentAmount || 0)
  const years = Math.max(0, input.years || 0)
  const rate = (input.annualInflationRatePercent || 0) / 100
  const factor = Math.pow(1 + rate, years)

  const futureNominalCost = currentAmount * factor
  const realValueOfHoldingCash = factor === 0 ? currentAmount : currentAmount / factor

  return {
    futureNominalCost: safeRound(futureNominalCost),
    realValueOfHoldingCash: safeRound(realValueOfHoldingCash),
    purchasingPowerLost: safeRound(currentAmount - realValueOfHoldingCash),
  }
}

// ── 목표저축 계산기 ──────────────────────────────────────────────

export interface GoalSavingsInput {
  goalAmount: number
  currentAmount: number
  months: number
  annualRatePercent: number
}

export interface GoalSavingsResult {
  // null이면 이 기간 안에는 계산할 수 없음(예: 기간이 0개월인데 아직 목표 미달)
  monthlyRequiredSaving: number | null
  totalContribution: number // 저축 기간 동안 납입할 원금 총액(현재 보유액 제외)
  assumedGain: number // 목표금액 − 현재 보유액 − 납입원금 (가정 수익분)
  alreadyAchieved: boolean // 현재 보유액의 성장만으로 이미 목표 달성 가능
}

export function computeGoalSavings(input: GoalSavingsInput): GoalSavingsResult {
  const goalAmount = Math.max(0, input.goalAmount || 0)
  const currentAmount = Math.max(0, input.currentAmount || 0)
  const months = Math.max(0, Math.floor(input.months || 0))
  const monthlyRate = (input.annualRatePercent || 0) / 100 / 12

  const currentGrown = currentAmount * Math.pow(1 + monthlyRate, months)
  const neededFromContributions = goalAmount - currentGrown

  if (neededFromContributions <= 0) {
    return {
      monthlyRequiredSaving: 0,
      totalContribution: 0,
      assumedGain: safeRound(goalAmount - currentAmount),
      alreadyAchieved: true,
    }
  }

  if (months === 0) {
    // 목표에 못 미쳤는데 남은 기간이 없으면 이 기간으로는 계산할 수 없다.
    return {
      monthlyRequiredSaving: null,
      totalContribution: 0,
      assumedGain: 0,
      alreadyAchieved: false,
    }
  }

  const monthlyRequiredSaving =
    monthlyRate === 0
      ? neededFromContributions / months
      : (neededFromContributions * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1)

  const totalContribution = monthlyRequiredSaving * months
  const assumedGain = goalAmount - currentAmount - totalContribution

  return {
    monthlyRequiredSaving: safeRound(monthlyRequiredSaving),
    totalContribution: safeRound(totalContribution),
    assumedGain: safeRound(assumedGain),
    alreadyAchieved: false,
  }
}

// ── 저축률 계산기 ────────────────────────────────────────────────
// domain/rate.ts의 computeRate를 그대로 재사용한다 (분모 0/미설정 시 null, §14 원칙과 동일).

export interface SavingsRateInput {
  monthlyIncome: number
  monthlySaving: number
  monthlyDebtPrincipalPayment?: number
}

export interface SavingsRateResult {
  savingsRatePercent: number | null
  savingsAndDebtAmount: number
}

export function computeSavingsRate(input: SavingsRateInput): SavingsRateResult {
  const monthlyIncome = Math.max(0, input.monthlyIncome || 0)
  const monthlySaving = Math.max(0, input.monthlySaving || 0)
  const monthlyDebtPrincipalPayment = Math.max(0, input.monthlyDebtPrincipalPayment || 0)
  const savingsAndDebtAmount = monthlySaving + monthlyDebtPrincipalPayment

  return {
    savingsRatePercent: computeRate(savingsAndDebtAmount, monthlyIncome),
    savingsAndDebtAmount,
  }
}
