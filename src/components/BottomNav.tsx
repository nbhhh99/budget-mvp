import { Link, useLocation } from 'react-router-dom'
import { NAV_ITEMS, resolveActiveTab } from './bottomNavConfig'
import './BottomNav.css'

// 탭 전환은 뒤로가기 스택을 쌓지 않도록 replace로 이동한다. 이렇게 하면 탭을
// 여러 번 옮겨 다녀도 기록이 깊어지지 않아, 폰의 뒤로가기를 눌렀을 때 화면
// 사이를 계속 왔다갔다하지 않고 곧바로 앱이 종료된다. 거래 입력/수정처럼
// 화면 안으로 "들어가는" 이동은 각 화면에서 일반 Link/navigate(push)를 그대로
// 써서, 그 안에서는 뒤로가기로 이전 화면에 돌아올 수 있다.
export function BottomNav() {
  const location = useLocation()
  const activeTab = resolveActiveTab(location.pathname)

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => {
        const isActive = item.to === activeTab
        return (
          <Link
            key={item.to}
            to={item.to}
            replace
            aria-current={isActive ? 'page' : undefined}
            className={`bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
          >
            <item.Icon />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
