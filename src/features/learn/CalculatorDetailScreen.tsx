import { useParams } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import type { CalculatorId } from '../../types/models'
import { CompoundInterestCalculator } from './calculators/CompoundInterestCalculator'
import { InflationAdjustedCalculator } from './calculators/InflationAdjustedCalculator'
import { GoalSavingsCalculator } from './calculators/GoalSavingsCalculator'
import { SavingsRateCalculator } from './calculators/SavingsRateCalculator'
import './calculators/calculators.css'

const TITLES: Record<CalculatorId, string> = {
  compound_interest: '복리 계산기',
  inflation_adjusted: '물가 반영 계산기',
  goal_savings: '목표저축 계산기',
  savings_rate: '저축률 계산기',
}

function isCalculatorId(value: string | undefined): value is CalculatorId {
  return value !== undefined && value in TITLES
}

export function CalculatorDetailScreen() {
  const { calculatorId } = useParams<{ calculatorId: string }>()

  if (!isCalculatorId(calculatorId)) {
    return (
      <div>
        <ScreenHeader title="숫자로 이해하기" />
        <div className="calculator-detail__body">
          <p>이 계산기를 찾을 수 없어요.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <ScreenHeader title={TITLES[calculatorId]} />
      <div className="calculator-detail__body">
        {calculatorId === 'compound_interest' && <CompoundInterestCalculator />}
        {calculatorId === 'inflation_adjusted' && <InflationAdjustedCalculator />}
        {calculatorId === 'goal_savings' && <GoalSavingsCalculator />}
        {calculatorId === 'savings_rate' && <SavingsRateCalculator />}
      </div>
    </div>
  )
}
