import type { ConceptCard, ConceptCategory } from '../types/models'

// 돈 개념 사전의 검색/필터/정렬을 화면과 분리된 순수 함수로 둔다(§6/§18).
// 개인화(자산유형 기반 정렬)는 쓰지 않고, 검색어·카테고리·가나다순만 사용한다.

export function searchConcepts(cards: ConceptCard[], query: string): ConceptCard[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return cards
  return cards.filter(
    (card) =>
      card.title.toLowerCase().includes(trimmed) ||
      card.shortDefinition.toLowerCase().includes(trimmed) ||
      (card.aliases ?? []).some((alias) => alias.toLowerCase().includes(trimmed)),
  )
}

export function filterByCategory(cards: ConceptCard[], category: ConceptCategory | 'all'): ConceptCard[] {
  if (category === 'all') return cards
  return cards.filter((card) => card.category === category)
}

// 가나다순(사전순) 정렬 — 안정 정렬로 동점(같은 제목)일 때 원래 순서를 유지한다.
export function sortConceptsAlphabetically(cards: ConceptCard[]): ConceptCard[] {
  return [...cards].sort((a, b) => a.title.localeCompare(b.title, 'ko'))
}
