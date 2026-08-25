import type { IndicatorCategory, IndicatorHistoryPoint, MarketIndicator, Transaction } from '../types/models'
import { sumByType } from './balance'
import { formatChangeText } from './indicatorFormat'

// ── 날짜/주차/월 경계 판단 (KST 기준, §9) ────────────────────────────

const KST_DATE_KEY_FORMATTER = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }) // 'YYYY-MM-DD'

export function getKstDateKey(date: Date): string {
  return KST_DATE_KEY_FORMATTER.format(date)
}

export function isSameKstDay(a: Date, b: Date): boolean {
  return getKstDateKey(a) === getKstDateKey(b)
}

// ISO 8601 주차(월요일 시작, 그 주의 목요일이 속한 연도를 기준으로 삼음).
export function getIsoWeekId(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export function getMonthId(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// ── A. 오늘의 변화 (일간, 규칙 기반 문장 템플릿 — LLM 호출 없음, §8B) ──

export interface DailyDigestFinding {
  indicatorId: string
  category: IndicatorCategory
  headline: string
  pathway: string
}

// 카테고리별 전달경로 한 줄 — 원인을 단정하지 않고 "~할 수 있어요"로 헤지한다(§8B).
// 일간 다이제스트뿐 아니라 지표 상세 화면(IndicatorDetailScreen)에서도 그대로 쓴다.
export const PATHWAY_TEMPLATE: Record<IndicatorCategory, string> = {
  exchange: '수입 원료비 변화를 거쳐 일부 상품·서비스 가격에 시차를 두고 반영될 수 있어요.',
  stock: '시장 전반의 투자심리를 보여주는 지표 중 하나예요.',
  oil: '연료비·운송비를 거쳐 여러 물가에 영향을 줄 수 있어요.',
  fuel: '자동차를 이용한다면 주유비 부담에 직접 영향을 줄 수 있어요.',
  gold: '금은 안전자산으로 여겨져, 시장의 위험 인식과 함께 움직이는 경우가 있어요.',
  crypto: '24시간 거래되는 시장이라 변동성이 클 수 있어요.',
  macro: '가계 대출·예금 금리나 생활비 흐름과 연결될 수 있어요.',
}

// freshness가 fresh이고 changeRate가 있는 지표 중 변동폭이 큰 3개만 고른다. 규칙
// 기반 템플릿만 쓰고 원인을 단정하지 않는다(§8B "각 변화의 원인이라고 단정하지
// 않고 확인된 변화만 설명").
export function generateDailyDigest(indicators: MarketIndicator[]): DailyDigestFinding[] {
  return indicators
    .filter((i) => i.freshness === 'fresh' && i.changeRate !== null && i.changeRate !== 0)
    .sort((a, b) => Math.abs(b.changeRate!) - Math.abs(a.changeRate!))
    .slice(0, 3)
    .map((i) => ({
      indicatorId: i.id,
      category: i.category,
      headline: `${i.name}이(가) ${formatChangeText(i.change, i.changeRate)}했어요.`,
      pathway: PATHWAY_TEMPLATE[i.category],
    }))
}

// ── B. 이번 주 요약 (주간, §8C) ───────────────────────────────────

export interface WeeklyIndicatorMove {
  indicatorId: string
  name: string
  category: IndicatorCategory
  firstValue: number
  lastValue: number
  changeRate: number
}

export interface WeeklyPersonalSummary {
  income: number
  expense: number
  saving: number
}

export interface WeeklySummary {
  indicatorMoves: WeeklyIndicatorMove[] // 히스토리가 2점 이상 있는 지표만 포함(§8C "데이터가 충분한 항목만")
  personal: WeeklyPersonalSummary
}

export function generateWeeklySummary(
  indicators: MarketIndicator[],
  historyByIndicatorId: Map<string, IndicatorHistoryPoint[]>,
  weekTransactions: Transaction[],
): WeeklySummary {
  const indicatorMoves: WeeklyIndicatorMove[] = []
  for (const indicator of indicators) {
    const history = historyByIndicatorId.get(indicator.id)
    if (!history || history.length < 2) continue
    const sorted = [...history].sort((a, b) => a.referenceDate.localeCompare(b.referenceDate))
    const first = sorted[0].value
    const last = sorted[sorted.length - 1].value
    if (first === 0) continue
    indicatorMoves.push({
      indicatorId: indicator.id,
      name: indicator.name,
      category: indicator.category,
      firstValue: first,
      lastValue: last,
      changeRate: Number((((last - first) / first) * 100).toFixed(2)),
    })
  }

  return {
    indicatorMoves,
    personal: {
      income: sumByType(weekTransactions, 'income'),
      expense: sumByType(weekTransactions, 'expense'),
      saving: sumByType(weekTransactions, 'saving'),
    },
  }
}

// ── C. 월간 재무 결산 (§8D) ────────────────────────────────────────
// 개인 재무 부분은 domain/monthlySummary.ts(computeMonthlySummary)를 그대로
// 재사용한다 — 여기서는 그 결과와 지표 월간 변화만 묶는다.

export interface MonthlyIndicatorMove {
  indicatorId: string
  name: string
  category: IndicatorCategory
  changeRate: number
}

export function deriveMonthlyIndicatorMoves(
  indicators: MarketIndicator[],
  historyByIndicatorId: Map<string, IndicatorHistoryPoint[]>,
): MonthlyIndicatorMove[] {
  const moves: MonthlyIndicatorMove[] = []
  for (const indicator of indicators) {
    const history = historyByIndicatorId.get(indicator.id)
    if (!history || history.length < 2) continue
    const sorted = [...history].sort((a, b) => a.referenceDate.localeCompare(b.referenceDate))
    const first = sorted[0].value
    const last = sorted[sorted.length - 1].value
    if (first === 0) continue
    moves.push({
      indicatorId: indicator.id,
      name: indicator.name,
      category: indicator.category,
      changeRate: Number((((last - first) / first) * 100).toFixed(2)),
    })
  }
  return moves
}
