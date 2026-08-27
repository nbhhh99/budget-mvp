import { BookIcon, HomeIcon, IndicatorsIcon, SettingsIcon } from './bottomNavIcons'

export type BottomNavTab = '/' | '/indicators' | '/learn' | '/settings'

export const NAV_ITEMS: { to: BottomNavTab; label: string; Icon: () => React.JSX.Element }[] = [
  { to: '/', label: '홈', Icon: HomeIcon },
  { to: '/indicators', label: '경제지표', Icon: IndicatorsIcon },
  { to: '/learn', label: '공부하기', Icon: BookIcon },
  { to: '/settings', label: '설정', Icon: SettingsIcon },
]

// 재무 브리핑(`/learn/briefing`)은 라우트 자체가 `/learn` 아래에 있으므로 "공부하기"
// 탭이 활성 상태여야 한다 — 별도 탭이 없다고 해서 "홈"으로 되돌릴 이유는 없다(이전에
// 그렇게 예외 처리했던 게 버그였다). 거래 입력/통계/자산 관리처럼 홈에서 들어가는
// 다른 하위 화면들은 여전히 명시적으로 매칭되는 탭이 없어 홈을 활성 상태로 본다 —
// 기존(3탭) 구현에서도 이 화면들은 매칭되는 탭이 없었다.
export function resolveActiveTab(pathname: string): BottomNavTab {
  if (pathname.startsWith('/indicators')) return '/indicators'
  if (pathname.startsWith('/learn')) return '/learn'
  if (pathname.startsWith('/settings')) return '/settings'
  return '/'
}
