import type { IndicatorCategory, MarketIndicator, MarketStatus } from '../../src/types/models'
import type { CollectedIndicator, ProviderResult } from './types'
import { isNotAttempted } from './types'

export interface ManifestEntry {
  id: string
  category: IndicatorCategory
  name: string
  unit: string
  sourceId: string
  sourceName: string
  sourceUrl: string
  range: [number, number]
}

// 오래된 응답으로 최신값을 덮어쓰지 않는다 — 새 값의 기준일이 기존 값의 기준일보다
// 과거면 쓰지 않는다(§15 "기준일 역행 금지").
// 실제 GitHub Actions 실행에서 드러난 버그: 실제 값을 한 번도 못 얻은 지표(pending/
// unavailable)의 referenceDate는 실제 거래일이 아니라 "그 실행 당시의 오늘"로
// 채워진다(아래 buildIndicator의 null-값 분기). 나중에 진짜 값이 들어와도 그
// referenceDate가 (T+1 지연 등으로) "오늘"보다 과거면 이 함수가 "역행"으로 오판해
// 영원히 막아버린다 — 실제로 fsc-index가 이 문제로 정상 수집한 값을 계속
// 버리고 있었다. existing.value가 null이면(비교할 실제 값 자체가 없다) 기준일
// 비교 없이 항상 새 값을 받아들인다.
export function shouldUseNewValue(existing: MarketIndicator | undefined, newItem: CollectedIndicator | undefined): boolean {
  if (!newItem) return false
  if (!existing || existing.value === null) return true
  return existing.referenceDate <= newItem.referenceDate
}

export function isValidCollected(item: CollectedIndicator, manifest: ManifestEntry[]): boolean {
  const manifestEntry = manifest.find((m) => m.id === item.id)
  if (!manifestEntry) return false
  if (!Number.isFinite(item.value)) return false
  const [min, max] = manifestEntry.range
  return item.value >= min && item.value <= max
}

// 지표 하나의 다음 상태를 결정한다. 순서가 곧 우선순위다:
//   1) 이번에 유효한 새 값을 얻었으면 그 값 — 'fresh'
//   2) 못 얻었어도 예전 정상 값이 있으면 그 값을 보존 — 'stale'
//   3) 이번 그룹 호출 대상조차 아니었으면(providerResult 없음) 기존 상태 유지
//   4) 한 번도 정상 값이 없고, 시도조차 안 한 것(missing_key/not_implemented)이면
//      'pending'("데이터 연동 준비 중"), 시도했지만 실패한 것이면 'unavailable'
//      ("일시적으로 불러올 수 없음") — §14
export function buildIndicator(
  manifestEntry: ManifestEntry,
  collected: CollectedIndicator | undefined,
  existing: MarketIndicator | undefined,
  providerResult: ProviderResult | undefined,
  nowIso: string,
): MarketIndicator {
  if (collected) {
    return {
      id: manifestEntry.id,
      category: manifestEntry.category,
      name: manifestEntry.name,
      symbol: collected.symbol,
      value: collected.value,
      unit: manifestEntry.unit,
      change: collected.change,
      changeRate: collected.changeRate,
      referenceDate: collected.referenceDate,
      updatedAt: nowIso,
      timezone: 'Asia/Seoul',
      sourceId: collected.sourceId,
      sourceName: collected.sourceName,
      sourceUrl: collected.sourceUrl,
      marketStatus: collected.marketStatus as MarketStatus,
      freshness: 'fresh',
    }
  }

  if (existing && existing.value !== null) {
    return { ...existing, freshness: 'stale' }
  }

  if (!providerResult && existing) {
    return existing
  }

  const nextFreshness = isNotAttempted(providerResult) ? 'pending' : 'unavailable'
  if (existing && existing.value === null && existing.freshness === nextFreshness) {
    return existing
  }
  return {
    id: manifestEntry.id,
    category: manifestEntry.category,
    name: manifestEntry.name,
    value: null,
    unit: manifestEntry.unit,
    change: null,
    changeRate: null,
    referenceDate: nowIso.slice(0, 10),
    updatedAt: nowIso,
    timezone: 'Asia/Seoul',
    sourceId: manifestEntry.sourceId,
    sourceName: manifestEntry.sourceName,
    sourceUrl: manifestEntry.sourceUrl,
    marketStatus: 'unknown',
    freshness: nextFreshness,
  }
}

// 지표 하나가 속한 소스(providerId)에 대한 이번 실행 결과를 설명하는 문자열 —
// GitHub Actions Job Summary 표에 쓴다. 비밀 키·전체 요청 URL은 절대 포함하지
// 않는다(§2) — ProviderResult 자체가 그런 필드를 갖지 않도록 설계돼 있다.
export function describeProviderResult(result: ProviderResult | undefined): string {
  if (!result) return '이번 그룹 대상 아님'
  switch (result.status) {
    case 'success':
      return `성공 (${result.indicators.length}개)`
    case 'missing_key':
      return 'API 키 미등록'
    case 'unauthorized':
      return `인증 오류${result.code ? ` (${result.code})` : ''}`
    case 'rate_limited':
      return `호출 한도 초과${result.code ? ` (${result.code})` : ''}`
    case 'not_released':
      return `미발표${result.referenceDate ? ` (${result.referenceDate})` : ''}`
    case 'invalid_response':
      return `응답 형식 오류 — ${result.reason}`
    case 'not_implemented':
      return `미구현 — ${result.reason}`
    case 'failed':
      return `실패 — ${result.reason}`
  }
}
