import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { learningProgressRepo } from '../../db'
import type { ConceptCard, MonthlyLessonIndex, MonthlyMoneyLesson } from '../../types/models'
import { computeLatestReviewedYearMonth, listReviewedYearMonths, resolveLearningContentView } from '../../domain'
import { fetchConceptCards, fetchMonthlyLesson, fetchMonthlyLessonIndex } from './learningData'
import { formatKoreanYearMonth } from '../../utils/date'
import './MonthlyLessonScreen.css'

const CALCULATOR_TITLES: Record<string, string> = {
  compound_interest: '복리 계산기',
  inflation_adjusted: '물가 반영 계산기',
  goal_savings: '목표저축 계산기',
  savings_rate: '저축률 계산기',
}

export function MonthlyLessonScreen() {
  const { yearMonth: routeYearMonth } = useParams<{ yearMonth?: string }>()
  const [index, setIndex] = useState<MonthlyLessonIndex | null>(null)
  const [yearMonth, setYearMonth] = useState<string | null>(routeYearMonth ?? null)
  const [viewKind, setViewKind] = useState<'loading' | 'ready' | 'offline_cached' | 'no_data'>(
    'loading',
  )
  const [noDataOnline, setNoDataOnline] = useState(true)
  const [lesson, setLesson] = useState<MonthlyMoneyLesson | null>(null)
  const [concepts, setConcepts] = useState<ConceptCard[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const loadedIndex = await fetchMonthlyLessonIndex()
      if (cancelled) return
      setIndex(loadedIndex)
      if (!routeYearMonth) {
        const latest = loadedIndex ? computeLatestReviewedYearMonth(loadedIndex.entries) : null
        setYearMonth(latest)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [routeYearMonth])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!yearMonth) {
        if (index) {
          setViewKind('no_data')
          setNoDataOnline(navigator.onLine)
        }
        return
      }
      setViewKind('loading')
      const [fetched, { concepts: loadedConcepts }] = await Promise.all([
        fetchMonthlyLesson(yearMonth),
        fetchConceptCards(),
      ])
      if (cancelled) return
      setConcepts(loadedConcepts)

      const view = resolveLearningContentView({ online: navigator.onLine, fetched, cached: null })
      if (view.kind !== 'ready' && view.kind !== 'offline_cached') {
        setViewKind('no_data')
        setNoDataOnline(view.kind === 'no_data' ? view.online : navigator.onLine)
        setLesson(null)
        return
      }
      setLesson(view.content)
      setViewKind(view.kind)
      await learningProgressRepo.setReadStatus(view.content.id, 'monthly_lesson', 'reading')
    }
    load()
    return () => {
      cancelled = true
    }
  }, [yearMonth, index])

  const availableMonths = index ? listReviewedYearMonths(index.entries) : []
  const relatedConcepts = lesson
    ? lesson.relatedConceptIds
        .map((id) => concepts.find((c) => c.id === id))
        .filter((c): c is ConceptCard => Boolean(c))
    : []

  return (
    <div className="monthly-lesson">
      <ScreenHeader title="이번 달 돈 공부" />
      <div className="monthly-lesson__body">
        {availableMonths.length > 1 && yearMonth && (
          <label className="monthly-lesson__month-picker">
            <span>연월 선택</span>
            <select value={yearMonth} onChange={(e) => setYearMonth(e.target.value)}>
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {formatKoreanYearMonth(ym)}
                </option>
              ))}
            </select>
          </label>
        )}

        {viewKind === 'loading' && <p className="monthly-lesson__state">불러오는 중…</p>}
        {viewKind === 'no_data' && (
          <p className="monthly-lesson__state">
            {noDataOnline
              ? '아직 검수된 이번 달 돈 공부 콘텐츠가 없어요.'
              : '오프라인 상태이고, 저장된 콘텐츠도 없어요. 네트워크 연결 후 다시 시도해 주세요.'}
          </p>
        )}

        {lesson && (
          <>
            {viewKind === 'offline_cached' && (
              <p className="monthly-lesson__banner">
                오프라인 저장본입니다. 최신 내용이 아닐 수 있어요.
              </p>
            )}

            <p className="monthly-lesson__yearmonth">{formatKoreanYearMonth(lesson.yearMonth)}</p>
            <h1 className="monthly-lesson__title">{lesson.title}</h1>
            <p className="monthly-lesson__subtitle">{lesson.subtitle}</p>

            {lesson.sections.map((section, i) => (
              <section key={i} className="monthly-lesson__section">
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
              </section>
            ))}

            {lesson.relatedCalculatorIds.length > 0 && (
              <section className="monthly-lesson__section">
                <h2>직접 계산해보기</h2>
                <ul className="monthly-lesson__link-list">
                  {lesson.relatedCalculatorIds.map((id) => (
                    <li key={id}>
                      <Link to={`/learn/calculators/${id}`}>
                        {CALCULATOR_TITLES[id] ?? id} ›
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="monthly-lesson__section monthly-lesson__reflection">
              <h2>스스로 점검할 질문</h2>
              <p>{lesson.reflectionQuestion}</p>
            </section>

            <section className="monthly-lesson__section monthly-lesson__sources">
              <h2>공식 출처</h2>
              <ul>
                {lesson.sources.map((source, i) => (
                  <li key={i}>
                    {source.organization} · {source.title}
                    <br />
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      원문 보기 (새 창)
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            {relatedConcepts.length > 0 && (
              <section className="monthly-lesson__section">
                <h2>관련 개념 카드</h2>
                <ul className="monthly-lesson__link-list">
                  {relatedConcepts.map((concept) => (
                    <li key={concept.id}>
                      <Link to={`/learn/concepts/${concept.id}`}>{concept.title} ›</Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
