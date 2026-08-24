import { useState } from 'react'
import { computeGoalSavings } from '../../../domain'
import { formatWon } from '../../../utils/date'
import { NumberField } from './NumberField'
import { CalculatorDisclaimer } from './CalculatorDisclaimer'
import { useCalculatorCompletion } from './useCalculatorCompletion'

const DEFAULTS = { goalAmount: 30_000_000, currentAmount: 5_000_000, months: 24, annualRatePercent: 4 }

export function GoalSavingsCalculator() {
  const [goalAmount, setGoalAmount] = useState(DEFAULTS.goalAmount)
  const [currentAmount, setCurrentAmount] = useState(DEFAULTS.currentAmount)
  const [months, setMonths] = useState(DEFAULTS.months)
  const [annualRatePercent, setAnnualRatePercent] = useState(DEFAULTS.annualRatePercent)

  useCalculatorCompletion(
    'goal_savings',
    goalAmount !== DEFAULTS.goalAmount ||
      currentAmount !== DEFAULTS.currentAmount ||
      months !== DEFAULTS.months ||
      annualRatePercent !== DEFAULTS.annualRatePercent,
  )

  const result = computeGoalSavings({ goalAmount, currentAmount, months, annualRatePercent })

  return (
    <div className="calculator">
      <div className="calculator__fields">
        <NumberField label="목표금액" unit="원" value={goalAmount} onChange={setGoalAmount} />
        <NumberField label="현재 보유금액" unit="원" value={currentAmount} onChange={setCurrentAmount} />
        <NumberField label="목표기간" unit="개월" value={months} onChange={setMonths} />
        <NumberField
          label="가정 수익률"
          unit="% (연)"
          value={annualRatePercent}
          onChange={setAnnualRatePercent}
        />
      </div>

      <div className="calculator__result">
        {result.alreadyAchieved ? (
          <p className="calculator__note">
            현재 보유금액의 가정 성장만으로 목표기간 안에 목표금액에 도달할 것으로 계산돼요. 추가로
            매달 저축하지 않아도 될 수 있어요.
          </p>
        ) : result.monthlyRequiredSaving === null ? (
          <p className="calculator__note">
            목표기간이 0개월이라 이 기간 안에는 계산할 수 없어요. 기간을 늘려보세요.
          </p>
        ) : (
          <>
            <div className="calculator__result-line calculator__result-line--emphasize">
              <span>매월 필요한 저축액</span>
              <strong>{formatWon(result.monthlyRequiredSaving)}</strong>
            </div>
            <div className="calculator__result-line">
              <span>저축 기간 동안 납입할 원금</span>
              <strong>{formatWon(result.totalContribution)}</strong>
            </div>
            <div className="calculator__result-line">
              <span>가정 수익분</span>
              <strong>{formatWon(result.assumedGain)}</strong>
            </div>
          </>
        )}
      </div>

      <CalculatorDisclaimer />
    </div>
  )
}
