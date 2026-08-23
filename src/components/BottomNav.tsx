import { NavLink } from 'react-router-dom'
import './BottomNav.css'

const NAV_ITEMS = [
  { to: '/transactions', label: '월별 내역', end: false },
  { to: '/budgets', label: '예산 설정', end: false },
  { to: '/', label: '홈', end: true },
  { to: '/closing', label: '월말 결산', end: false },
  { to: '/settings', label: '설정', end: false },
]

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
