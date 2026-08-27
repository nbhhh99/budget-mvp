import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { curriculumProgressRepo } from '../../db'
import { TAX_LEARNING_DISCLAIMER, TAX_LEARNING_VERSION, TAX_LESSONS, TAX_SCHEDULE, TAX_SCHEDULE_NOTICE, TAX_STAGES } from '../../content/taxLearning'
import { computeOverallTaxProgress, computeStageProgress, getNextIncompleteLesson } from '../../domain'
import type { CurriculumProgress } from '../../types/models'
import './TaxLearningHomeScreen.css'

type LessonStatus = 'completed' | 'in_progress' | 'not_started'

function statusOf(lessonId: string, progressByLessonId: Map<string, CurriculumProgress>): LessonStatus {
  const record = progressByLessonId.get(lessonId)
  if (record?.status === 'completed') return 'completed'
  if (record) return 'in_progress'
  return 'not_started'
}

const STATUS_LABEL: Record<LessonStatus, string> = { completed: '완료', in_progress: '진행 중', not_started: '시작 전' }
const STATUS_ICON: Record<LessonStatus, string> = { completed: '✓', in_progress: '◐', not_started: '○' }

export function TaxLearningHomeScreen() {
  const [loaded, setLoaded] = useState(false)
  const [progress, setProgress] = useState<CurriculumProgress[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      // 다른 커리큘럼(차근차근 경제사·생활로 읽는 경제)의 진행 기록이 있어도, 이
      // 버전 필터를 거치면 세금 학습 진행률 계산에 전혀 반영되지 않는다 — 별도
      // 저장이라는 §요구사항을 이 필터 하나로 만족한다(엔진은 공유, 기록은 분리).
      const filtered = await curriculumProgressRepo.getCurriculumProgressForVersion(TAX_LEARNING_VERSION)
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
        <ScreenHeader title="생활 세금 공부" />
        <div className="tax-home__body">
          <p className="tax-home__state">불러오는 중…</p>
        </div>
      </div>
    )
  }

  const progressByLessonId = new Map(progress.map((p) => [p.curriculumId, p]))
  const overall = computeOverallTaxProgress(TAX_LESSONS, progress)
  const next = getNextIncompleteLesson(TAX_LESSONS, progress)

  return (
    <div>
      <ScreenHeader title="생활 세금 공부" />
      <div className="tax-home__body">
        <p className="tax-home__subtitle">
          월급부터 연말정산, 부수입, 투자·부동산·증여까지 생활 속 세금을 차근차근 이해해요.
        </p>

        <div className="tax-home__progress-card">
          <p className="tax-home__progress-label">전체 진행률</p>
          <p className="tax-home__progress-count">
            {overall.completed}/{overall.total} 완료
          </p>
          <div className="tax-home__progress-bar" role="progressbar" aria-valuenow={overall.completed} aria-valuemin={0} aria-valuemax={overall.total}>
            <div className="tax-home__progress-fill" style={{ width: `${overall.total === 0 ? 0 : (overall.completed / overall.total) * 100}%` }} />
          </div>
        </div>

        {next ? (
          <Link to={`/learn/tax/${next.id}`} className="tax-home__continue-card">
            <p className="tax-home__continue-label">이어서 학습하기</p>
            <p className="tax-home__continue-title">
              {next.order}. {next.title}
            </p>
            <span className="tax-home__continue-cta">{overall.completed > 0 ? '이어보기' : '시작하기'}</span>
          </Link>
        ) : (
          <div className="tax-home__done-card">
            <p className="tax-home__done-title">생활 세금 공부를 모두 완료했어요</p>
            <p className="tax-home__done-desc">완료한 과정은 언제든 다시 읽을 수 있어요.</p>
          </div>
        )}

        {TAX_STAGES.map((stage) => {
          const stageLessons = TAX_LESSONS.filter((l) => l.stageId === stage.id).sort((a, b) => a.order - b.order)
          const stageProgress = computeStageProgress(stage, TAX_LESSONS, progress)
          return (
            <section key={stage.id} className="tax-home__stage" aria-labelledby={`tax-stage-${stage.id}`}>
              <div className="tax-home__stage-header">
                <h2 id={`tax-stage-${stage.id}`} className="tax-home__stage-title">
                  {stage.order}단계 · {stage.title}
                </h2>
                <span className="tax-home__stage-count">
                  {stageProgress.completed}/{stageProgress.total}
                </span>
              </div>
              <ul className="tax-home__list">
                {stageLessons.map((lesson) => {
                  const status = statusOf(lesson.id, progressByLessonId)
                  return (
                    <li key={lesson.id}>
                      <Link to={`/learn/tax/${lesson.id}`} className="tax-home__row">
                        <span className="tax-home__row-order">{lesson.order}.</span>
                        <span className="tax-home__row-title">{lesson.title}</span>
                        <span className={`tax-home__row-status tax-home__row-status--${status}`}>
                          <span aria-hidden="true">{STATUS_ICON[status]}</span> {STATUS_LABEL[status]}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}

        <section className="tax-home__schedule" aria-labelledby="tax-schedule-heading">
          <h2 id="tax-schedule-heading" className="tax-home__stage-title">
            세금 일정 한눈에 보기
          </h2>
          <ul className="tax-home__schedule-list">
            {TAX_SCHEDULE.map((item, i) => (
              <li key={i} className="tax-home__schedule-item">
                <span className="tax-home__schedule-period">{item.period}</span>
                <span className="tax-home__schedule-title">{item.title}</span>
                <p className="tax-home__schedule-desc">{item.description}</p>
              </li>
            ))}
          </ul>
          <p className="tax-home__schedule-notice">{TAX_SCHEDULE_NOTICE}</p>
        </section>

        <p className="tax-home__disclaimer">{TAX_LEARNING_DISCLAIMER}</p>
      </div>
    </div>
  )
}
