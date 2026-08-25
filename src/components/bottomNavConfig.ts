import { BookIcon, HomeIcon, IndicatorsIcon, SettingsIcon } from './bottomNavIcons'

export type BottomNavTab = '/' | '/indicators' | '/learn' | '/settings'

export const NAV_ITEMS: { to: BottomNavTab; label: string; Icon: () => React.JSX.Element }[] = [
  { to: '/', label: '홈', Icon: HomeIcon },
  { to: '/indicators', label: '경제지표', Icon: IndicatorsIcon },
  { to: '/learn', label: '공부하기', Icon: BookIcon },
  { to: '/settings', label: '설정', Icon: SettingsIcon },
]

// 재무 브리핑(`/learn/briefing`)은 홈에서 진입하는 하위 기능이라 별도 탭이 없다 —
// 그 화면에 있을 때도 "홈"을 활성 상태로 표시한다(경제사 등 학습 진행형 화면과
// 달리, "공부하기" 쪽에 걸치지 않게 명시적으로 예외 처리한다). 거래 입력/통계/
// 자산 관리처럼 홈에서 들어가는 다른 하위 화면들도 전부 홈을 활성 상태로 본다 —
// 기존(3탭) 구현에서도 이 화면들은 명시적으로 매칭되는 탭이 없었다.
export function resolveActiveTab(pathname: string): BottomNavTab {
  if (pathname.startsWith('/indicators')) return '/indicators'
  if (pathname.startsWith('/learn/briefing')) return '/'
  if (pathname.startsWith('/learn')) return '/learn'
  if (pathname.startsWith('/settings')) return '/settings'
  return '/'
}
