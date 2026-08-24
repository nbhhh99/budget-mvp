import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { CONCEPTS, CONCEPT_CATEGORY_LABEL } from '../../content/concepts'
import { filterByCategory, searchConcepts, sortConceptsAlphabetically } from '../../domain'
import type { ConceptCategory } from '../../types/models'
import './ConceptListScreen.css'

const CATEGORIES: ConceptCategory[] = [
  'daily-finance',
  'money-interest',
  'debt-credit',
  'investing',
  'financial-products',
  'insurance-pension-tax',
  'economy-market',
]

export function ConceptListScreen() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ConceptCategory | 'all'>('all')

  const results = useMemo(() => {
    const byCategory = filterByCategory(CONCEPTS, category)
    const bySearch = searchConcepts(byCategory, query)
    return sortConceptsAlphabetically(bySearch)
  }, [query, category])

  const isEmpty = results.length === 0

  return (
    <div className="concept-list">
      <ScreenHeader title="돈 개념 사전" />
      <div className="concept-list__body">
        <p className="concept-list__intro">궁금한 경제·금융 개념을 찾아보세요.</p>

        <div className="concept-list__search-row">
          <input
            type="search"
            className="concept-list__search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="개념 검색 (예: 복리, 환율, ETF)"
            aria-label="개념 검색"
          />
          {query && (
            <button
              type="button"
              className="concept-list__search-clear"
              onClick={() => setQuery('')}
              aria-label="검색어 지우기"
            >
              지우기
            </button>
          )}
        </div>

        <div className="concept-list__chips" role="tablist" aria-label="카테고리 필터">
          <button
            type="button"
            className={`concept-list__chip${category === 'all' ? ' concept-list__chip--active' : ''}`}
            onClick={() => setCategory('all')}
            aria-pressed={category === 'all'}
          >
            전체
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`concept-list__chip${category === c ? ' concept-list__chip--active' : ''}`}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
            >
              {CONCEPT_CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>

        {isEmpty && (
          <div className="concept-list__empty">
            <p>검색 결과가 없어요.</p>
            {(query || category !== 'all') && (
              <button
                type="button"
                className="concept-list__empty-reset"
                onClick={() => {
                  setQuery('')
                  setCategory('all')
                }}
              >
                검색 조건 초기화
              </button>
            )}
          </div>
        )}

        <ul className="concept-list__list">
          {results.map((concept) => (
            <li key={concept.id}>
              <Link to={`/learn/concepts/${concept.id}`} className="concept-list__item">
                <div className="concept-list__item-header">
                  <span className="concept-list__title">{concept.title}</span>
                  {concept.status === 'in_review' && (
                    <span className="concept-list__badge concept-list__badge--review">검토 중</span>
                  )}
                </div>
                {concept.status === 'reviewed' && (
                  <p className="concept-list__summary">{concept.shortDefinition}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
