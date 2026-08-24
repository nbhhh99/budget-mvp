import { useState } from 'react'
import { computeInflationAdjustedValue } from '../../../domain'
import { formatWon } from '../../../utils/date'
import { NumberField } from './NumberField'
import { CalculatorDisclaimer } from './CalculatorDisclaimer'
import { useCalculatorCompletion } from './useCalculatorCompletion'

const DEFAULTS = { currentAmount: 10_000_000, years: 10, annualInflationRatePercent: 3 }

export function InflationAdjustedCalculator() {
  const [currentAmount, setCurrentAmount] = useState(DEFAULTS.currentAmount)
  const [years, setYears] = useState(DEFAULTS.years)
  const [annualInflationRatePercent, setAnnualInflationRatePercent] = useState(
    DEFAULTS.annualInflationRatePercent,
  )

  useCalculatorCompletion(
    'inflation_adjusted',
    currentAmount !== DEFAULTS.currentAmount ||
      years !== DEFAULTS.years ||
      annualInflationRatePercent !== DEFAULTS.annualInflationRatePercent,
  )

  const result = computeInflationAdjustedValue({
    currentAmount,
    years,
    annualInflationRatePercent,
  })

  return (
    <div className="calculator">
      <div className="calculator__fields">
        <NumberField label="현재 금액" unit="원" value={currentAmount} onChange={setCurrentAmount} />
        <NumberField label="기간" unit="년" value={years} onChange={setYears} />
        <NumberField
          label="가정 물가상승률"
          unit="% (연)"
          value={annualInflationRatePercent}
          onChange={setAnnualInflationRatePercent}
        />
      </div>

      <div className="calculator__result">
        <div className="calculator__result-line">
          <span>{years}년 후 같은 구매력을 유지하려면 필요한 명목금액</span>
          <strong>{formatWon(result.futureNominalCost)}</strong>
        </div>
        <div className="calculator__result-line">
          <span>지금 금액을 그대로 들고 있을 때 {years}년 후 실질가치</span>
          <strong>{formatWon(result.realValueOfHoldingCash)}</strong>
        </div>
        <div className="calculator__result-line calculator__result-line--emphasize">
          <span>물가로 줄어드는 구매력</span>
          <strong>{formatWon(result.purchasingPowerLost)}</strong>
        </div>
      </div>

      <CalculatorDisclaimer />
    </div>
  )
}
