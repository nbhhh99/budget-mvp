import { Link } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import type { CalculatorId } from '../../types/models'
import compoundInterestImage from '../../assets/branding/calc-compound-interest.webp'
import goalSavingsImage from '../../assets/branding/calc-goal-savings.webp'
import inflationAdjustedImage from '../../assets/branding/calc-inflation-adjusted.webp'
import savingsRateImage from '../../assets/branding/calc-savings-rate.webp'
import './CalculatorListScreen.css'

const CALCULATORS: { id: CalculatorId; title: string; description: string; image: string }[] = [
  {
    id: 'compound_interest',
    title: '복리 계산기',
    description: '초기금액과 월 적립금이 가정한 수익률로 얼마나 불어나는지 계산해요.',
    image: compoundInterestImage,
  },
  {
    id: 'inflation_adjusted',
    title: '물가 반영 계산기',
    description: '물가상승률을 반영하면 지금 금액의 미래 가치가 어떻게 달라지는지 계산해요.',
    image: inflationAdjustedImage,
  },
  {
    id: 'goal_savings',
    title: '목표저축 계산기',
    description: '목표금액을 모으려면 매달 얼마씩 저축해야 하는지 계산해요.',
    image: goalSavingsImage,
  },
  {
    id: 'savings_rate',
    title: '저축률 계산기',
    description: '수입 중 얼마를 저축·투자하고 있는지 비율로 확인해요.',
    image: savingsRateImage,
  },
]

export function CalculatorListScreen() {
  return (
    <div className="calculator-list">
      <ScreenHeader title="숫자로 이해하기" />
      <div className="calculator-list__body">
        <ul className="calculator-list__list">
          {CALCULATORS.map((calc) => (
            <li key={calc.id}>
              <Link to={`/learn/calculators/${calc.id}`} className="calculator-list__item">
                <img className="calculator-list__icon" src={calc.image} alt="" />
                <span className="calculator-list__text">
                  <span className="calculator-list__title">{calc.title}</span>
                  <span className="calculator-list__desc">{calc.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
