import type { AssetValuation, Category, Transaction } from '../types/models'

export interface AssetCategorySummary {
  categoryId: string
  name: string
  color: string
  hidden: boolean
  principal: number // 지금까지 넣은 원금 누적 합계
  currentValue: number // 평가금액 (미입력 시 원금과 동일)
  hasValuation: boolean
  gain: number // currentValue - principal
  gainRate: number | null // 원금이 0이면 계산 불가(null)
}

export interface AssetOverview {
  categories: AssetCategorySummary[]
  totalPrincipal: number
  totalCurrentValue: number
  totalGain: number
  totalGainRate: number | null
}

// 저축·투자 카테고리별 원금 누적 합계와, 사용자가 직접 입력한 평가금액을 함께 정리한다.
// 시세 조회는 하지 않으며(외부 API 미사용), 평가금액은 사용자가 수동으로 갱신한다.
export function computeAssetOverview(
  categories: Category[],
  transactions: Transaction[],
  valuations: AssetValuation[],
): AssetOverview {
  const principalByCategory = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== 'saving') continue
    principalByCategory.set(t.categoryId, (principalByCategory.get(t.categoryId) ?? 0) + t.amount)
  }
  const valuationByCategory = new Map(valuations.map((v) => [v.categoryId, v]))

  const summaries: AssetCategorySummary[] = categories
    .filter((c) => c.group === 'saving')
    .map((c) => {
      const principal = principalByCategory.get(c.id) ?? 0
      const valuation = valuationByCategory.get(c.id)
      const hasValuation = valuation !== undefined
      const currentValue = hasValuation ? valuation.currentValue : principal
      const gain = currentValue - principal
      return {
        categoryId: c.id,
        name: c.name,
        color: c.color,
        hidden: c.hidden,
        principal,
        currentValue,
        hasValuation,
        gain,
        gainRate: principal > 0 ? (gain / principal) * 100 : null,
      }
    })
    .filter((s) => s.principal > 0 || s.hasValuation)

  const totalPrincipal = summaries.reduce((sum, s) => sum + s.principal, 0)
  const totalCurrentValue = summaries.reduce((sum, s) => sum + s.currentValue, 0)
  const totalGain = totalCurrentValue - totalPrincipal

  return {
    categories: summaries,
    totalPrincipal,
    totalCurrentValue,
    totalGain,
    totalGainRate: totalPrincipal > 0 ? (totalGain / totalPrincipal) * 100 : null,
  }
}
