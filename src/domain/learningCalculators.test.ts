import { describe, expect, it } from 'vitest'
import {
  computeCompoundInterest,
  computeGoalSavings,
  computeInflationAdjustedValue,
  computeSavingsRate,
} from './learningCalculators'

describe('computeCompoundInterest', () => {
  it('grows a lump sum with no contributions at a fixed annual rate', () => {
    const result = computeCompoundInterest({
      initialAmount: 1_000_000,
      monthlyContribution: 0,
      months: 12,
      annualRatePercent: 12, // 1%/월 근사
    })
    expect(result.totalPrincipal).toBe(1_000_000)
    expect(result.projectedTotal).toBeGreaterThan(1_000_000)
    expect(result.assumedGain).toBe(result.projectedTotal - result.totalPrincipal)
  })

  it('with 0% rate, the projected total equals the principal exactly (no growth)', () => {
    const result = computeCompoundInterest({
      initialAmount: 500_000,
      monthlyContribution: 100_000,
      months: 6,
      annualRatePercent: 0,
    })
    expect(result.projectedTotal).toBe(result.totalPrincipal)
    expect(result.assumedGain).toBe(0)
  })

  it('handles zero months by returning the initial amount untouched', () => {
    const result = computeCompoundInterest({
      initialAmount: 300_000,
      monthlyContribution: 50_000,
      months: 0,
      annualRatePercent: 5,
    })
    expect(result.projectedTotal).toBe(300_000)
    expect(result.totalPrincipal).toBe(300_000)
    expect(result.yearly).toEqual([])
  })

  it('clamps negative initial/contribution amounts to zero instead of producing negative principal', () => {
    const result = computeCompoundInterest({
      initialAmount: -1000,
      monthlyContribution: -500,
      months: 12,
      annualRatePercent: 5,
    })
    expect(result.totalPrincipal).toBe(0)
    expect(result.projectedTotal).toBe(0)
  })

  it('handles a very large amount without overflowing to a non-finite result', () => {
    const result = computeCompoundInterest({
      initialAmount: 1_000_000_000_000,
      monthlyContribution: 0,
      months: 12,
      annualRatePercent: 5,
    })
    expect(Number.isFinite(result.projectedTotal)).toBe(true)
    expect(Number.isFinite(result.totalPrincipal)).toBe(true)
  })

  it('produces one yearly point per full year plus a final point for a partial last year', () => {
    const result = computeCompoundInterest({
      initialAmount: 0,
      monthlyContribution: 10_000,
      months: 18,
      annualRatePercent: 0,
    })
    expect(result.yearly.map((y) => y.year)).toEqual([1, 2])
    expect(result.yearly[1].principal).toBe(180_000)
  })
})

describe('computeInflationAdjustedValue', () => {
  it('with 0 years, nothing changes', () => {
    const result = computeInflationAdjustedValue({
      currentAmount: 1_000_000,
      years: 0,
      annualInflationRatePercent: 3,
    })
    expect(result.futureNominalCost).toBe(1_000_000)
    expect(result.realValueOfHoldingCash).toBe(1_000_000)
    expect(result.purchasingPowerLost).toBe(0)
  })

  it('with 0% inflation, nothing erodes over time', () => {
    const result = computeInflationAdjustedValue({
      currentAmount: 1_000_000,
      years: 10,
      annualInflationRatePercent: 0,
    })
    expect(result.futureNominalCost).toBe(1_000_000)
    expect(result.realValueOfHoldingCash).toBe(1_000_000)
    expect(result.purchasingPowerLost).toBe(0)
  })

  it('positive inflation erodes the real value of cash held over time', () => {
    const result = computeInflationAdjustedValue({
      currentAmount: 1_000_000,
      years: 10,
      annualInflationRatePercent: 3,
    })
    expect(result.realValueOfHoldingCash).toBeLessThan(1_000_000)
    expect(result.futureNominalCost).toBeGreaterThan(1_000_000)
    expect(result.purchasingPowerLost).toBeGreaterThan(0)
  })

  it('clamps a negative current amount to zero', () => {
    const result = computeInflationAdjustedValue({
      currentAmount: -500,
      years: 5,
      annualInflationRatePercent: 3,
    })
    expect(result.futureNominalCost).toBe(0)
    expect(result.realValueOfHoldingCash).toBe(0)
  })

  it('handles an extreme -100% inflation rate without dividing by zero', () => {
    const result = computeInflationAdjustedValue({
      currentAmount: 1_000_000,
      years: 5,
      annualInflationRatePercent: -100,
    })
    expect(Number.isFinite(result.realValueOfHoldingCash)).toBe(true)
    expect(Number.isFinite(result.futureNominalCost)).toBe(true)
  })

  it('handles a very large amount and a long horizon without overflow crashing the result', () => {
    const result = computeInflationAdjustedValue({
      currentAmount: 1_000_000_000_000,
      years: 100,
      annualInflationRatePercent: 20,
    })
    expect(Number.isFinite(result.futureNominalCost)).toBe(true)
    expect(Number.isFinite(result.realValueOfHoldingCash)).toBe(true)
    expect(Number.isFinite(result.purchasingPowerLost)).toBe(true)
  })
})

describe('computeGoalSavings', () => {
  it('computes a positive monthly required saving for an achievable goal', () => {
    const result = computeGoalSavings({
      goalAmount: 12_000_000,
      currentAmount: 0,
      months: 12,
      annualRatePercent: 0,
    })
    expect(result.alreadyAchieved).toBe(false)
    expect(result.monthlyRequiredSaving).toBe(1_000_000)
    expect(result.totalContribution).toBe(12_000_000)
  })

  it('reports already achieved when current holdings alone reach the goal', () => {
    const result = computeGoalSavings({
      goalAmount: 1_000_000,
      currentAmount: 5_000_000,
      months: 12,
      annualRatePercent: 0,
    })
    expect(result.alreadyAchieved).toBe(true)
    expect(result.monthlyRequiredSaving).toBe(0)
  })

  it('returns null (not NaN/Infinity) when the period is zero months and the goal is not yet met', () => {
    const result = computeGoalSavings({
      goalAmount: 10_000_000,
      currentAmount: 0,
      months: 0,
      annualRatePercent: 5,
    })
    expect(result.monthlyRequiredSaving).toBeNull()
    expect(result.alreadyAchieved).toBe(false)
  })

  it('handles a zero goal amount as already achieved', () => {
    const result = computeGoalSavings({
      goalAmount: 0,
      currentAmount: 0,
      months: 12,
      annualRatePercent: 5,
    })
    expect(result.alreadyAchieved).toBe(true)
  })

  it('clamps a negative goal/current amount to zero rather than producing a negative requirement', () => {
    const result = computeGoalSavings({
      goalAmount: -1000,
      currentAmount: -1000,
      months: 12,
      annualRatePercent: 5,
    })
    expect(result.alreadyAchieved).toBe(true)
  })

  it('accounts for assumed growth when a positive rate is given', () => {
    const noGrowth = computeGoalSavings({
      goalAmount: 12_000_000,
      currentAmount: 0,
      months: 12,
      annualRatePercent: 0,
    })
    const withGrowth = computeGoalSavings({
      goalAmount: 12_000_000,
      currentAmount: 0,
      months: 12,
      annualRatePercent: 6,
    })
    expect(withGrowth.monthlyRequiredSaving).toBeLessThan(noGrowth.monthlyRequiredSaving ?? 0)
  })
})

describe('computeSavingsRate', () => {
  it('computes a straightforward savings rate', () => {
    const result = computeSavingsRate({ monthlyIncome: 4_000_000, monthlySaving: 1_000_000 })
    expect(result.savingsRatePercent).toBe(25)
  })

  it('includes optional debt principal repayment in the numerator when given', () => {
    const result = computeSavingsRate({
      monthlyIncome: 4_000_000,
      monthlySaving: 500_000,
      monthlyDebtPrincipalPayment: 500_000,
    })
    expect(result.savingsRatePercent).toBe(25)
    expect(result.savingsAndDebtAmount).toBe(1_000_000)
  })

  it('returns null (not divide-by-zero) when monthly income is zero', () => {
    const result = computeSavingsRate({ monthlyIncome: 0, monthlySaving: 500_000 })
    expect(result.savingsRatePercent).toBeNull()
  })

  it('clamps negative saving/income inputs to zero', () => {
    const result = computeSavingsRate({ monthlyIncome: -100, monthlySaving: -50 })
    expect(result.savingsRatePercent).toBeNull()
  })
})
