import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import transactionImage from '../assets/branding/btn-transaction.webp'
import statsImage from '../assets/branding/btn-stats.webp'
import transactionsListImage from '../assets/branding/btn-transactions.webp'
import assetsImage from '../assets/branding/btn-assets.webp'
import { settingsRepo } from '../db'
import { getDailyQuote, resolveHouseholdTitle, sanitizeHouseholdName } from '../domain'
import { DAILY_QUOTES } from '../content/dailyQuotes'
import { todayDateString } from '../utils/date'
import { useToast } from '../components/toast/useToast'
import { HouseholdNameSheet } from './HouseholdNameSheet'
import './HomeScreen.css'

const NAV_BUTTONS = [
  { to: '/transactions/new', image: transactionImage, label: '수입·지출 입력', variant: 'expense' },
  { to: '/stats', image: statsImage, label: '통계', variant: 'stats' },
  { to: '/transactions', image: transactionsListImage, label: '월별 내역', variant: 'list' },
  { to: '/assets', image: assetsImage, label: '자산 현황', variant: 'assets' },
] as const

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <path
        d="M4 20l1-4L16 5l3 3L8 19l-4 1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M14 7l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

// 동전·잎사귀·별·점선·흐릿한 원형 블러 — 클릭 이벤트 없는 순수 장식.
function HomeDecoration() {
  return (
    <div className="home-screen__decor" aria-hidden="true">
      <span className="home-screen__decor-blob home-screen__decor-blob--1" />
      <span className="home-screen__decor-blob home-screen__decor-blob--2" />
      <svg
        className="home-screen__decor-item home-screen__decor-item--coin"
        viewBox="0 0 24 24"
        width="30"
        height="30"
      >
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      <svg
        className="home-screen__decor-item home-screen__decor-item--leaf"
        viewBox="0 0 24 24"
        width="28"
        height="28"
      >
        <path
          d="M4 20c8 0 16-8 16-16-8 0-16 8-16 16Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        className="home-screen__decor-item home-screen__decor-item--star"
        viewBox="0 0 24 24"
        width="18"
        height="18"
      >
        <path
          d="M12 3l1.8 5.6H19l-4.6 3.4L16.2 18 12 14.6 7.8 18l1.8-6-4.6-3.4h5.2Z"
          fill="currentColor"
        />
      </svg>
      <svg
        className="home-screen__decor-item home-screen__decor-item--dots"
        viewBox="0 0 60 4"
        width="60"
        height="4"
      >
        <line
          x1="0"
          y1="2"
          x2="60"
          y2="2"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="1 7"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export function HomeScreen() {
  const { showToast } = useToast()
  const [householdName, setHouseholdName] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const settings = await settingsRepo.getSettings()
      if (cancelled) return
      setHouseholdName(settings.householdName ?? '')
      setLoaded(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const title = resolveHouseholdTitle(householdName)
  const quote = getDailyQuote(DAILY_QUOTES, todayDateString())

  async function handleSaveName(value: string) {
    const sanitized = sanitizeHouseholdName(value)
    await settingsRepo.updateSettings({ householdName: sanitized })
    setHouseholdName(sanitized)
    setSheetOpen(false)
    showToast({ message: '가계부 이름을 저장했어요.' })
  }

  return (
    <div className="home-screen">
      <HomeDecoration />

      <div className="home-screen__content">
        <div className="home-screen__header">
          <div className="home-screen__title-group">
            <h1 className="home-screen__title">{loaded ? title : ' '}</h1>
            <p className="home-screen__subtitle">오늘도 내 돈을 차곡차곡 기록해요</p>
          </div>
          <button
            type="button"
            className="home-screen__edit-button"
            onClick={() => setSheetOpen(true)}
            aria-label="가계부 이름 수정"
          >
            <PencilIcon />
          </button>
        </div>

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

        {quote && (
          <div className="home-screen__quote">
            <span className="home-screen__quote-icon" aria-hidden="true">
              🍃
            </span>
            <p className="home-screen__quote-text">“{quote}”</p>
          </div>
        )}
      </div>

      <HouseholdNameSheet
        open={sheetOpen}
        initialValue={householdName}
        onSave={handleSaveName}
        onCancel={() => setSheetOpen(false)}
      />
    </div>
  )
}
