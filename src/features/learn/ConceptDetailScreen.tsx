import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { curriculumProgressRepo, learningProgressRepo } from '../../db'
import type { ConceptCard, LearningProgress } from '../../types/models'
import { fetchConceptCards } from './learningData'
import './ConceptDetailScreen.css'

const STATUS_LABEL: Record<LearningProgress['status'], string> = {
  unread: '아직 읽지 않음',
  reading: '읽는 중',
  read: '읽어봄',
}

const DIFFICULTY_LABEL: Record<ConceptCard['difficulty'], string> = {
  basic: '기초',
  intermediate: '중급',
}

export function ConceptDetailScreen() {
  const { conceptId } = useParams<{ conceptId: string }>()
  const [allConcepts, setAllConcepts] = useState<ConceptCard[] | null>(null)
  const [progress, setProgress] = useState<LearningProgress | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [{ concepts }, existingProgress] = await Promise.all([
        fetchConceptCards(),
        conceptId ? learningProgressRepo.getLearningProgress(conceptId) : Promise.resolve(undefined),
      ])
      if (cancelled) return
      setAllConcepts(concepts)

      if (conceptId) {
        const currentStatus = existingProgress?.status ?? 'unread'
        if (currentStatus === 'unread') {
          await learningProgressRepo.setReadStatus(conceptId, 'concept', 'reading')
          if (cancelled) return
          setProgress(await learningProgressRepo.getLearningProgress(conceptId) ?? null)
        } else {
          setProgress(existingProgress ?? null)
        }
      }
      setLoaded(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [conceptId])

  const concept = allConcepts?.find((c) => c.id === conceptId) ?? null
  const relatedConcepts = concept
    ? (concept.relatedConceptIds ?? [])
        .map((id) => allConcepts?.find((c) => c.id === id))
        .filter((c): c is ConceptCard => Boolean(c))
    : []

  async function handleToggleRead() {
    if (!conceptId) return
    if (progress?.status === 'read') {
      await learningProgressRepo.setReadStatus(conceptId, 'concept', 'reading')
    } else {
      // '읽어봄'으로 바뀔 때만 커리큘럼 완료 처리(§13 공통 완료 처리 함수)를 함께
      // 호출한다. 다시 '읽는 중'으로 되돌려도 이미 인정된 커리큘럼 완료는 취소하지 않는다.
      await curriculumProgressRepo.completeLearningItem(conceptId, 'concept')
    }
    setProgress((await learningProgressRepo.getLearningProgress(conceptId)) ?? null)
  }

  async function handleToggleSaved() {
    if (!conceptId) return
    await learningProgressRepo.setSaved(conceptId, 'concept', !progress?.saved)
    setProgress(await learningProgressRepo.getLearningProgress(conceptId) ?? null)
  }

  const isRead = progress?.status === 'read'

  return (
    <div className="concept-detail">
      <ScreenHeader title="개념 카드" />
      <div className="concept-detail__body">
        {!loaded && <p className="concept-detail__state">불러오는 중…</p>}
        {loaded && !concept && <p className="concept-detail__state">이 개념 카드를 찾을 수 없어요.</p>}

        {concept && (
          <>
            <div className="concept-detail__header">
              <h1 className="concept-detail__title">{concept.title}</h1>
              <div className="concept-detail__meta">
                <span className="concept-detail__badge">⏱ 약 {concept.estimatedMinutes}분</span>
                <span className="concept-detail__badge">{DIFFICULTY_LABEL[concept.difficulty]}</span>
                <span className="concept-detail__badge concept-detail__badge--status">
                  {isRead ? '✓ 읽어봄' : STATUS_LABEL[progress?.status ?? 'unread']}
                </span>
                <button
                  type="button"
                  onClick={handleToggleSaved}
                  className="concept-detail__save-button"
                  aria-pressed={Boolean(progress?.saved)}
                  aria-label={progress?.saved ? '저장 해제' : '저장하기'}
                >
                  {progress?.saved ? '★ 저장됨' : '☆ 저장'}
                </button>
              </div>
            </div>

            <section className="concept-detail__hero">
              <span className="concept-detail__hero-icon" aria-hidden="true">
                💬
              </span>
              <p className="concept-detail__hero-text">{concept.oneLineSummary}</p>
            </section>

            <section className="concept-detail__section">
              <h2>
                <span className="concept-detail__section-icon" aria-hidden="true">
                  📖
                </span>
                쉽게 설명하면
              </h2>
              <p>{concept.definition}</p>
            </section>
            <section className="concept-detail__section">
              <h2>
                <span className="concept-detail__section-icon" aria-hidden="true">
                  💡
                </span>
                예시
              </h2>
              <p>{concept.example}</p>
            </section>
            <section className="concept-detail__section">
              <h2>
                <span className="concept-detail__section-icon" aria-hidden="true">
                  🔗
                </span>
                내 자산과 어떤 관련이 있나요?
              </h2>
              <p>{concept.whyItMatters}</p>
            </section>
            {concept.checklist.length > 0 && (
              <section className="concept-detail__section">
                <h2>
                  <span className="concept-detail__section-icon" aria-hidden="true">
                    ✅
                  </span>
                  확인해볼 것
                </h2>
                <ul className="concept-detail__checklist">
                  {concept.checklist.map((item, i) => (
                    <li key={i}>
                      <span aria-hidden="true">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section className="concept-detail__section concept-detail__sources">
              <h2>
                <span className="concept-detail__section-icon" aria-hidden="true">
                  📚
                </span>
                공식 출처
              </h2>
              <ul>
                {concept.sources.map((source, i) => (
                  <li key={i}>
                    {source.organization} · {source.title}
                    <br />
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      원문 보기 (새 창)
                    </a>
                  </li>
                ))}
              </ul>
              <span className="concept-detail__reviewed-at">검수일 {concept.reviewedAt}</span>
            </section>

            {relatedConcepts.length > 0 && (
              <section className="concept-detail__section">
                <h2>관련 개념</h2>
                <ul className="concept-detail__related-list">
                  {relatedConcepts.map((related) => (
                    <li key={related.id}>
                      <Link to={`/learn/concepts/${related.id}`}>{related.title} ›</Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 스크롤 위치와 무관하게 항상 보이는 완료 버튼 — 헤더까지 다시 스크롤하지
                않아도 바로 다음 단계로 넘어갈 수 있게 한다. */}
            <div className="concept-detail__footer">
              <button
                type="button"
                onClick={handleToggleRead}
                className={`concept-detail__done-button${isRead ? ' concept-detail__done-button--done' : ''}`}
              >
                {isRead ? '✓ 다 읽었어요' : '다 읽었어요'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
