import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import transactionImage from '../assets/branding/btn-transaction.webp'
import statsImage from '../assets/branding/btn-stats.webp'
import transactionsListImage from '../assets/branding/btn-transactions.webp'
import assetsImage from '../assets/branding/btn-assets.webp'
import { curriculumProgressRepo, settingsRepo } from '../db'
import {
  computeModuleProgress,
  getDailyQuote,
  getRecommendedModule,
  resolveHouseholdSubtitle,
  resolveHouseholdTitle,
  sanitizeHouseholdName,
  sanitizeHouseholdSubtitle,
  type RecommendedModule,
} from '../domain'
import { ECONOMIC_HISTORY_CONTENTS, ECONOMIC_HISTORY_MODULES, ECONOMIC_HISTORY_VERSION } from '../content/economicHistory'
import { REAL_LIFE_ECONOMY_CONTENTS, REAL_LIFE_ECONOMY_MODULES, REAL_LIFE_ECONOMY_VERSION } from '../content/realLifeEconomy'
import { DAILY_QUOTES } from '../content/dailyQuotes'
import { todayDateString } from '../utils/date'
import { useToast } from '../components/toast/useToast'
import { HouseholdHeaderSheet } from './HouseholdHeaderSheet'
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
  const [householdSubtitle, setHouseholdSubtitle] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [recommended, setRecommended] = useState<RecommendedModule | null>(null)
  const [recommendedProgress, setRecommendedProgress] = useState({ completed: 0, total: 0 })
  const [recommendedLifeEconomy, setRecommendedLifeEconomy] = useState<RecommendedModule | null>(null)
  const [recommendedLifeEconomyProgress, setRecommendedLifeEconomyProgress] = useState({ completed: 0, total: 0 })

  useEffect(() => {
    let cancelled = false
    async function load() {
      const settings = await settingsRepo.getSettings()
      if (cancelled) return
      setHouseholdName(settings.householdName ?? '')
      setHouseholdSubtitle(settings.householdSubtitle ?? '')
      setLoaded(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const progress = await curriculumProgressRepo.getCurriculumProgressForVersion(ECONOMIC_HISTORY_VERSION)
      if (cancelled) return
      const result = getRecommendedModule(ECONOMIC_HISTORY_MODULES, progress)
      setRecommended(result)
      if (result) {
        const contents = ECONOMIC_HISTORY_CONTENTS.filter((c) => c.curriculumId === result.module.id)
        const p = progress.find((item) => item.curriculumId === result.module.id)
        setRecommendedProgress(computeModuleProgress(contents, p?.completedItemIds ?? []))
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const progress = await curriculumProgressRepo.getCurriculumProgressForVersion(REAL_LIFE_ECONOMY_VERSION)
      if (cancelled) return
      const result = getRecommendedModule(REAL_LIFE_ECONOMY_MODULES, progress)
      setRecommendedLifeEconomy(result)
      if (result) {
        const contents = REAL_LIFE_ECONOMY_CONTENTS.filter((c) => c.curriculumId === result.module.id)
        const p = progress.find((item) => item.curriculumId === result.module.id)
        setRecommendedLifeEconomyProgress(computeModuleProgress(contents, p?.completedItemIds ?? []))
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const title = resolveHouseholdTitle(householdName)
  const subtitle = resolveHouseholdSubtitle(householdSubtitle)
  const quote = getDailyQuote(DAILY_QUOTES, todayDateString())

  async function handleSaveHeader(name: string, subtitleInput: string) {
    const sanitizedName = sanitizeHouseholdName(name)
    const sanitizedSubtitle = sanitizeHouseholdSubtitle(subtitleInput)
    await settingsRepo.updateSettings({
      householdName: sanitizedName,
      householdSubtitle: sanitizedSubtitle,
    })
    setHouseholdName(sanitizedName)
    setHouseholdSubtitle(sanitizedSubtitle)
    setSheetOpen(false)
    showToast({ message: '가계부 이름을 저장했어요.' })
  }

  return (
    <div className="home-screen">
      <HomeDecoration />

      <div className="home-screen__content">
        <div className="home-screen__header">
          <div className="home-screen__title-group">
            <h1 className="home-screen__title">{loaded ? title : ' '}</h1>
            <p className="home-screen__subtitle">{loaded ? subtitle : ' '}</p>
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

        {recommendedLifeEconomy && (
          <Link
            to={`/learn/life-economy/${recommendedLifeEconomy.module.id}`}
            className="home-screen__learning-card home-screen__learning-card--orange"
          >
            <span className="home-screen__learning-label">
              {recommendedLifeEconomy.status === 'in_progress' ? '이어서 학습하기' : '다음 학습'}
            </span>
            <span className="home-screen__learning-title">
              {recommendedLifeEconomy.module.order}단계 · {recommendedLifeEconomy.module.title}
            </span>
            <span className="home-screen__learning-progress">
              {recommendedLifeEconomyProgress.completed}/{recommendedLifeEconomyProgress.total} 완료
            </span>
          </Link>
        )}

        {recommended && (
          <Link to={`/learn/monthly/${recommended.module.id}`} className="home-screen__learning-card">
            <span className="home-screen__learning-label">
              {recommended.status === 'in_progress' ? '이어서 학습하기' : '다음 학습'}
            </span>
            <span className="home-screen__learning-title">
              {recommended.module.order}단계 · {recommended.module.title}
            </span>
            <span className="home-screen__learning-progress">
              {recommendedProgress.completed}/{recommendedProgress.total} 완료
            </span>
          </Link>
        )}

        {quote && (
          <div className="home-screen__quote">
            <span className="home-screen__quote-icon" aria-hidden="true">
              🍃
            </span>
            <p className="home-screen__quote-text">“{quote}”</p>
          </div>
        )}
      </div>

      <HouseholdHeaderSheet
        open={sheetOpen}
        initialName={householdName}
        initialSubtitle={householdSubtitle}
        onSave={handleSaveHeader}
        onCancel={() => setSheetOpen(false)}
      />
    </div>
  )
}
