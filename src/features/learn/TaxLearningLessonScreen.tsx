import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { curriculumProgressRepo } from '../../db'
import { TAX_LEARNING_CONTENTS, TAX_LEARNING_DISCLAIMER, TAX_LEARNING_VERSION, TAX_LESSONS, TAX_STAGES } from '../../content/taxLearning'
import { LEARNING_SOURCES } from '../../content/learningSources'
import { getAdjacentLessons, quizItemKey } from '../../domain'
import type { CurriculumProgress } from '../../types/models'
import { QuizItem } from './curriculum/QuizItem'
import './TaxLearningLessonScreen.css'

export function TaxLearningLessonScreen() {
  const { lessonId } = useParams<{ lessonId: string }>()

  const [loaded, setLoaded] = useState(false)
  const [progress, setProgress] = useState<CurriculumProgress | null>(null)

  const lesson = useMemo(() => TAX_LESSONS.find((l) => l.id === lessonId) ?? null, [lessonId])
  const stage = useMemo(() => TAX_STAGES.find((s) => s.id === lesson?.stageId) ?? null, [lesson])
  const contentItemId = lesson ? `${lesson.id}-complete` : null

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!lessonId) return
      setLoaded(false)
      // 단순히 화면을 열어보기만 해도 진행 기록이 생기면 목록에서 "진행 중"으로
      // 잘못 표시된다 — 방문만으로는 어떤 기록도 만들거나 건드리지 않고, 기존
      // 기록이 있는지 읽기만 한다(ensureStarted는 완료 버튼을 눌렀을 때만 호출).
      const existing = await curriculumProgressRepo.getCurriculumProgress(lessonId)
      if (cancelled) return
      setProgress(existing ?? null)
      setLoaded(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [lessonId])

  async function handleComplete() {
    if (!lessonId || !contentItemId) return
    await curriculumProgressRepo.completeLearningItem(contentItemId, 'example', TAX_LEARNING_CONTENTS, TAX_LEARNING_VERSION)
    const updated = await curriculumProgressRepo.getCurriculumProgress(lessonId)
    setProgress(updated ?? null)
  }

  if (!lessonId || !lesson || !stage) {
    return (
      <div>
        <ScreenHeader title="생활 세금 공부" />
        <div className="tax-lesson__body">
          <p className="tax-lesson__state">이 과정을 찾을 수 없어요.</p>
          <Link to="/learn/tax" className="tax-lesson__list-link">
            전체 과정으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  if (!loaded) {
    return (
      <div>
        <ScreenHeader title={lesson.title} />
        <div className="tax-lesson__body">
          <p className="tax-lesson__state">불러오는 중…</p>
        </div>
      </div>
    )
  }

  const isDone = progress?.status === 'completed'
  const { prev: prevLesson, next: nextLesson } = getAdjacentLessons(lesson.id, TAX_LESSONS)
  const sources = lesson.meta.officialSourceIds
    .map((id) => LEARNING_SOURCES.find((s) => s.id === id))
    .filter((s): s is (typeof LEARNING_SOURCES)[number] => s !== undefined)

  return (
    <div>
      <ScreenHeader title={lesson.title} />
      <div className="tax-lesson__body">
        <div className="tax-lesson__meta-row">
          <p className="tax-lesson__step">
            {stage.order}단계 · {stage.title} · {lesson.order}/25
          </p>
        </div>
        <h1 className="tax-lesson__title">{lesson.title}</h1>
        <p className="tax-lesson__base-year">
          {lesson.meta.baseYear}년 기준 · 마지막 검토 {lesson.meta.lastReviewedAt}
        </p>

        <section className="tax-lesson-body">
          <h2 className="tax-lesson-body__heading">오늘의 질문</h2>
          <p className="tax-lesson-body__question">{lesson.todayQuestion}</p>

          <h2 className="tax-lesson-body__heading">한 문장 핵심</h2>
          <p className="tax-lesson-body__core">{lesson.coreSentence}</p>

          <h2 className="tax-lesson-body__heading">쉽게 이해하기</h2>
          {lesson.explanation.map((p, i) => (
            <p key={i} className="tax-lesson-body__paragraph">
              {p}
            </p>
          ))}

          <h2 className="tax-lesson-body__heading">생활 사례</h2>
          <p className="tax-lesson-body__paragraph">{lesson.lifeExample}</p>

          <h2 className="tax-lesson-body__heading">숫자로 이해하기</h2>
          <div className="tax-lesson-body__number-card">
            <p className="tax-lesson-body__number-desc">{lesson.numberExample.description}</p>
            <ul className="tax-lesson-body__number-lines">
              {lesson.numberExample.lines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            <p className="tax-lesson-body__number-caveat">
              <span aria-hidden="true">ℹ️</span> {lesson.numberExample.caveat}
            </p>
          </div>

          <h2 className="tax-lesson-body__heading">헷갈리기 쉬운 점</h2>
          <ul className="tax-lesson-body__pitfall-list">
            {lesson.pitfalls.map((p, i) => (
              <li key={i} className="tax-lesson-body__pitfall-item">
                {p}
              </li>
            ))}
          </ul>
        </section>

        <section className="tax-lesson__quiz-section" aria-labelledby="tax-lesson-quiz-heading">
          <h2 id="tax-lesson-quiz-heading" className="tax-lesson__quiz-heading">
            <span aria-hidden="true">❓</span> 확인 문제
          </h2>
          {/* 퀴즈는 저장하지 않는다 — 다시 방문할 때마다 새로 풀 수 있고(§요구사항
              "동일 학습을 다시 보면 다시 풀 수 있음"), 정답 여부와 무관하게 아래
              "학습 완료" 버튼과는 독립적으로 동작한다(§요구사항 "문제를 틀려도
              학습 완료를 막지 않음"). key를 문제 순번(i)만으로 주면 이전/다음
              학습으로 이동해도 같은 위치의 QuizItem이 재사용돼(React Router가
              같은 화면 컴포넌트 인스턴스를 그대로 재사용하므로) 이전 학습에서
              고른 답이 새 학습에 그대로 남는 버그가 생긴다 — key에 lesson.id를
              반드시 포함해 학습이 바뀌면 QuizItem이 확실히 새로 마운트되고
              내부 상태(selectedIndex·acknowledged)가 초기화되게 한다. */}
          {lesson.quiz.map((q, i) => (
            <div key={quizItemKey(lesson.id, i)} className="tax-lesson__quiz-item">
              <QuizItem
                quiz={{ question: q.question, choices: q.choices, correctIndex: q.correctIndex, explanation: q.explanation }}
                completed={false}
                onComplete={() => {}}
              />
            </div>
          ))}
        </section>

        {sources.length > 0 && (
          <section className="tax-lesson__sources" aria-labelledby="tax-lesson-sources-heading">
            <h2 id="tax-lesson-sources-heading" className="tax-lesson-body__heading">
              <span aria-hidden="true">📚</span> 공식 자료
            </h2>
            <ul className="tax-lesson__sources-list">
              {sources.map((source) => (
                <li key={source.id}>
                  {source.publisher} · {source.name}
                  <br />
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    원문 보기 (새 창)
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="tax-lesson__footer">
          <button
            type="button"
            onClick={handleComplete}
            className={`tax-lesson__done-button${isDone ? ' tax-lesson__done-button--done' : ''}`}
          >
            {isDone ? '✓ 학습을 완료했어요' : '학습 완료'}
          </button>
        </div>

        <p className="tax-lesson__disclaimer">{TAX_LEARNING_DISCLAIMER}</p>

        <div className="tax-lesson__nav">
          {prevLesson ? (
            <Link to={`/learn/tax/${prevLesson.id}`} className="tax-lesson__nav-link">
              ‹ 이전 학습
            </Link>
          ) : (
            <span />
          )}
          <Link to="/learn/tax" className="tax-lesson__list-link">
            전체 과정
          </Link>
          {nextLesson ? (
            <Link to={`/learn/tax/${nextLesson.id}`} className="tax-lesson__nav-link">
              다음 학습 ›
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  )
}
