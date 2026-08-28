import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { curriculumProgressRepo } from '../../db'
import {
  REAL_LIFE_ECONOMY_BODIES,
  REAL_LIFE_ECONOMY_CONTENTS,
  REAL_LIFE_ECONOMY_MODULES,
  REAL_LIFE_ECONOMY_VERSION,
} from '../../content/realLifeEconomy'
import { CONCEPTS } from '../../content/concepts'
import { computeModuleProgress, isModuleComplete } from '../../domain'
import type { CurriculumProgress } from '../../types/models'
import { QuizItem } from './curriculum/QuizItem'
import './LifeEconomyModuleScreen.css'

export function LifeEconomyModuleScreen() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()

  const [loaded, setLoaded] = useState(false)
  const [progress, setProgress] = useState<CurriculumProgress | null>(null)
  // 이 화면을 열었을 때 이미 완료 상태였는지 — moduleId가 바뀔 때마다 새로 계산해야
  // 하므로(같은 컴포넌트 인스턴스가 이전/다음 과정 이동으로 재사용될 수 있음) ref가
  // 아니라 상태로 두고, moduleId가 바뀌는 effect 안에서만 한 번 설정한다.
  const [initiallyComplete, setInitiallyComplete] = useState<boolean | null>(null)

  const module = useMemo(() => REAL_LIFE_ECONOMY_MODULES.find((m) => m.id === moduleId) ?? null, [moduleId])
  const contents = useMemo(
    () =>
      REAL_LIFE_ECONOMY_CONTENTS.filter((item) => item.curriculumId === moduleId).sort(
        (a, b) => a.order - b.order,
      ),
    [moduleId],
  )
  const body = moduleId ? REAL_LIFE_ECONOMY_BODIES[moduleId] : undefined
  const bodyItem = contents.find((item) => item.type === 'example')
  const quizItem = contents.find((item) => item.type === 'quiz')

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!moduleId) return
      setLoaded(false)
      setInitiallyComplete(null)

      // 순차 잠금 없이 모든 과정을 처음부터 자유롭게 선택할 수 있다 — 콘텐츠가
      // 준비된 과정인지만 확인한다.
      const hasContent = (REAL_LIFE_ECONOMY_MODULES.find((m) => m.id === moduleId)?.itemIds.length ?? 0) > 0

      if (hasContent) {
        const started = await curriculumProgressRepo.ensureStarted(moduleId, REAL_LIFE_ECONOMY_VERSION)
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
    const updated = await curriculumProgressRepo.getCurriculumProgress(moduleId)
    setProgress(updated ?? null)
  }

  async function handleComplete(contentId: string, contentType: 'example' | 'quiz') {
    await curriculumProgressRepo.completeLearningItem(contentId, contentType, REAL_LIFE_ECONOMY_CONTENTS, REAL_LIFE_ECONOMY_VERSION)
    await refreshProgress()
  }

  if (!moduleId || !module) {
    return (
      <div>
        <ScreenHeader title="생활로 읽는 경제" />
        <div className="life-economy-module__body">
          <p className="life-economy-module__state">이 과정을 찾을 수 없어요.</p>
        </div>
      </div>
    )
  }

  if (!loaded) {
    return (
      <div>
        <ScreenHeader title={module.title} />
        <div className="life-economy-module__body">
          <p className="life-economy-module__state">불러오는 중…</p>
        </div>
      </div>
    )
  }

  const hasContent = module.itemIds.length > 0
  const completedItemIds = progress?.completedItemIds ?? []
  const { completed: completedCount, total } = computeModuleProgress(contents, completedItemIds)
  const nowComplete = isModuleComplete(contents, completedItemIds)
  const showCompletionView = nowComplete && initiallyComplete === false

  const sortedModules = [...REAL_LIFE_ECONOMY_MODULES].sort((a, b) => a.order - b.order)
  const currentIndex = sortedModules.findIndex((m) => m.id === module.id)
  const prevModule = currentIndex > 0 ? sortedModules[currentIndex - 1] : null
  const nextModule =
    currentIndex >= 0 && currentIndex < sortedModules.length - 1 ? sortedModules[currentIndex + 1] : null

  if (!hasContent || !body || !bodyItem || !quizItem) {
    return (
      <div>
        <ScreenHeader title={module.title} />
        <div className="life-economy-module__body">
          <p className="life-economy-module__description">{module.description}</p>
          <p className="life-economy-module__state">🛠 검토 중이에요. 검증된 자료가 준비되면 열릴 예정이에요.</p>
          <Link to="/learn/life-economy" className="life-economy-module__list-link">
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
        <div className="life-economy-module__body">
          <div className="life-economy-module__done-card">
            <p className="life-economy-module__done-title">{module.title}를 완료했어요</p>
            <p className="life-economy-module__done-desc">{body.quickAnswer}</p>
          </div>

          {nextModule ? (
            <>
              <p className="life-economy-module__next-label">다음 과정</p>
              <p className="life-economy-module__next-title">{nextModule.title}</p>
              <button
                type="button"
                className="life-economy-module__primary-button"
                onClick={() => navigate(`/learn/life-economy/${nextModule.id}`)}
              >
                다음 과정 시작하기
              </button>
            </>
          ) : (
            <p className="life-economy-module__next-title">모든 과정을 완료했어요.</p>
          )}
          <Link to="/learn/life-economy" className="life-economy-module__list-link">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const bodyDone = completedItemIds.includes(bodyItem.id)
  const quizDone = completedItemIds.includes(quizItem.id)
  const relatedConcepts = (module.conceptIds ?? [])
    .map((id) => CONCEPTS.find((c) => c.id === id))
    .filter((c): c is (typeof CONCEPTS)[number] => c !== undefined && c.status === 'reviewed')

  return (
    <div>
      <ScreenHeader title={module.title} />
      <div className="life-economy-module__body">
        <div className="life-economy-module__meta-row">
          <p className="life-economy-module__step">{module.order}.</p>
        </div>
        <p className="life-economy-module__description">{module.description}</p>
        <div className="life-economy-module__meta">
          {module.estimatedMinutes !== undefined && <span>예상 {module.estimatedMinutes}분</span>}
          <span>
            {completedCount}/{total} 완료
          </span>
        </div>

        <section className="life-economy-body">
          <h2 className="life-economy-body__heading">오늘의 질문</h2>
          <p className="life-economy-body__question">{body.todayQuestion}</p>

          <h2 className="life-economy-body__heading">먼저 답하면</h2>
          <p className="life-economy-body__paragraph">{body.quickAnswer}</p>

          <h2 className="life-economy-body__heading">한눈에 보는 전달경로</h2>
          <ol className="life-economy-body__path">
            {body.transmissionPath.map((step, i) => (
              <li key={i} className="life-economy-body__path-step">
                {i > 0 && (
                  <span className="life-economy-body__path-arrow" aria-hidden="true">
                    ↓
                  </span>
                )}
                <span className="life-economy-body__path-label">{step}</span>
              </li>
            ))}
          </ol>

          <h2 className="life-economy-body__heading">왜 이런 일이 생길까</h2>
          {body.whyItHappens.map((p, i) => (
            <p key={i} className="life-economy-body__paragraph">
              {p}
            </p>
          ))}

          <h2 className="life-economy-body__heading">내 생활에서는</h2>
          <div className="life-economy-body__impact-list">
            {body.lifeExamples.map((example, i) => (
              <div key={i} className="life-economy-body__impact-card">
                <p className="life-economy-body__impact-situation">{example.situation}</p>
                <p className="life-economy-body__impact-text">{example.impact}</p>
              </div>
            ))}
          </div>

          {body.audienceComparisons && body.audienceComparisons.length > 0 && (
            <>
              <h2 className="life-economy-body__heading">사람마다 영향이 다른 이유</h2>
              <div className="life-economy-body__compare-list">
                {body.audienceComparisons.map((c, i) => (
                  <div key={i} className="life-economy-body__compare-card">
                    <div className="life-economy-body__compare-side">
                      <p className="life-economy-body__compare-label">{c.groupA}</p>
                      <p className="life-economy-body__compare-text">{c.groupAImpact}</p>
                    </div>
                    <div className="life-economy-body__compare-side">
                      <p className="life-economy-body__compare-label">{c.groupB}</p>
                      <p className="life-economy-body__compare-text">{c.groupBImpact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <h2 className="life-economy-body__heading">오해하기 쉬워요</h2>
          <div className="life-economy-body__myth-list">
            {body.myths.map((m, i) => (
              <div key={i} className="life-economy-body__myth-card">
                <p className="life-economy-body__myth-text">“{m.myth}”</p>
                <p className="life-economy-body__myth-correction">
                  <span aria-hidden="true">→</span> {m.correction}
                </p>
              </div>
            ))}
          </div>

          <h2 className="life-economy-body__heading">내가 확인할 것</h2>
          <ul className="life-economy-body__check-list">
            {body.checkItems.map((item, i) => (
              <li key={i} className="life-economy-body__check-item">
                {item}
              </li>
            ))}
          </ul>

          {relatedConcepts.length > 0 && (
            <>
              <h2 className="life-economy-body__heading">관련 개념</h2>
              <div className="life-economy-body__concept-chips">
                {relatedConcepts.map((c) => (
                  <Link key={c.id} to={`/learn/concepts/${c.id}`} className="life-economy-body__concept-chip">
                    {c.title} 자세히 보기 ›
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>

        <div className="life-economy-module__footer">
          <button
            type="button"
            onClick={() => handleComplete(bodyItem.id, 'example')}
            className={`life-economy-module__done-button${bodyDone ? ' life-economy-module__done-button--done' : ''}`}
          >
            {bodyDone ? '✓ 본문을 다 읽었어요' : '본문을 다 읽었어요'}
          </button>
        </div>

        <section className="life-economy-module__quiz-section">
          <h2 className="life-economy-module__quiz-heading">
            <span aria-hidden="true">❓</span> 확인 문제
          </h2>
          {quizItem.quiz && (
            <QuizItem quiz={quizItem.quiz} completed={quizDone} onComplete={() => handleComplete(quizItem.id, 'quiz')} />
          )}
        </section>

        {body.closingCta && (
          <Link to={body.closingCta.to} className="life-economy-module__closing-cta">
            {body.closingCta.label} ›
          </Link>
        )}

        <div className="life-economy-module__nav">
          {prevModule ? (
            <Link to={`/learn/life-economy/${prevModule.id}`} className="life-economy-module__nav-link">
              ‹ 이전 과정
            </Link>
          ) : (
            <span />
          )}
          <Link to="/learn/life-economy" className="life-economy-module__list-link">
            전체 과정
          </Link>
          {nextModule ? (
            <Link to={`/learn/life-economy/${nextModule.id}`} className="life-economy-module__nav-link">
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
