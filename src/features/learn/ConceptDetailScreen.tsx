import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { learningProgressRepo } from '../../db'
import { CONCEPTS, CONCEPT_CATEGORY_LABEL } from '../../content/concepts'
import { LEARNING_SOURCES } from '../../content/learningSources'
import type { LearningProgress } from '../../types/models'
import './ConceptDetailScreen.css'

export function ConceptDetailScreen() {
  const { conceptId } = useParams<{ conceptId: string }>()
  const [progress, setProgress] = useState<LearningProgress | null>(null)
  const [loaded, setLoaded] = useState(false)

  const concept = CONCEPTS.find((c) => c.id === conceptId) ?? null
  const relatedConcepts = concept
    ? concept.relatedConceptIds.map((id) => CONCEPTS.find((c) => c.id === id)).filter((c): c is (typeof CONCEPTS)[number] => Boolean(c))
    : []
  const sources = concept ? concept.sourceIds.map((id) => LEARNING_SOURCES.find((s) => s.id === id)).filter((s): s is (typeof LEARNING_SOURCES)[number] => Boolean(s)) : []
  const bodyParagraphs = concept ? concept.body.split('\n\n').filter(Boolean) : []

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (conceptId) {
        const existing = await learningProgressRepo.getLearningProgress(conceptId)
        if (!cancelled) setProgress(existing ?? null)
      }
      if (!cancelled) setLoaded(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [conceptId])

  async function handleToggleSaved() {
    if (!conceptId) return
    await learningProgressRepo.setSaved(conceptId, 'concept', !progress?.saved)
    setProgress((await learningProgressRepo.getLearningProgress(conceptId)) ?? null)
  }

  return (
    <div className="concept-detail">
      <ScreenHeader title="금융 개념 노트" />
      <div className="concept-detail__body">
        {!loaded && <p className="concept-detail__state">불러오는 중…</p>}
        {loaded && !concept && <p className="concept-detail__state">이 개념 카드를 찾을 수 없어요.</p>}

        {concept && (
          <>
            <div className="concept-detail__header">
              <h1 className="concept-detail__title">{concept.title}</h1>
              <div className="concept-detail__meta">
                <span className="concept-detail__badge">{CONCEPT_CATEGORY_LABEL[concept.category]}</span>
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

            {concept.status === 'in_review' ? (
              <div className="concept-detail__review-notice">
                <p>아직 검토 중인 개념이에요.</p>
                <p className="concept-detail__review-sub">
                  정확한 설명을 준비하고 있어요. 출처가 확인되지 않은 내용은 미리 채워두지 않아요.
                </p>
              </div>
            ) : (
              <>
                <section className="concept-detail__hero">
                  <span className="concept-detail__hero-icon" aria-hidden="true">
                    💬
                  </span>
                  <p className="concept-detail__hero-text">{concept.shortDefinition}</p>
                </section>

                {bodyParagraphs.map((paragraph, i) => (
                  <p key={i} className="concept-detail__paragraph">
                    {paragraph}
                  </p>
                ))}

                {concept.keyPoints.length > 0 && (
                  <section className="concept-detail__section">
                    <h2>
                      <span className="concept-detail__section-icon" aria-hidden="true">
                        ✅
                      </span>
                      핵심
                    </h2>
                    <ul className="concept-detail__checklist">
                      {concept.keyPoints.map((point, i) => (
                        <li key={i}>
                          <span aria-hidden="true">·</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {concept.caution && (
                  <section className="concept-detail__section concept-detail__caution">
                    <h2>
                      <span className="concept-detail__section-icon" aria-hidden="true">
                        ⚠️
                      </span>
                      주의할 점
                    </h2>
                    <p>{concept.caution}</p>
                  </section>
                )}

                {relatedConcepts.length > 0 && (
                  <section className="concept-detail__section">
                    <h2>함께 보면 좋은 개념</h2>
                    <div className="concept-detail__related-chips">
                      {relatedConcepts.map((related) => (
                        <Link key={related.id} to={`/learn/concepts/${related.id}`} className="concept-detail__related-chip">
                          {related.title}
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {sources.length > 0 && (
                  <section className="concept-detail__section concept-detail__sources">
                    <h2>
                      <span className="concept-detail__section-icon" aria-hidden="true">
                        📚
                      </span>
                      출처
                    </h2>
                    <ul>
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
                    <span className="concept-detail__reviewed-at">검토일 {concept.reviewedAt}</span>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
