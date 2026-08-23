import { Link } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useInstallPrompt } from '../../pwa/useInstallPrompt'
import './SettingsScreen.css'

const MENU_ITEMS = [
  { to: '/budgets', label: '예산 설정', ready: true },
  { to: '/settings/categories', label: '분류 관리', ready: true },
  { to: '/settings/backup', label: '백업 / 복원', ready: true },
  { to: '/settings/csv', label: 'CSV 가져오기 / 내보내기', ready: true },
  { to: '/settings/reset', label: '전체 초기화', ready: true },
]

export function SettingsScreen() {
  const { canInstall, installed, promptInstall } = useInstallPrompt()

  return (
    <div>
      <ScreenHeader title="설정" />

      {installed ? (
        <p className="settings-install settings-install--done">✓ 설치된 앱으로 실행 중입니다.</p>
      ) : canInstall ? (
        <div className="settings-install">
          <span>홈 화면에 앱을 추가하면 더 빠르게 열 수 있어요.</span>
          <button type="button" onClick={promptInstall}>
            홈 화면에 추가
          </button>
        </div>
      ) : (
        <p className="settings-install settings-install--hint">
          iPhone에서는 Safari의 공유 버튼 → "홈 화면에 추가"를 눌러 설치할 수 있어요.
        </p>
      )}

      <ul className="settings-menu">
        {MENU_ITEMS.map((item) =>
          item.ready ? (
            <li key={item.to}>
              <Link className="settings-menu__item" to={item.to}>
                {item.label}
                <span className="settings-menu__chevron">›</span>
              </Link>
            </li>
          ) : (
            <li key={item.to}>
              <span className="settings-menu__item settings-menu__item--disabled">
                {item.label}
                <span className="settings-menu__badge">준비 중</span>
              </span>
            </li>
          ),
        )}
      </ul>
    </div>
  )
}
