import { NavLink } from 'react-router-dom'
import './BottomNav.css'

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path
        d="M4 11.5 12 4l8 7.5M6 9.5V19a1 1 0 0 0 1 1h3v-5a2 2 0 0 1 4 0v5h3a1 1 0 0 0 1-1V9.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path
        d="M12 6.5c-1.4-1-3.4-1.5-5.5-1.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 1 6.5 16c2.1 0 4.1.5 5.5 1.5m0-11c1.4-1 3.4-1.5 5.5-1.5A1.5 1.5 0 0 1 19 6.5v11a1.5 1.5 0 0 0-1.5-1.5c-2.1 0-4.1.5-5.5 1.5m0-11v11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 3.5v2m0 13v2m8.5-8.5h-2m-13 0h-2m14.5-6-1.4 1.4M6.9 17.1l-1.4 1.4m0-13 1.4 1.4M17.1 17.1l1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

const NAV_ITEMS = [
  { to: '/', label: '홈', end: true, Icon: HomeIcon },
  { to: '/learn', label: '공부하기', end: false, Icon: BookIcon },
  { to: '/settings', label: '설정', end: false, Icon: SettingsIcon },
]

// 탭 전환은 뒤로가기 스택을 쌓지 않도록 replace로 이동한다. 이렇게 하면 탭을
// 여러 번 옮겨 다녀도 기록이 깊어지지 않아, 폰의 뒤로가기를 눌렀을 때 화면
// 사이를 계속 왔다갔다하지 않고 곧바로 앱이 종료된다. 거래 입력/수정처럼
// 화면 안으로 "들어가는" 이동은 각 화면에서 일반 Link/navigate(push)를 그대로
// 써서, 그 안에서는 뒤로가기로 이전 화면에 돌아올 수 있다.
export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          replace
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
          }
        >
          <item.Icon />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
