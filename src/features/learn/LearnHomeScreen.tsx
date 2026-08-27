import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { IllustrationImage } from './IllustrationImage'
import { curriculumProgressRepo } from '../../db'
import { TAX_LEARNING_VERSION, TAX_LESSONS } from '../../content/taxLearning'
import { computeOverallTaxProgress } from '../../domain'
import './LearnHomeScreen.css'

const CARDS = [
  {
    to: '/learn/briefing',
    title: '재무 브리핑',
    description: '정부 정책·세금·금융제도 변경과 공식 통계 발표를 확인해요.',
    image: 'financial-briefing.png',
    icon: '🌍',
  },
  {
    to: '/learn/concepts',
    title: '금융 개념 노트',
    description: '복리·환율·ETF 같은 궁금한 금융 개념을 찾아보세요.',
    image: 'concept-cards.png',
    icon: '📇',
  },
  {
    to: '/learn/life-economy',
    title: '생활로 읽는 경제',
    description: '금리·환율·물가와 정책이 내 생활에 어떻게 이어지는지 알아봐요.',
    image: 'life-economy.png',
    icon: '🔗',
  },
  {
    to: '/learn/monthly',
    title: '차근차근 경제사',
    description: '경제가 지금의 모습이 된 과정을 핵심 사건으로 배워요.',
    image: 'monthly-money-lesson.png',
    icon: '💡',
  },
  {
    to: '/learn/tax',
    title: '생활 세금 공부',
    description: '월급부터 연말정산, 부수입, 투자·부동산·증여까지 생활 속 세금을 차근차근 이해해요.',
    image: 'tax-learning.png',
    icon: '🧾',
  },
  {
    to: '/learn/calculators',
    title: '숫자로 이해하기',
    description: '복리·물가·목표저축을 직접 계산해 보세요.',
    image: 'understand-with-numbers.png',
    icon: '🧮',
  },
] as const

// "생활 세금 공부" 카드에만 진행률 배지를 붙인다(§7 "0/25 완료") — 개인 거래·자산
// 데이터는 전혀 읽지 않고, 세금 학습 전용 진행 기록(curriculumProgress, 버전
// tax-learning-v1)만 조회한다.
function TaxCourseProgressBadge() {
  const [count, setCount] = useState<{ completed: number; total: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const progress = await curriculumProgressRepo.getCurriculumProgressForVersion(TAX_LEARNING_VERSION)
      if (cancelled) return
      setCount(computeOverallTaxProgress(TAX_LESSONS, progress))
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (!count) return null
  return (
    <p className="learn-home__card-progress">
      {count.completed}/{count.total} 완료
    </p>
  )
}

export function LearnHomeScreen() {
  return (
    <div className="learn-home">
      <ScreenHeader title="공부하기" />
      <div className="learn-home__body">
        <p className="learn-home__intro">
          경제 흐름을 살펴보고, 내 돈을 이해하는 방법을 차근차근 배워보세요.
        </p>
        <ul className="learn-home__card-list">
          {CARDS.map((card) => (
            <li key={card.to}>
              <Link to={card.to} className="learn-home__card">
                <div className="learn-home__card-image">
                  <IllustrationImage
                    src={`${import.meta.env.BASE_URL}illustrations/${card.image}`}
                    fallbackIcon={card.icon}
                    label={card.title}
                  />
                </div>
                <div className="learn-home__card-text">
                  <h2 className="learn-home__card-title">{card.title}</h2>
                  <p className="learn-home__card-desc">{card.description}</p>
                  {card.to === '/learn/tax' && <TaxCourseProgressBadge />}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
