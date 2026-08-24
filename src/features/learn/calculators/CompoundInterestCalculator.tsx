import { useState } from 'react'
import { computeCompoundInterest } from '../../../domain'
import { formatWon } from '../../../utils/date'
import { NumberField } from './NumberField'
import { CalculatorDisclaimer } from './CalculatorDisclaimer'
import { useCalculatorCompletion } from './useCalculatorCompletion'

const DEFAULTS = { initialAmount: 1_000_000, monthlyContribution: 300_000, months: 60, annualRatePercent: 4 }

export function CompoundInterestCalculator() {
  const [initialAmount, setInitialAmount] = useState(DEFAULTS.initialAmount)
  const [monthlyContribution, setMonthlyContribution] = useState(DEFAULTS.monthlyContribution)
  const [months, setMonths] = useState(DEFAULTS.months)
  const [annualRatePercent, setAnnualRatePercent] = useState(DEFAULTS.annualRatePercent)

  useCalculatorCompletion(
    'compound_interest',
    initialAmount !== DEFAULTS.initialAmount ||
      monthlyContribution !== DEFAULTS.monthlyContribution ||
      months !== DEFAULTS.months ||
      annualRatePercent !== DEFAULTS.annualRatePercent,
  )

  const result = computeCompoundInterest({
    initialAmount,
    monthlyContribution,
    months,
    annualRatePercent,
  })

  return (
    <div className="calculator">
      <div className="calculator__fields">
        <NumberField label="초기금액" unit="원" value={initialAmount} onChange={setInitialAmount} />
        <NumberField
          label="월 적립금"
          unit="원"
          value={monthlyContribution}
          onChange={setMonthlyContribution}
        />
        <NumberField label="기간" unit="개월" value={months} onChange={setMonths} />
        <NumberField
          label="가정 수익률"
          unit="% (연)"
          value={annualRatePercent}
          onChange={setAnnualRatePercent}
        />
      </div>

      <div className="calculator__result">
        <div className="calculator__result-line">
          <span>총 납입원금</span>
          <strong>{formatWon(result.totalPrincipal)}</strong>
        </div>
        <div className="calculator__result-line">
          <span>가정 수익</span>
          <strong>{formatWon(result.assumedGain)}</strong>
        </div>
        <div className="calculator__result-line calculator__result-line--emphasize">
          <span>예상 합계</span>
          <strong>{formatWon(result.projectedTotal)}</strong>
        </div>
      </div>

      {result.yearly.length > 0 && (
        <table className="calculator__table">
          <caption>연도별 변화</caption>
          <thead>
            <tr>
              <th scope="col">연차</th>
              <th scope="col">납입원금</th>
              <th scope="col">예상 잔액</th>
            </tr>
          </thead>
          <tbody>
            {result.yearly.map((point) => (
              <tr key={point.year}>
                <td>{point.year}년차</td>
                <td>{formatWon(point.principal)}</td>
                <td>{formatWon(point.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <CalculatorDisclaimer />
    </div>
  )
}
