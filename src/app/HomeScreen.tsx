import { Link } from 'react-router-dom'
import transactionImage from '../assets/branding/btn-transaction.webp'
import statsImage from '../assets/branding/btn-stats.webp'
import transactionsListImage from '../assets/branding/btn-transactions.webp'
import assetsImage from '../assets/branding/btn-assets.webp'
import briefingImage from '../assets/branding/btn-briefing.webp'
import './HomeScreen.css'

const NAV_BUTTONS = [
  { to: '/transactions/new', image: transactionImage, label: '수입·지출 입력', variant: 'expense' },
  { to: '/stats', image: statsImage, label: '통계', variant: 'stats' },
  { to: '/transactions', image: transactionsListImage, label: '월별 내역', variant: 'list' },
  { to: '/assets', image: assetsImage, label: '자산 현황', variant: 'assets' },
] as const

export function HomeScreen() {
  return (
    <div className="home-screen">
      <Link to="/briefing" className="home-screen__briefing-banner">
        <img className="home-screen__briefing-banner-image" src={briefingImage} alt="" />
        <span className="home-screen__briefing-banner-label">국내외 경제 브리핑</span>
      </Link>

      <div className="home-screen__grid">
        {NAV_BUTTONS.map((btn) => (
          <Link
            key={btn.to}
            to={btn.to}
            className={`home-screen__button home-screen__button--${btn.variant}`}
          >
            <img className="home-screen__button-image" src={btn.image} alt="" />
            <span className="home-screen__button-label">{btn.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
