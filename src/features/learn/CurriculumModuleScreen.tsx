import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { curriculumProgressRepo } from '../../db'
import {
  ECONOMIC_HISTORY_CONTENTS,
  ECONOMIC_HISTORY_MODULES,
  ECONOMIC_HISTORY_VERSION,
  HISTORY_BODIES,
} from '../../content/economicHistory'
import { CONCEPTS } from '../../content/concepts'
import { computeModuleProgress, getUnlockedModuleIds, isModuleComplete } from '../../domain'
import type { CurriculumProgress } from '../../types/models'
import { QuizItem } from './curriculum/QuizItem'
import './CurriculumModuleScreen.css'

export function CurriculumModuleScreen() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()

  const [loaded, setLoaded] = useState(false)
  const [progress, setProgress] = useState<CurriculumProgress | null>(null)
  const [allProgress, setAllProgress] = useState<CurriculumProgress[]>([])
  // 이 화면을 열었을 때 이미 완료 상태였는지 — moduleId가 바뀔 때마다 새로 계산해야
  // 하므로(같은 컴포넌트 인스턴스가 이전/다음 과정 이동으로 재사용될 수 있음) ref가
  // 아니라 상태로 두고, moduleId가 바뀌는 effect 안에서만 한 번 설정한다.
  const [initiallyComplete, setInitiallyComplete] = useState<boolean | null>(null)

  const module = useMemo(() => ECONOMIC_HISTORY_MODULES.find((m) => m.id === moduleId) ?? null, [moduleId])
  const contents = useMemo(
    () =>
      ECONOMIC_HISTORY_CONTENTS.filter((item) => item.curriculumId === moduleId).sort(
        (a, b) => a.order - b.order,
      ),
    [moduleId],
  )
  const historyBody = moduleId ? HISTORY_BODIES[moduleId] : undefined
  const bodyItem = contents.find((item) => item.type === 'example')
  const quizItem = contents.find((item) => item.type === 'quiz')

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!moduleId) return
      setLoaded(false)
      setInitiallyComplete(null)
      const filtered = await curriculumProgressRepo.getCurriculumProgressForVersion(ECONOMIC_HISTORY_VERSION)
      if (cancelled) return
      setAllProgress(filtered)

      const unlocked = getUnlockedModuleIds(ECONOMIC_HISTORY_MODULES, filtered)
      const isUnlocked = unlocked.includes(moduleId)
      const hasContent = (ECONOMIC_HISTORY_MODULES.find((m) => m.id === moduleId)?.itemIds.length ?? 0) > 0

      if (isUnlocked && hasContent) {
        const started = await curriculumProgressRepo.ensureStarted(moduleId)
        if (cancelled) return
        setInitiallyComplete(started.status === 'completed')
        setProgress(started)
      } else {
        const existing = await curriculumProgressRepo.getCurriculumProgress(moduleId)
        if (cancelled) return
        setInitiallyComplete(existing?.status === 'completed')
        setProgress(existing ?? null)
      }
      setLoaded(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [moduleId])

  async function refreshProgress() {
    if (!moduleId) return
    const [updated, all] = await Promise.all([
      curriculumProgressRepo.getCurriculumProgress(moduleId),
      curriculumProgressRepo.getCurriculumProgressForVersion(ECONOMIC_HISTORY_VERSION),
    ])
    setProgress(updated ?? null)
    setAllProgress(all)
  }

  async function handleComplete(contentId: string, contentType: 'example' | 'quiz') {
    await curriculumProgressRepo.completeLearningItem(contentId, contentType)
    await refreshProgress()
  }

  if (!moduleId || !module) {
    return (
      <div>
        <ScreenHeader title="차근차근 경제사" />
        <div className="curriculum-module__body">
          <p className="curriculum-module__state">이 과정을 찾을 수 없어요.</p>
        </div>
      </div>
    )
  }

  if (!loaded) {
    return (
      <div>
        <ScreenHeader title={module.title} />
        <div className="curriculum-module__body">
          <p className="curriculum-module__state">불러오는 중…</p>
        </div>
      </div>
    )
  }

  const unlocked = getUnlockedModuleIds(ECONOMIC_HISTORY_MODULES, allProgress)
  const isUnlocked = unlocked.includes(module.id)
  const hasContent = module.itemIds.length > 0
  const completedItemIds = progress?.completedItemIds ?? []
  const { completed: completedCount, total } = computeModuleProgress(contents, completedItemIds)
  const nowComplete = isModuleComplete(contents, completedItemIds)
  const showCompletionView = nowComplete && initiallyComplete === false

  const sortedModules = [...ECONOMIC_HISTORY_MODULES].sort((a, b) => a.order - b.order)
  const currentIndex = sortedModules.findIndex((m) => m.id === module.id)
  const prevModule = currentIndex > 0 ? sortedModules[currentIndex - 1] : null
  const nextModule =
    currentIndex >= 0 && currentIndex < sortedModules.length - 1 ? sortedModules[currentIndex + 1] : null

  if (!isUnlocked) {
    return (
      <div>
        <ScreenHeader title={module.title} />
        <div className="curriculum-module__body">
          <p className="curriculum-module__description">{module.description}</p>
          <p className="curriculum-module__state">🔒 이전 과정을 완료하면 열려요.</p>
          <Link to="/learn/monthly" className="curriculum-module__list-link">
            전체 과정으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  if (!hasContent || !historyBody || !bodyItem || !quizItem) {
    return (
      <div>
        <ScreenHeader title={module.title} />
        <div className="curriculum-module__body">
          <p className="curriculum-module__description">{module.description}</p>
          <p className="curriculum-module__state">🛠 검토 중이에요. 검증된 자료가 준비되면 열릴 예정이에요.</p>
          <Link to="/learn/monthly" className="curriculum-module__list-link">
            전체 과정으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  if (showCompletionView) {
    return (
      <div>
        <ScreenHeader title={module.title} />
        <div className="curriculum-module__body">
          <div className="curriculum-module__done-card">
            <p className="curriculum-module__done-title">{module.title}를 완료했어요</p>
            <p className="curriculum-module__done-desc">{historyBody.takeaway}</p>
          </div>

          {nextModule ? (
            <>
              <p className="curriculum-module__next-label">다음 과정</p>
              <p className="curriculum-module__next-title">{nextModule.title}</p>
              <button
                type="button"
                className="curriculum-module__primary-button"
                onClick={() => navigate(`/learn/monthly/${nextModule.id}`)}
              >
                다음 과정 시작하기
              </button>
            </>
          ) : (
            <p className="curriculum-module__next-title">모든 과정을 완료했어요.</p>
          )}
          <Link to="/learn/monthly" className="curriculum-module__list-link">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const bodyDone = completedItemIds.includes(bodyItem.id)
  const quizDone = completedItemIds.includes(quizItem.id)
  const relatedConcepts = historyBody.relatedConceptIds
    .map((id) => CONCEPTS.find((c) => c.id === id))
    .filter((c): c is (typeof CONCEPTS)[number] => c !== undefined && c.status === 'reviewed')

  return (
    <div>
      <ScreenHeader title={module.title} />
      <div className="curriculum-module__body">
        <div className="curriculum-module__meta-row">
          <p className="curriculum-module__step">{module.order}단계</p>
          {module.periodLabel && <span className="curriculum-module__period">{module.periodLabel}</span>}
        </div>
        <p className="curriculum-module__description">{module.description}</p>
        <div className="curriculum-module__meta">
          {module.estimatedMinutes !== undefined && <span>예상 {module.estimatedMinutes}분</span>}
          <span>
            {completedCount}/{total} 완료
          </span>
        </div>

        <section className="history-body">
          <h2 className="history-body__heading">그때 무슨 일이 있었을까?</h2>
          {historyBody.whatHappened.map((p, i) => (
            <p key={i} className="history-body__paragraph">
              {p}
            </p>
          ))}

          <h2 className="history-body__heading">왜 일어났을까?</h2>
          {historyBody.whyItHappened.map((p, i) => (
            <p key={i} className="history-body__paragraph">
              {p}
            </p>
          ))}

          <h2 className="history-body__heading">사람들의 생활은 어떻게 달라졌을까?</h2>
          <p className="history-body__paragraph">{historyBody.dailyLifeImpact}</p>

          <h2 className="history-body__heading">오늘과 어떤 관계가 있을까?</h2>
          <p className="history-body__paragraph">{historyBody.todayConnection}</p>

          {relatedConcepts.length > 0 && (
            <>
              <h2 className="history-body__heading">함께 알아볼 개념</h2>
              <div className="history-body__concept-chips">
                {relatedConcepts.map((c) => (
                  <Link key={c.id} to={`/learn/concepts/${c.id}`} className="history-body__concept-chip">
                    {c.title} 자세히 보기 ›
                  </Link>
                ))}
              </div>
            </>
          )}

          <h2 className="history-body__heading">핵심 장면</h2>
          <p className="history-body__key-scene">{historyBody.keyScene}</p>

          <div className="history-body__takeaway">
            <span aria-hidden="true">💡</span>
            <p>{historyBody.takeaway}</p>
          </div>
        </section>

        <div className="curriculum-module__footer">
          <button
            type="button"
            onClick={() => handleComplete(bodyItem.id, 'example')}
            className={`curriculum-module__done-button${bodyDone ? ' curriculum-module__done-button--done' : ''}`}
          >
            {bodyDone ? '✓ 본문을 다 읽었어요' : '본문을 다 읽었어요'}
          </button>
        </div>

        <section className="curriculum-module__quiz-section">
          <h2 className="curriculum-module__quiz-heading">
            <span aria-hidden="true">❓</span> 확인 문제
          </h2>
          {quizItem.quiz && (
            <QuizItem quiz={quizItem.quiz} completed={quizDone} onComplete={() => handleComplete(quizItem.id, 'quiz')} />
          )}
        </section>

        <div className="curriculum-module__nav">
          {prevModule ? (
            <Link to={`/learn/monthly/${prevModule.id}`} className="curriculum-module__nav-link">
              ‹ 이전 과정
            </Link>
          ) : (
            <span />
          )}
          <Link to="/learn/monthly" className="curriculum-module__list-link">
            전체 과정
          </Link>
          {nextModule ? (
            <Link to={`/learn/monthly/${nextModule.id}`} className="curriculum-module__nav-link">
              다음 과정 ›
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  )
}
