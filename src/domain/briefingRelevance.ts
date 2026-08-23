import type { AssetType, BriefingItem, Category, Transaction } from '../types/models'

// §5: 자산 유형은 "보유 여부"만 쓴다 — 금액이나 비중은 절대 계산에 넣지 않는다
// (외부로 보내지 않는 것과 별개로, 앱 내부 로직 자체도 금액을 다루지 않게 해서
// 실수로라도 민감한 값이 이 흐름에 섞이지 않도록 한다).
export function computeHeldAssetTypes(
  categories: Category[],
  transactions: Transaction[],
): Set<AssetType> {
  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const held = new Set<AssetType>()
  for (const t of transactions) {
    const category = categoryById.get(t.categoryId)
    if (!category?.assetType) continue
    if (category.group === 'saving' && t.type === 'saving') {
      held.add(category.assetType)
    } else if (category.group === 'expense' && t.type === 'expense' && category.assetType === 'debt') {
      held.add('debt')
    }
  }
  return held
}

export interface ScoredBriefingItem extends BriefingItem {
  relevanceScore: number
}

// 카드는 절대 제거하지 않는다 — 점수만 매겨서 요약 화면 노출 우선순위에만 쓴다.
export function scoreBriefingItems(
  items: BriefingItem[],
  heldAssetTypes: Set<AssetType>,
): ScoredBriefingItem[] {
  return items.map((item) => {
    const relevanceScore = item.assetImplications.reduce(
      (sum, implication) =>
        sum + implication.assetTypes.filter((type) => heldAssetTypes.has(type)).length,
      0,
    )
    return { ...item, relevanceScore }
  })
}

const INSTITUTIONAL_CATEGORIES = new Set(['deposit_protection', 'pension', 'tax', 'financial_policy'])
// §10: 개인화 순위가 낮아도 숨기지 않아야 하는, 특히 우선순위를 지켜야 하는 카테고리.
const ALWAYS_PRIORITY_CATEGORIES = new Set(['deposit_protection', 'tax'])

export interface BriefingSummarySelection {
  korea: ScoredBriefingItem[]
  global: ScoredBriefingItem[]
  policy: ScoredBriefingItem[]
}

function comparePolicy(a: ScoredBriefingItem, b: ScoredBriefingItem): number {
  const aPriority = ALWAYS_PRIORITY_CATEGORIES.has(a.category) ? 1 : 0
  const bPriority = ALWAYS_PRIORITY_CATEGORIES.has(b.category) ? 1 : 0
  if (aPriority !== bPriority) return bPriority - aPriority
  return b.relevanceScore - a.relevanceScore
}

// §6 요약 영역: 국내 2~4개, 세계 2~4개, 제도 변경 1~3개, 관련도 높은 항목을 먼저 배치.
// 상세 카드 목록에는 영향을 주지 않는다 — 이 함수는 오직 요약 화면에 무엇을 먼저
// 보여줄지 고르는 용도.
export function selectSummaryItems(scored: ScoredBriefingItem[]): BriefingSummarySelection {
  const policy = scored.filter((i) => INSTITUTIONAL_CATEGORIES.has(i.category))
  const korea = scored.filter((i) => i.region === 'korea' && !INSTITUTIONAL_CATEGORIES.has(i.category))
  const global = scored.filter((i) => i.region === 'global' && !INSTITUTIONAL_CATEGORIES.has(i.category))

  return {
    korea: [...korea].sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 4),
    global: [...global].sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 4),
    policy: [...policy].sort(comparePolicy).slice(0, 3),
  }
}
