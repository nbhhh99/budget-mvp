import type { BriefingCategory, FinancialBriefing, MarketIndicator } from '../types/models'

// 거시지표(기준금리·물가·실업률·성장률) 카드는 새로 수집하지 않는다 — 이미 사람이
// 검수한 월간 재무 브리핑(FinancialBriefing.items)에서 해당 카테고리 항목을 그대로
// 재사용한다(§2 "매일 변하지 않으므로 공식 기관에서 새 통계가 발표됐을 때만 변경").
const MACRO_CATEGORIES: BriefingCategory[] = ['interest_rate', 'inflation', 'employment', 'growth']

export function deriveMacroIndicators(briefing: FinancialBriefing | null): MarketIndicator[] {
  if (!briefing) return []

  return briefing.items
    .filter((item) => MACRO_CATEGORIES.includes(item.category))
    .map((item): MarketIndicator => {
      const hasValue = item.value !== undefined
      const change =
        hasValue && item.previousValue !== undefined ? Number((item.value! - item.previousValue).toFixed(4)) : null
      const changeRate =
        change !== null && item.previousValue ? Number(((change / item.previousValue) * 100).toFixed(2)) : null
      const source = item.sources[0]

      return {
        id: `macro-${item.id}`,
        category: 'macro',
        name: item.title,
        value: hasValue ? item.value! : null,
        unit: item.unit ?? '',
        change,
        changeRate,
        referenceDate: item.referenceDate,
        updatedAt: briefing.reviewedAt ?? briefing.generatedAt,
        timezone: 'Asia/Seoul',
        sourceId: item.id,
        sourceName: source?.organization ?? '재무 브리핑',
        sourceUrl: source?.url ?? '',
        marketStatus: hasValue ? 'unknown' : 'not-released',
        freshness: hasValue ? 'fresh' : 'unavailable',
      }
    })
}
