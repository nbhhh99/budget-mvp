import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { categoriesRepo, learningProgressRepo, transactionsRepo } from '../../db'
import type { ConceptCard, LearningProgress } from '../../types/models'
import { computeHeldAssetTypes, scoreConceptCards, sortByRelevance } from '../../domain'
import { fetchConceptCards } from './learningData'
import './ConceptListScreen.css'

const STATUS_LABEL: Record<LearningProgress['status'], string> = {
  unread: '아직 읽지 않음',
  reading: '읽는 중',
  read: '읽어봄',
}
const DIFFICULTY_LABEL: Record<ConceptCard['difficulty'], string> = {
  basic: '기초',
  intermediate: '중급',
}

export function ConceptListScreen() {
  const [loaded, setLoaded] = useState(false)
  const [concepts, setConcepts] = useState<ConceptCard[]>([])
  const [skippedCount, setSkippedCount] = useState(0)
  const [progressByConceptId, setProgressByConceptId] = useState<Map<string, LearningProgress>>(
    new Map(),
  )

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [{ concepts: loadedConcepts, skippedCount: skipped }, categories, transactions, progress] =
        await Promise.all([
          fetchConceptCards(),
          categoriesRepo.getAllCategories(),
          transactionsRepo.getAllTransactions(),
          learningProgressRepo.getAllLearningProgress(),
        ])
      if (cancelled) return

      const heldAssetTypes = computeHeldAssetTypes(categories, transactions)
      const scored = scoreConceptCards(loadedConcepts, heldAssetTypes)
      setConcepts(sortByRelevance(scored))
      setSkippedCount(skipped)
      setProgressByConceptId(new Map(progress.map((p) => [p.contentId, p])))
      setLoaded(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const empty = loaded && concepts.length === 0

  return (
    <div className="concept-list">
      <ScreenHeader title="개념 카드" />
      <div className="concept-list__body">
        {!loaded && <p className="concept-list__state">불러오는 중…</p>}
        {empty && <p className="concept-list__state">아직 표시할 개념 카드가 없어요.</p>}
        {skippedCount > 0 && (
          <p className="concept-list__banner">일부 카드({skippedCount}개)를 불러오지 못했어요.</p>
        )}
        <ul className="concept-list__list">
          {concepts.map((concept) => {
            const progress = progressByConceptId.get(concept.id)
            return (
              <li key={concept.id}>
                <Link to={`/learn/concepts/${concept.id}`} className="concept-list__item">
                  <div className="concept-list__item-header">
                    <span className="concept-list__title">{concept.title}</span>
                    {progress?.saved && (
                      <span className="concept-list__saved" aria-label="저장됨">
                        ★
                      </span>
                    )}
                  </div>
                  <p className="concept-list__summary">{concept.oneLineSummary}</p>
                  <div className="concept-list__meta">
                    <span className="concept-list__badge">{DIFFICULTY_LABEL[concept.difficulty]}</span>
                    <span className="concept-list__badge">약 {concept.estimatedMinutes}분</span>
                    <span className="concept-list__badge concept-list__badge--status">
                      {STATUS_LABEL[progress?.status ?? 'unread']}
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
