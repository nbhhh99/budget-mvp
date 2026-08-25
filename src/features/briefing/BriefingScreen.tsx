import { useEffect, useState } from 'react'
import { ScreenHeader } from '../../components/ScreenHeader'
import type { BriefingCategory, BriefingIndex, BriefingItem, BriefingPolicyStatus, BriefingRegion } from '../../types/models'
import { listReviewedYearMonths, computeLatestReviewedYearMonth, resolveBriefingView } from '../../domain'
import { fetchBriefingIndex, fetchBriefingMonth } from './briefingData'
import { formatKoreanYearMonth } from '../../utils/date'
import { formatKoreanWon } from '../../utils/format'
import './BriefingScreen.css'

// 금리처럼 %는 숫자를 그대로 보여주고, 예금자보호 한도처럼 원 단위 금액은
// "1억원"같이 사람이 바로 읽을 수 있는 표기로 바꿔준다.
function formatBriefingValue(value: number, unit: string): string {
  if (unit === '원') return formatKoreanWon(value)
  return `${value}${unit}`
}

const REGION_LABEL: Record<BriefingRegion, string> = { korea: '국내', global: '해외' }
const CATEGORY_LABEL: Record<BriefingCategory, string> = {
  interest_rate: '금리',
  inflation: '물가',
  exchange_rate: '환율',
  growth: '경제성장',
  employment: '고용',
  household_debt: '가계부채',
  deposit_protection: '예금자보호',
  pension: '연금',
  tax: '세금',
  financial_policy: '금융정책',
  other: '기타',
}
const POLICY_STATUS_LABEL: Record<BriefingPolicyStatus, string> = {
  active: '시행 중',
  scheduled: '시행 예정',
  under_review: '입법·검토 중',
  ending: '종료 예정',
}

// 재무 브리핑은 정부 경제정책·세법·금융제도 변경·공식 통계 발표 같은 공공정보만
// 다룬다. 개인 거래·예산·자산 데이터는 이 화면 어디에서도 읽지 않는다 — 카드
// 노출 순서는 항상 발표일(referenceDate) 최신순이며, 사용자의 보유 자산에 따라
// 달라지지 않는다.
export function BriefingScreen() {
  const [index, setIndex] = useState<BriefingIndex | null>(null)
  const [yearMonth, setYearMonth] = useState<string | null>(null)
  const [items, setItems] = useState<BriefingItem[] | null>(null)
  const [briefingMeta, setBriefingMeta] = useState<{
    generatedAt: string
    reviewedAt?: string
    summary: string
  } | null>(null)
  const [skippedItemCount, setSkippedItemCount] = useState(0)
  const [viewKind, setViewKind] = useState<'loading' | 'ready' | 'offline_cached' | 'no_data'>(
    'loading',
  )
  const [noDataOnline, setNoDataOnline] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const loadedIndex = await fetchBriefingIndex()
      if (cancelled) return
      setIndex(loadedIndex)
      const latest = loadedIndex ? computeLatestReviewedYearMonth(loadedIndex.entries) : null
      setYearMonth(latest)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!yearMonth) {
        if (index) {
          // index는 불러왔지만 reviewed 상태인 달이 아직 없는 경우
          setViewKind('no_data')
          setNoDataOnline(navigator.onLine)
        }
        return
      }
      setViewKind('loading')
      const { briefing, skippedItemCount: skipped } = await fetchBriefingMonth(yearMonth)
      if (cancelled) return

      const view = resolveBriefingView({
        online: navigator.onLine,
        fetched: briefing,
        cached: null, // 실제 오프라인 폴백은 서비스워커의 네트워크 캐시가 담당한다
        skippedItemCount: skipped,
      })

      if (view.kind !== 'ready' && view.kind !== 'offline_cached') {
        setViewKind('no_data')
        setNoDataOnline(view.kind === 'no_data' ? view.online : navigator.onLine)
        setItems(null)
        return
      }

      // 관련도 점수 없이 발표일(referenceDate) 최신순으로만 정렬한다 — 개인
      // 보유자산에 따라 순서가 달라지지 않는다.
      const sorted = [...view.briefing.items].sort((a, b) => b.referenceDate.localeCompare(a.referenceDate))
      setItems(sorted)
      setBriefingMeta({
        generatedAt: view.briefing.generatedAt,
        reviewedAt: view.briefing.reviewedAt,
        summary: view.briefing.summary,
      })
      setSkippedItemCount(view.kind === 'ready' ? view.skippedItemCount : 0)
      setViewKind(view.kind === 'ready' ? 'ready' : 'offline_cached')
    }
    load()
    return () => {
      cancelled = true
    }
  }, [yearMonth, index])

  const availableMonths = index ? listReviewedYearMonths(index.entries) : []

  return (
    <div className="briefing-screen">
      <ScreenHeader title="재무 브리핑" />

      <div className="briefing-screen__body">
        <p className="briefing-screen__disclaimer">
          정부 정책·세금·금융제도 변경과 공식 통계 발표를 정리한 공공정보입니다. 투자 자문이
          아니며, 매수·매도를 권유하지 않습니다.
        </p>

        {availableMonths.length > 1 && yearMonth && (
          <label className="briefing-screen__month-picker">
            <span>기준 연월</span>
            <select value={yearMonth} onChange={(e) => setYearMonth(e.target.value)}>
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {formatKoreanYearMonth(ym)}
                </option>
              ))}
            </select>
          </label>
        )}

        {viewKind === 'loading' && <p className="briefing-screen__state">불러오는 중…</p>}

        {viewKind === 'no_data' && (
          <p className="briefing-screen__state">
            {noDataOnline
              ? '아직 검수된 브리핑 자료가 없어요.'
              : '오프라인 상태이고, 저장된 브리핑 자료도 없어요. 네트워크 연결 후 다시 시도해 주세요.'}
          </p>
        )}

        {(viewKind === 'ready' || viewKind === 'offline_cached') && yearMonth && briefingMeta && (
          <>
            <div className="briefing-screen__meta">
              <span>{formatKoreanYearMonth(yearMonth)} 기준</span>
              <span>
                마지막 검토일{' '}
                {new Date(briefingMeta.reviewedAt ?? briefingMeta.generatedAt).toLocaleDateString(
                  'ko-KR',
                )}
              </span>
            </div>

            {viewKind === 'offline_cached' && (
              <p className="briefing-screen__banner briefing-screen__banner--offline">
                오프라인 저장본입니다. 최신 내용이 아닐 수 있어요.
              </p>
            )}
            {skippedItemCount > 0 && (
              <p className="briefing-screen__banner briefing-screen__banner--partial">
                일부 항목({skippedItemCount}개)을 불러오지 못했어요.
              </p>
            )}

            <p className="briefing-screen__summary">{briefingMeta.summary}</p>

            {items && items.length > 0 && (
              <section className="briefing-screen__detail-section">
                <ul className="briefing-screen__card-list">
                  {items.map((item) => (
                    <BriefingCard
                      key={item.id}
                      item={item}
                      expanded={expandedId === item.id}
                      onToggle={() => setExpandedId((id) => (id === item.id ? null : item.id))}
                    />
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function BriefingCard({
  item,
  expanded,
  onToggle,
}: {
  item: BriefingItem
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <li id={`briefing-item-${item.id}`} className="briefing-card">
      <button
        type="button"
        className="briefing-card__header"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span className="briefing-card__badges">
          <span className="briefing-card__region-badge">{REGION_LABEL[item.region]}</span>
          <span className="briefing-card__category-badge">{CATEGORY_LABEL[item.category]}</span>
        </span>
        <span className="briefing-card__title">{item.title}</span>
        {item.value !== undefined && (
          <span className="briefing-card__value">
            {formatBriefingValue(item.value, item.unit ?? '')}
            {item.previousValue !== undefined && (
              <span className="briefing-card__previous">
                {' '}
                (전 {formatBriefingValue(item.previousValue, item.unit ?? '')})
              </span>
            )}
          </span>
        )}
        {item.policyStatus && (
          <span className="briefing-card__status">{POLICY_STATUS_LABEL[item.policyStatus]}</span>
        )}
        <span className="briefing-card__chevron">{expanded ? '접기 ▲' : '펼치기 ▼'}</span>
      </button>

      {expanded && (
        <div className="briefing-card__detail">
          <p className="briefing-card__section">
            <strong>핵심 내용</strong> {item.factSummary}
          </p>
          <p className="briefing-card__section">
            <strong>왜 중요한가</strong> {item.significance}
          </p>
          {item.assetImplications.length > 0 && (
            <div className="briefing-card__section">
              <strong>생활에 영향을 줄 수 있는 경로</strong>
              <ul>
                {item.assetImplications.map((implication, i) => (
                  <li key={i}>{implication.explanation}</li>
                ))}
              </ul>
            </div>
          )}
          {item.checklist.length > 0 && (
            <div className="briefing-card__section">
              <strong>확인할 사항</strong>
              <ul>
                {item.checklist.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="briefing-card__dates">
            <span>발표일 {item.referenceDate}</span>
            {item.effectiveDate && <span>시행일 {item.effectiveDate}</span>}
          </div>
          <div className="briefing-card__sources">
            <strong>출처</strong>
            <ul>
              {item.sources.map((source, i) => (
                <li key={i}>
                  {source.organization} · {source.title}
                  {source.publishedAt ? ` (${source.publishedAt})` : ''}
                  <br />
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    원문 보기 (새 창)
                  </a>
                  <span className="briefing-card__source-url"> {source.url}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  )
}
