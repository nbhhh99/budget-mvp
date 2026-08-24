import { Link } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { IllustrationImage } from './IllustrationImage'
import './LearnHomeScreen.css'

const CARDS = [
  {
    to: '/learn/briefing',
    title: '재무 브리핑',
    description: '국내외 경제 흐름이 내 자산에 갖는 의미를 살펴봐요.',
    image: 'financial-briefing.png',
    icon: '🌍',
  },
  {
    to: '/learn/monthly',
    title: '차근차근 경제사',
    description: '경제가 지금의 모습이 된 과정을 핵심 사건으로 배워요.',
    image: 'monthly-money-lesson.png',
    icon: '💡',
  },
  {
    to: '/learn/concepts',
    title: '돈 개념 사전',
    description: '복리·환율·ETF 같은 궁금한 금융 개념을 찾아보세요.',
    image: 'concept-cards.png',
    icon: '📇',
  },
  {
    to: '/learn/calculators',
    title: '숫자로 이해하기',
    description: '복리·물가·목표저축을 직접 계산해 보세요.',
    image: 'understand-with-numbers.png',
    icon: '🧮',
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
