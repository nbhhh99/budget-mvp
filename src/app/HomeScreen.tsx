import { Link } from 'react-router-dom'
import { useLock } from '../components/lock/useLock'
import logoImage from '../assets/branding/logo.webp'
import transactionImage from '../assets/branding/btn-transaction.webp'
import statsImage from '../assets/branding/btn-stats.webp'
import transactionsListImage from '../assets/branding/btn-transactions.webp'
import assetsImage from '../assets/branding/btn-assets.webp'
import briefingImage from '../assets/branding/btn-briefing.webp'
import './HomeScreen.css'

const NAV_BUTTONS = [
  {
    to: '/transactions/new',
    image: transactionImage,
    label: '수입·지출 입력',
    variant: 'expense',
    locked: false,
  },
  { to: '/stats', image: statsImage, label: '통계 보기', variant: 'stats', locked: true },
  {
    to: '/transactions',
    image: transactionsListImage,
    label: '월별 내역',
    variant: 'list',
    locked: true,
  },
  { to: '/assets', image: assetsImage, label: '자산 관리', variant: 'assets', locked: true },
] as const

export function HomeScreen() {
  const { hasPin } = useLock()

  return (
    <div className="home-screen">
      <img className="home-screen__brand" src={logoImage} alt="가계부" />

      <Link to="/briefing" className="home-screen__briefing-banner" aria-label="이번 달 재무 브리핑">
        <img className="home-screen__briefing-banner-image" src={briefingImage} alt="" />
      </Link>

      <div className="home-screen__grid">
        {NAV_BUTTONS.map((btn) => (
          <Link
            key={btn.to}
            to={btn.to}
            className={`home-screen__button home-screen__button--${btn.variant}`}
            aria-label={btn.label}
          >
            <img className="home-screen__button-image" src={btn.image} alt="" />
            {btn.locked && hasPin && <span className="home-screen__lock" aria-hidden="true">🔒</span>}
          </Link>
        ))}
      </div>
    </div>
  )
}
