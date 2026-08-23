import { Link } from 'react-router-dom'
import { useLock } from '../components/lock/useLock'
import './HomeScreen.css'

const NAV_BUTTONS = [
  {
    to: '/transactions/new',
    icon: '＋',
    label: '수입·지출 입력',
    variant: 'expense',
    locked: false,
  },
  { to: '/stats', icon: '📊', label: '통계 보기', variant: 'stats', locked: true },
  { to: '/transactions', icon: '📒', label: '월별 내역', variant: 'list', locked: true },
  { to: '/assets', icon: '💰', label: '자산 관리', variant: 'assets', locked: true },
] as const

export function HomeScreen() {
  const { hasPin } = useLock()

  return (
    <div className="home-screen">
      <div className="home-screen__brand">가계부</div>
      <div className="home-screen__grid">
        {NAV_BUTTONS.map((btn) => (
          <Link
            key={btn.to}
            to={btn.to}
            className={`home-screen__button home-screen__button--${btn.variant}`}
          >
            <span className="home-screen__button-icon">{btn.icon}</span>
            <span className="home-screen__button-label">
              {btn.label}
              {btn.locked && hasPin && <span className="home-screen__lock">🔒</span>}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
