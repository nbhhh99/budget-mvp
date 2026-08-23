import type { AssetType, ConceptCard } from '../types/models'
import { computeHeldAssetTypes } from './briefingRelevance'

// 자산 유형 보유 여부 계산은 브리핑과 완전히 동일한 로직을 쓴다 — 중복 구현하지 않는다.
export { computeHeldAssetTypes }

export interface ScoredConceptCard extends ConceptCard {
  relevanceScore: number
}

// §7: 개인화는 순서만 조정하고 콘텐츠를 숨기지 않는다 — 카드를 절대 제거하지 않는다.
export function scoreConceptCards(
  cards: ConceptCard[],
  heldAssetTypes: Set<AssetType>,
): ScoredConceptCard[] {
  return cards.map((card) => ({
    ...card,
    relevanceScore: card.relatedAssetTypes.filter((type) => heldAssetTypes.has(type)).length,
  }))
}

// 관련도 점수로 정렬만 하고 목록을 그대로 유지한다(안정 정렬 — 동점이면 원래 순서 유지).
export function sortByRelevance<T extends { relevanceScore: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.relevanceScore - a.relevanceScore)
}
