import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { curriculumProgressRepo } from '../../db'
import { ECONOMIC_HISTORY_CONTENTS, ECONOMIC_HISTORY_MODULES, ECONOMIC_HISTORY_VERSION } from '../../content/economicHistory'
import { computeModuleProgress, getModuleUiStatus, getRecommendedModule } from '../../domain'
import type { CurriculumProgress } from '../../types/models'
import './CurriculumHomeScreen.css'

const STATUS_LABEL: Record<string, string> = {
  available: '열림',
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

const SORTED_MODULES = [...ECONOMIC_HISTORY_MODULES].sort((a, b) => a.order - b.order)

export function CurriculumHomeScreen() {
  const [loaded, setLoaded] = useState(false)
  const [progress, setProgress] = useState<CurriculumProgress[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      // 과거(차근차근 돈 공부) 진행 기록이 남아있어도, 이 버전 필터를 거치면
      // 새 경제사 계산에는 전혀 반영되지 않는다(§11).
      const filtered = await curriculumProgressRepo.getCurriculumProgressForVersion(ECONOMIC_HISTORY_VERSION)
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
        <ScreenHeader title="차근차근 경제사" />
        <div className="curriculum-home__body">
          <p className="curriculum-home__state">불러오는 중…</p>
        </div>
      </div>
    )
  }

  const progressByCurriculumId = new Map(progress.map((p) => [p.curriculumId, p]))
  const recommended = getRecommendedModule(ECONOMIC_HISTORY_MODULES, progress)
  const hasStarted = progress.length > 0

  return (
    <div>
      <ScreenHeader title="차근차근 경제사" />
      <div className="curriculum-home__body">
        {!hasStarted && (
          <div className="curriculum-home__intro-card">
            <p className="curriculum-home__intro-text">
              돈과 경제가 지금의 모습이 된 과정을
              <br />
              핵심 사건으로 배워요.
            </p>
            <p className="curriculum-home__intro-meta">
              {ECONOMIC_HISTORY_MODULES.length}개 과정 · 학습 기한 없음 · 언제든 복습 가능
            </p>
            <Link
              to={`/learn/monthly/${SORTED_MODULES[0].id}`}
              className="curriculum-home__primary-button"
            >
              경제사 시작하기
            </Link>
          </div>
        )}

        {hasStarted && recommended && (
          <Link to={`/learn/monthly/${recommended.module.id}`} className="curriculum-home__recommend-card">
            <p className="curriculum-home__recommend-label">현재 추천 과정</p>
            <p className="curriculum-home__recommend-title">
              {recommended.module.order}단계 · {recommended.module.title}
            </p>
            <p className="curriculum-home__recommend-desc">{recommended.module.description}</p>
            {(() => {
              const contents = ECONOMIC_HISTORY_CONTENTS.filter((c) => c.curriculumId === recommended.module.id)
              const p = progressByCurriculumId.get(recommended.module.id)
              const { completed, total } = computeModuleProgress(contents, p?.completedItemIds ?? [])
              return (
                <p className="curriculum-home__recommend-progress">
                  진행률 {completed}/{total}
                </p>
              )
            })()}
            <span className="curriculum-home__recommend-cta">
              {recommended.status === 'in_progress' ? '이어보기' : '시작하기'}
            </span>
          </Link>
        )}

        {hasStarted && !recommended && (
          <div className="curriculum-home__done-card">
            <p className="curriculum-home__done-title">차근차근 경제사를 완료했어요</p>
            <p className="curriculum-home__done-desc">
              돈과 은행의 탄생부터 지금의 디지털 금융까지 {ECONOMIC_HISTORY_MODULES.length}개 핵심 흐름을
              모두 살펴봤어요.
              <br />
              완료한 과정은 언제든 다시 복습할 수 있어요.
            </p>
          </div>
        )}

        {hasStarted && (
          <>
            <p className="curriculum-home__list-heading">전체 과정</p>
            <ul className="curriculum-home__list">
              {SORTED_MODULES.map((module) => {
                const status = getModuleUiStatus(module, progressByCurriculumId)
                const isEnterable = status !== 'unavailable'
                const content = (
                  <>
                    <span className="curriculum-home__row-order">{module.order}.</span>
                    <span className="curriculum-home__row-title">{module.title}</span>
                    <span className={`curriculum-home__row-status curriculum-home__row-status--${status}`}>
                      <span aria-hidden="true">{STATUS_ICON[status]}</span> {STATUS_LABEL[status]}
                    </span>
                  </>
                )
                return (
                  <li key={module.id}>
                    {isEnterable ? (
                      <Link to={`/learn/monthly/${module.id}`} className="curriculum-home__row">
                        {content}
                      </Link>
                    ) : (
                      <div className="curriculum-home__row curriculum-home__row--disabled" aria-disabled="true">
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
