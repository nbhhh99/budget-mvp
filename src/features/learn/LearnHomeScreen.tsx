import { Link } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { IllustrationImage } from './IllustrationImage'
import './LearnHomeScreen.css'

const CARDS = [
  {
    to: '/learn/briefing',
    title: '경제 흐름',
    description: '국내외 경제 변화와 금융제도 소식을 내 자산의 관점에서 살펴봐요.',
    image: 'financial-briefing.png',
    icon: '🌍',
  },
  {
    to: '/learn/concepts',
    title: '개념 카드',
    description: '자산 형성에 필요한 개념을 짧고 쉽게 배워요.',
    image: 'concept-cards.png',
    icon: '📇',
  },
  {
    to: '/learn/calculators',
    title: '숫자로 이해하기',
    description: '금리·물가·복리의 영향을 직접 계산하며 알아봐요.',
    image: 'understand-with-numbers.png',
    icon: '🧮',
  },
  {
    to: '/learn/monthly',
    title: '이번 달 돈 공부',
    description: '이번 달 경제 흐름과 연결된 한 가지 주제를 깊이 살펴봐요.',
    image: 'monthly-money-lesson.png',
    icon: '💡',
  },
] as const

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
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
