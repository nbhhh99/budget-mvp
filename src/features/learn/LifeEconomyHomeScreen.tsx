import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { curriculumProgressRepo } from '../../db'
import { REAL_LIFE_ECONOMY_CONTENTS, REAL_LIFE_ECONOMY_MODULES, REAL_LIFE_ECONOMY_VERSION } from '../../content/realLifeEconomy'
import { computeModuleProgress, getModuleUiStatus, getRecommendedModule } from '../../domain'
import type { CurriculumProgress } from '../../types/models'
import './LifeEconomyHomeScreen.css'

const STATUS_LABEL: Record<string, string> = {
  available: '시작하기',
  in_progress: '진행 중',
  completed: '완료',
  unavailable: '검토 중',
}

const STATUS_ICON: Record<string, string> = {
  available: '○',
  in_progress: '◐',
  completed: '✓',
  unavailable: '🛠',
}

const SORTED_MODULES = [...REAL_LIFE_ECONOMY_MODULES].sort((a, b) => a.order - b.order)

export function LifeEconomyHomeScreen() {
  const [loaded, setLoaded] = useState(false)
  const [progress, setProgress] = useState<CurriculumProgress[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      // 다른 커리큘럼(차근차근 경제사 등)의 진행 기록이 있어도, 이 버전 필터를
      // 거치면 생활로 읽는 경제 계산에는 전혀 반영되지 않는다(§5·§11).
      const filtered = await curriculumProgressRepo.getCurriculumProgressForVersion(REAL_LIFE_ECONOMY_VERSION)
      if (cancelled) return
      setProgress(filtered)
      setLoaded(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (!loaded) {
    return (
      <div>
        <ScreenHeader title="생활로 읽는 경제" />
        <div className="life-economy-home__body">
          <p className="life-economy-home__state">불러오는 중…</p>
        </div>
      </div>
    )
  }

  const progressByCurriculumId = new Map(progress.map((p) => [p.curriculumId, p]))
  const recommended = getRecommendedModule(REAL_LIFE_ECONOMY_MODULES, progress)
  const hasStarted = progress.length > 0

  return (
    <div>
      <ScreenHeader title="생활로 읽는 경제" />
      <div className="life-economy-home__body">
        <p className="life-economy-home__subtitle">
          금리·환율·물가와 정책이 내 생활에 어떻게 이어지는지 알아봐요.
        </p>

        {!hasStarted && (
          <div className="life-economy-home__intro-card">
            <p className="life-economy-home__intro-text">
              경제 변화가 장보기, 월급, 대출, 취업과
              <br />
              주거비에 어떻게 이어지는지 알아봐요.
            </p>
            <p className="life-economy-home__intro-meta">
              {REAL_LIFE_ECONOMY_MODULES.length}개 과정 · 학습 기한 없음 · 언제든 복습 가능
            </p>
            <Link to={`/learn/life-economy/${SORTED_MODULES[0].id}`} className="life-economy-home__primary-button">
              시작하기
            </Link>
          </div>
        )}

        {hasStarted && recommended && (
          <Link to={`/learn/life-economy/${recommended.module.id}`} className="life-economy-home__recommend-card">
            <p className="life-economy-home__recommend-label">현재 추천 과정</p>
            <p className="life-economy-home__recommend-title">
              {recommended.module.order}단계 · {recommended.module.title}
            </p>
            <p className="life-economy-home__recommend-desc">{recommended.module.description}</p>
            {(() => {
              const contents = REAL_LIFE_ECONOMY_CONTENTS.filter((c) => c.curriculumId === recommended.module.id)
              const p = progressByCurriculumId.get(recommended.module.id)
              const { completed, total } = computeModuleProgress(contents, p?.completedItemIds ?? [])
              return (
                <p className="life-economy-home__recommend-progress">
                  진행률 {completed}/{total}
                </p>
              )
            })()}
            <span className="life-economy-home__recommend-cta">
              {recommended.status === 'in_progress' ? '이어보기' : '시작하기'}
            </span>
          </Link>
        )}

        {hasStarted && !recommended && (
          <div className="life-economy-home__done-card">
            <p className="life-economy-home__done-title">생활로 읽는 경제를 완료했어요</p>
            <p className="life-economy-home__done-desc">
              금리·환율·물가와 정책이 내 생활에
              <br />
              전달되는 경로를 모두 살펴봤어요.
              <br />
              완료한 과정은 언제든 다시 복습할 수 있어요.
            </p>
          </div>
        )}

        {hasStarted && (
          <>
            <p className="life-economy-home__list-heading">전체 과정</p>
            <ul className="life-economy-home__list">
              {SORTED_MODULES.map((module) => {
                const status = getModuleUiStatus(module, progressByCurriculumId)
                const isEnterable = status !== 'unavailable'
                const content = (
                  <>
                    <span className="life-economy-home__row-order">{module.order}.</span>
                    <span className="life-economy-home__row-title">{module.title}</span>
                    <span className={`life-economy-home__row-status life-economy-home__row-status--${status}`}>
                      <span aria-hidden="true">{STATUS_ICON[status]}</span> {STATUS_LABEL[status]}
                    </span>
                  </>
                )
                return (
                  <li key={module.id}>
                    {isEnterable ? (
                      <Link to={`/learn/life-economy/${module.id}`} className="life-economy-home__row">
                        {content}
                      </Link>
                    ) : (
                      <div className="life-economy-home__row life-economy-home__row--disabled" aria-disabled="true">
                        {content}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
