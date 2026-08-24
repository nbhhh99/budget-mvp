import { useState } from 'react'
import { computeSavingsRate } from '../../../domain'
import { formatWon } from '../../../utils/date'
import { formatPercent } from '../../../utils/format'
import { NumberField } from './NumberField'
import { useCalculatorCompletion } from './useCalculatorCompletion'

const DEFAULTS = { monthlyIncome: 4_000_000, monthlySaving: 1_000_000, monthlyDebtPrincipalPayment: 0 }

export function SavingsRateCalculator() {
  const [monthlyIncome, setMonthlyIncome] = useState(DEFAULTS.monthlyIncome)
  const [monthlySaving, setMonthlySaving] = useState(DEFAULTS.monthlySaving)
  const [monthlyDebtPrincipalPayment, setMonthlyDebtPrincipalPayment] = useState(
    DEFAULTS.monthlyDebtPrincipalPayment,
  )
  const [targetRatePercent, setTargetRatePercent] = useState(0)

  useCalculatorCompletion(
    'savings_rate',
    monthlyIncome !== DEFAULTS.monthlyIncome ||
      monthlySaving !== DEFAULTS.monthlySaving ||
      monthlyDebtPrincipalPayment !== DEFAULTS.monthlyDebtPrincipalPayment,
  )

  const result = computeSavingsRate({ monthlyIncome, monthlySaving, monthlyDebtPrincipalPayment })

  const gapPercent =
    result.savingsRatePercent !== null && targetRatePercent > 0
      ? targetRatePercent - result.savingsRatePercent
      : null

  return (
    <div className="calculator">
      <div className="calculator__fields">
        <NumberField label="월 수입" unit="원" value={monthlyIncome} onChange={setMonthlyIncome} />
        <NumberField
          label="월 저축·투자"
          unit="원"
          value={monthlySaving}
          onChange={setMonthlySaving}
        />
        <NumberField
          label="월 부채 원금 상환액"
          unit="원 (선택)"
          value={monthlyDebtPrincipalPayment}
          onChange={setMonthlyDebtPrincipalPayment}
          hint="자산을 늘리는 성격이 있어 포함할지 직접 정할 수 있어요. 0이면 제외돼요."
        />
      </div>

      <div className="calculator__result">
        <div className="calculator__result-line calculator__result-line--emphasize">
          <span>저축률</span>
          <strong>{formatPercent(result.savingsRatePercent)}</strong>
        </div>
        <p className="calculator__formula">
          계산식: ({formatWon(result.savingsAndDebtAmount)} ÷ {formatWon(monthlyIncome)}) × 100
        </p>
      </div>

      <div className="calculator__fields">
        <NumberField
          label="다음 목표 저축률"
          unit="% (선택)"
          value={targetRatePercent}
          onChange={setTargetRatePercent}
          hint="스스로 정한 목표예요. 저장되지 않고 이 화면을 벗어나면 초기화돼요."
        />
      </div>
      {gapPercent !== null && (
        <p className="calculator__note">
          {gapPercent > 0
            ? `목표까지 ${gapPercent.toFixed(1)}%p 남았어요.`
            : '이미 목표 저축률을 달성했어요.'}
        </p>
      )}
    </div>
  )
}
