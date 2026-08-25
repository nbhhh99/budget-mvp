import type { IndicatorCategory, MarketStatus } from '../../src/types/models'

// 소스 어댑터가 돌려주는 정규화된 값 — updatedAt/timezone/freshness는 index.ts가
// 수집 시각 기준으로 채운다(어댑터는 "그 순간 얻은 값"만 책임진다).
export interface CollectedIndicator {
  id: string
  category: IndicatorCategory
  name: string
  symbol?: string
  value: number
  unit: string
  change: number | null
  changeRate: number | null
  referenceDate: string // 'YYYY-MM-DD'
  sourceId: string
  sourceName: string
  sourceUrl: string
  marketStatus: MarketStatus
}
