import { useEffect, useState } from 'react'
import { transactionsRepo, briefingStateRepo } from '../../db'
import type { IndicatorHistoryPoint, MarketIndicator } from '../../types/models'
import {
  CATEGORY_LABEL,
  type DailyDigestFinding,
  type WeeklySummary,
  generateDailyDigest,
  generateWeeklySummary,
  getIsoWeekId,
  getKstDateKey,
} from '../../domain'
import { fetchIndicatorHistory, fetchIndicatorSnapshot } from './indicatorData'
import './TodaysChangesCard.css'

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// "오늘의 변화"(일간)와 "이번 주 요약"(주간)을 재무 브리핑 화면 상단에 보여준다
// (§8B/§8C). 둘 다 규칙 기반 계산이라 LLM을 호출하지 않고, 같은 기간에 이미
// 생성했다면 briefingState에 굳이 다시 쓰지 않는다(§9).
export function TodaysChangesCard() {
  const [loaded, setLoaded] = useState(false)
  const [dailyFindings, setDailyFindings] = useState<DailyDigestFinding[]>([])
  const [indicators, setIndicators] = useState<MarketIndicator[]>([])
  const [weeklyExpanded, setWeeklyExpanded] = useState(false)
  const [weeklyLoaded, setWeeklyLoaded] = useState(false)
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { snapshot } = await fetchIndicatorSnapshot()
      if (cancelled) return
      if (!snapshot) {
        setLoaded(true)
        return
      }
      setIndicators(snapshot.indicators)
      setDailyFindings(generateDailyDigest(snapshot.indicators))
      setLoaded(true)

      const now = new Date()
      const dateKey = getKstDateKey(now)
      const state = await briefingStateRepo.getBriefingState()
      if (state?.daily?.dateKey !== dateKey || state.daily.indicatorSnapshotGeneratedAt !== snapshot.generatedAt) {
        await briefingStateRepo.markDailyGenerated(dateKey, snapshot.generatedAt)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleToggleWeekly() {
    const next = !weeklyExpanded
    setWeeklyExpanded(next)
    if (!next || weeklyLoaded) return

    const historyEntries = await Promise.all(
      indicators.map(async (i) => [i.id, await fetchIndicatorHistory(i.id)] as [string, IndicatorHistoryPoint[]]),
    )
    const historyByIndicatorId = new Map(historyEntries)

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const weekTransactions = await transactionsRepo.getTransactionsByRange(toDateString(weekAgo), toDateString(now))

    setWeeklySummary(generateWeeklySummary(indicators, historyByIndicatorId, weekTransactions))
    setWeeklyLoaded(true)

    const weekId = getIsoWeekId(now)
    const state = await briefingStateRepo.getBriefingState()
    if (state?.weekly?.weekId !== weekId) {
      await briefingStateRepo.markWeeklyGenerated(weekId)
    }
  }

  if (!loaded || indicators.length === 0) return null

  return (
    <div className="todays-changes">
      <h2 className="todays-changes__title">오늘의 변화</h2>
      {dailyFindings.length === 0 ? (
        <p className="todays-changes__empty">오늘은 눈에 띄는 지표 변화가 없어요.</p>
      ) : (
        <ul className="todays-changes__list">
          {dailyFindings.map((finding) => (
            <li key={finding.indicatorId} className="todays-changes__item">
              <p className="todays-changes__headline">{finding.headline}</p>
              <p className="todays-changes__pathway">→ {finding.pathway}</p>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="todays-changes__weekly-toggle" onClick={handleToggleWeekly} aria-expanded={weeklyExpanded}>
        이번 주 요약 {weeklyExpanded ? '접기 ▲' : '펼치기 ▼'}
      </button>

      {weeklyExpanded && (
        <div className="todays-changes__weekly">
          {!weeklyLoaded ? (
            <p className="todays-changes__empty">불러오는 중…</p>
          ) : (
            <>
              {weeklySummary!.indicatorMoves.length === 0 ? (
                <p className="todays-changes__empty">아직 일주일치 비교 데이터가 부족해요.</p>
              ) : (
                <ul className="todays-changes__weekly-list">
                  {weeklySummary!.indicatorMoves.map((move) => (
                    <li key={move.indicatorId}>
                      {CATEGORY_LABEL[move.category]} · {move.name} {move.changeRate >= 0 ? '+' : ''}
                      {move.changeRate}%
                    </li>
                  ))}
                </ul>
              )}
              <p className="todays-changes__weekly-personal">
                이번 주 수입 {weeklySummary!.personal.income.toLocaleString('ko-KR')}원 · 지출{' '}
                {weeklySummary!.personal.expense.toLocaleString('ko-KR')}원 · 저축{' '}
                {weeklySummary!.personal.saving.toLocaleString('ko-KR')}원
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
