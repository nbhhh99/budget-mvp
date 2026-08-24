import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { curriculumProgressRepo } from '../../db'
import { CURRICULUM_MODULES, LEARNING_CONTENTS } from '../../content/curriculum'
import { computeModuleProgress, getUnlockedModuleIds, isModuleComplete } from '../../domain'
import type { ConceptCard, CurriculumProgress, LearningContent } from '../../types/models'
import { fetchConceptCards } from './learningData'
import { QuizItem } from './curriculum/QuizItem'
import { ChecklistItem } from './curriculum/ChecklistItem'
import './CurriculumModuleScreen.css'

export function CurriculumModuleScreen() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()

  const [loaded, setLoaded] = useState(false)
  const [progress, setProgress] = useState<CurriculumProgress | null>(null)
  const [allProgress, setAllProgress] = useState<CurriculumProgress[]>([])
  const [concepts, setConcepts] = useState<ConceptCard[]>([])
  // 이 화면을 열었을 때 이미 완료 상태였는지 — moduleId가 바뀔 때마다 새로 계산해야
  // 하므로(같은 컴포넌트 인스턴스가 이전/다음 과정 이동으로 재사용될 수 있음) ref가
  // 아니라 상태로 두고, moduleId가 바뀌는 effect 안에서만 한 번 설정한다.
  const [initiallyComplete, setInitiallyComplete] = useState<boolean | null>(null)

  const module = useMemo(() => CURRICULUM_MODULES.find((m) => m.id === moduleId) ?? null, [moduleId])
  const contents = useMemo(
    () =>
      LEARNING_CONTENTS.filter((item) => item.curriculumId === moduleId).sort((a, b) => a.order - b.order),
    [moduleId],
  )

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!moduleId) return
      setLoaded(false)
      setInitiallyComplete(null)
      const [allCurriculumProgress, { concepts: loadedConcepts }] = await Promise.all([
        curriculumProgressRepo.getAllCurriculumProgress(),
        fetchConceptCards(),
      ])
      if (cancelled) return

      setAllProgress(allCurriculumProgress)
      setConcepts(loadedConcepts)

      const unlocked = getUnlockedModuleIds(CURRICULUM_MODULES, allCurriculumProgress)
      const isUnlocked = unlocked.includes(moduleId)
      const hasContent = (CURRICULUM_MODULES.find((m) => m.id === moduleId)?.itemIds.length ?? 0) > 0

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
      curriculumProgressRepo.getAllCurriculumProgress(),
    ])
    setProgress(updated ?? null)
    setAllProgress(all)
  }

  async function handleQuizOrChecklistComplete(contentId: string, contentType: 'quiz' | 'checklist') {
    await curriculumProgressRepo.completeLearningItem(contentId, contentType)
    await refreshProgress()
  }

  if (!moduleId || !module) {
    return (
      <div>
        <ScreenHeader title="차근차근 돈 공부" />
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

  const unlocked = getUnlockedModuleIds(CURRICULUM_MODULES, allProgress)
  const isUnlocked = unlocked.includes(module.id)
  const hasContent = module.itemIds.length > 0
  const completedItemIds = progress?.completedItemIds ?? []
  const { completed: completedCount, total } = computeModuleProgress(contents, completedItemIds)
  const nowComplete = isModuleComplete(contents, completedItemIds)
  const showCompletionView = nowComplete && initiallyComplete === false

  const sortedModules = [...CURRICULUM_MODULES].sort((a, b) => a.order - b.order)
  const currentIndex = sortedModules.findIndex((m) => m.id === module.id)
  const prevModule = currentIndex > 0 ? sortedModules[currentIndex - 1] : null
  const nextModule = currentIndex >= 0 && currentIndex < sortedModules.length - 1 ? sortedModules[currentIndex + 1] : null
  const quizItem = contents.find((item) => item.type === 'quiz')

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

  if (!hasContent) {
    return (
      <div>
        <ScreenHeader title={module.title} />
        <div className="curriculum-module__body">
          <p className="curriculum-module__description">{module.description}</p>
          <p className="curriculum-module__state">🛠 콘텐츠 준비 중이에요. 검증된 자료가 준비되면 열릴 예정이에요.</p>
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
            <p className="curriculum-module__done-desc">{module.description}</p>
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

  return (
    <div>
      <ScreenHeader title={module.title} />
      <div className="curriculum-module__body">
        <p className="curriculum-module__step">{module.order}단계</p>
        <p className="curriculum-module__description">{module.description}</p>
        <div className="curriculum-module__meta">
          {module.estimatedMinutes !== undefined && <span>예상 {module.estimatedMinutes}분</span>}
          <span>
            {completedCount}/{total} 완료
          </span>
        </div>

        {quizItem && (
          <button
            type="button"
            className="curriculum-module__shortcut-button"
            onClick={() => {
              const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
              document
                .getElementById(`item-${quizItem.id}`)
                ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
            }}
          >
            이미 알고 있어요 · 확인 문제 풀기
          </button>
        )}

        <ul className="curriculum-module__items">
          {contents.map((item) => {
            const isDone = completedItemIds.includes(item.id)

            // concept/calculator 항목은 기존 화면(개념 카드/계산기)으로 이동하는 게
            // 전부라, 카드 전체를 눌러도 이동하도록 <li> 자체를 링크로 감싼다
            // ("개념카드 보기" 글자만 눌러야 하는 문제를 없앤다).
            if (item.type === 'concept' && item.linkedConceptId) {
              const concept = concepts.find((c) => c.id === item.linkedConceptId)
              return (
                <li key={item.id} id={`item-${item.id}`}>
                  <Link
                    to={`/learn/concepts/${item.linkedConceptId}`}
                    className="curriculum-module__item curriculum-module__item--link"
                  >
                    <span className="curriculum-module__item-check" aria-hidden="true">
                      {isDone ? '✓' : '○'}
                    </span>
                    <span className="curriculum-module__item-main">
                      <span className="curriculum-module__item-title">
                        <span className="curriculum-module__item-type-icon" aria-hidden="true">
                          📖
                        </span>
                        {item.title}
                      </span>
                      {concept && <span className="curriculum-module__item-preview">{concept.oneLineSummary}</span>}
                    </span>
                    <span className="curriculum-module__item-chevron" aria-hidden="true">
                      ›
                    </span>
                  </Link>
                </li>
              )
            }

            if (item.type === 'calculator' && item.linkedCalculatorId) {
              return (
                <li key={item.id} id={`item-${item.id}`}>
                  <Link
                    to={`/learn/calculators/${item.linkedCalculatorId}`}
                    className="curriculum-module__item curriculum-module__item--link"
                  >
                    <span className="curriculum-module__item-check" aria-hidden="true">
                      {isDone ? '✓' : '○'}
                    </span>
                    <span className="curriculum-module__item-main">
                      <span className="curriculum-module__item-title">
                        <span className="curriculum-module__item-type-icon" aria-hidden="true">
                          🧮
                        </span>
                        {item.title}
                      </span>
                    </span>
                    <span className="curriculum-module__item-chevron" aria-hidden="true">
                      ›
                    </span>
                  </Link>
                </li>
              )
            }

            return (
              <li key={item.id} id={`item-${item.id}`} className="curriculum-module__item">
                <div className="curriculum-module__item-header">
                  <span className="curriculum-module__item-check" aria-hidden="true">
                    {isDone ? '✓' : '○'}
                  </span>
                  <span className="curriculum-module__item-title">
                    <span className="curriculum-module__item-type-icon" aria-hidden="true">
                      {item.type === 'quiz' ? '❓' : '✅'}
                    </span>
                    {item.title}
                  </span>
                </div>
                <ContentItemBody
                  item={item}
                  isDone={isDone}
                  onQuizOrChecklistComplete={handleQuizOrChecklistComplete}
                />
              </li>
            )
          })}
        </ul>

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

interface ContentItemBodyProps {
  item: LearningContent
  isDone: boolean
  onQuizOrChecklistComplete: (contentId: string, contentType: 'quiz' | 'checklist') => void
}

function ContentItemBody({ item, isDone, onQuizOrChecklistComplete }: ContentItemBodyProps) {
  if (item.type === 'quiz' && item.quiz) {
    return (
      <div className="curriculum-module__item-body">
        <QuizItem
          quiz={item.quiz}
          completed={isDone}
          onComplete={() => onQuizOrChecklistComplete(item.id, 'quiz')}
        />
      </div>
    )
  }

  if (item.type === 'checklist' && item.checklistItems) {
    return (
      <div className="curriculum-module__item-body">
        <ChecklistItem
          items={item.checklistItems}
          completed={isDone}
          onComplete={() => onQuizOrChecklistComplete(item.id, 'checklist')}
        />
      </div>
    )
  }

  return null
}
