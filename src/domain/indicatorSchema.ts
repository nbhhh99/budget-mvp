import type { IndicatorHistoryPoint, IndicatorSnapshot, MarketIndicator } from '../types/models'
import { DATE_RE, isPlainObject } from './sourceValidation'

const VALID_CATEGORIES = new Set(['exchange', 'stock', 'oil', 'fuel', 'gold', 'crypto', 'macro'])
const VALID_MARKET_STATUSES = new Set(['open', 'closed', 'holiday', 'not-released', 'delayed', 'unknown'])
const VALID_FRESHNESS = new Set(['fresh', 'stale', 'unavailable', 'pending'])

export interface IndicatorValidationResult {
  valid: boolean
  errors: string[]
  file?: IndicatorSnapshot
}

function validateIndicator(input: unknown, index: number, errors: string[]): void {
  const path = `indicators[${index}]`
  if (!isPlainObject(input)) {
    errors.push(`${path}: 항목 형식이 올바르지 않습니다.`)
    return
  }

  if (typeof input.id !== 'string' || !input.id.trim()) errors.push(`${path}: id가 없습니다.`)
  if (typeof input.category !== 'string' || !VALID_CATEGORIES.has(input.category)) {
    errors.push(`${path}: category 값이 올바르지 않습니다.`)
  }
  if (typeof input.name !== 'string' || !input.name.trim()) errors.push(`${path}: name이 없습니다.`)
  if (typeof input.unit !== 'string' || !input.unit.trim()) errors.push(`${path}: unit이 없습니다.`)

  if (input.value !== null && typeof input.value !== 'number') {
    errors.push(`${path}: value는 숫자 또는 null이어야 합니다.`)
  }
  if (input.change !== undefined && input.change !== null && typeof input.change !== 'number') {
    errors.push(`${path}: change는 숫자 또는 null이어야 합니다.`)
  }
  if (input.changeRate !== undefined && input.changeRate !== null && typeof input.changeRate !== 'number') {
    errors.push(`${path}: changeRate는 숫자 또는 null이어야 합니다.`)
  }
  if (typeof input.referenceDate !== 'string' || !DATE_RE.test(input.referenceDate)) {
    errors.push(`${path}: referenceDate 형식이 올바르지 않습니다 (YYYY-MM-DD).`)
  }
  if (typeof input.updatedAt !== 'string' || Number.isNaN(Date.parse(input.updatedAt))) {
    errors.push(`${path}: updatedAt이 올바른 날짜가 아닙니다.`)
  }
  if (typeof input.timezone !== 'string' || !input.timezone.trim()) {
    errors.push(`${path}: timezone이 없습니다.`)
  }
  if (typeof input.sourceId !== 'string' || !input.sourceId.trim()) errors.push(`${path}: sourceId가 없습니다.`)
  if (typeof input.sourceName !== 'string' || !input.sourceName.trim()) errors.push(`${path}: sourceName이 없습니다.`)
  if (typeof input.sourceUrl !== 'string' || !/^https?:\/\//.test(input.sourceUrl)) {
    errors.push(`${path}: sourceUrl이 올바르지 않습니다.`)
  }
  if (typeof input.marketStatus !== 'string' || !VALID_MARKET_STATUSES.has(input.marketStatus)) {
    errors.push(`${path}: marketStatus 값이 올바르지 않습니다.`)
  }
  if (typeof input.freshness !== 'string' || !VALID_FRESHNESS.has(input.freshness)) {
    errors.push(`${path}: freshness 값이 올바르지 않습니다.`)
  }
  // 값이 없는(pending/unavailable) 지표에 등락 정보가 딸려 있으면 잘못 채운 것이다.
  if (input.value === null && (input.change || input.changeRate)) {
    errors.push(`${path}: value가 없는데 change/changeRate가 있습니다.`)
  }
}

export function validateIndicatorSnapshot(input: unknown): IndicatorValidationResult {
  const errors: string[] = []

  if (!isPlainObject(input)) {
    return { valid: false, errors: ['JSON 형식이 아니거나 파일이 손상되었습니다.'] }
  }
  if (typeof input.generatedAt !== 'string' || Number.isNaN(Date.parse(input.generatedAt))) {
    errors.push('generatedAt이 올바른 날짜가 아닙니다.')
  }
  if (!Array.isArray(input.indicators)) {
    errors.push('indicators가 배열이 아닙니다.')
  } else {
    input.indicators.forEach((item, i) => validateIndicator(item, i, errors))
    const ids = input.indicators
      .filter((item): item is Record<string, unknown> => isPlainObject(item) && typeof item.id === 'string')
      .map((item) => item.id as string)
    if (new Set(ids).size !== ids.length) {
      errors.push('indicators에 중복된 id가 있습니다.')
    }
  }

  if (errors.length > 0) return { valid: false, errors }
  return { valid: true, errors: [], file: input as unknown as IndicatorSnapshot }
}

export interface SanitizeIndicatorSnapshotResult {
  snapshot: IndicatorSnapshot | null
  skippedCount: number
}

// 런타임 로더용 관대한 버전 — briefingSchema.sanitizeBriefingFile과 동일한 방식으로,
// 개별 지표 하나가 잘못돼도 나머지 지표는 그대로 화면에 노출한다(§4 "한 출처가
// 실패해도 나머지 지표는 정상 표시").
export function sanitizeIndicatorSnapshot(input: unknown): SanitizeIndicatorSnapshotResult {
  if (!isPlainObject(input) || typeof input.generatedAt !== 'string' || !Array.isArray(input.indicators)) {
    return { snapshot: null, skippedCount: 0 }
  }

  const validIndicators: MarketIndicator[] = []
  let skippedCount = 0
  input.indicators.forEach((raw, i) => {
    const errors: string[] = []
    validateIndicator(raw, i, errors)
    if (errors.length === 0) {
      validIndicators.push(raw as MarketIndicator)
    } else {
      skippedCount += 1
    }
  })

  return {
    snapshot: { generatedAt: input.generatedAt, indicators: validIndicators },
    skippedCount,
  }
}

export function sanitizeIndicatorHistory(input: unknown): IndicatorHistoryPoint[] {
  if (!Array.isArray(input)) return []
  const points: IndicatorHistoryPoint[] = []
  for (const raw of input) {
    if (!isPlainObject(raw)) continue
    if (typeof raw.referenceDate !== 'string' || !DATE_RE.test(raw.referenceDate)) continue
    if (typeof raw.value !== 'number' || Number.isNaN(raw.value)) continue
    points.push({ referenceDate: raw.referenceDate, value: raw.value })
  }
  return points
}
