import type { BriefingItem, FinancialBriefing } from '../types/models'

const YEAR_MONTH_RE = /^\d{4}-\d{2}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const VALID_REGIONS = new Set(['korea', 'global'])
const VALID_CATEGORIES = new Set([
  'interest_rate',
  'inflation',
  'exchange_rate',
  'growth',
  'employment',
  'household_debt',
  'deposit_protection',
  'pension',
  'tax',
  'financial_policy',
  'other',
])
const VALID_POLICY_STATUSES = new Set(['active', 'scheduled', 'under_review', 'ending'])
const VALID_COMPARISON_BASES = new Set(['month_over_month', 'year_over_year', 'none'])
const VALID_STATUSES = new Set(['draft', 'reviewed'])

export interface BriefingValidationResult {
  valid: boolean
  errors: string[]
  file?: FinancialBriefing
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateSource(source: unknown, path: string, errors: string[]): void {
  if (!isPlainObject(source)) {
    errors.push(`${path}: 출처 형식이 올바르지 않습니다.`)
    return
  }
  if (typeof source.organization !== 'string' || !source.organization.trim()) {
    errors.push(`${path}: 출처 기관명(organization)이 없습니다.`)
  }
  if (typeof source.title !== 'string' || !source.title.trim()) {
    errors.push(`${path}: 출처 제목(title)이 없습니다.`)
  }
  if (typeof source.url !== 'string' || !/^https?:\/\//.test(source.url)) {
    errors.push(`${path}: 출처 URL이 올바르지 않습니다.`)
  }
  if (typeof source.accessedAt !== 'string' || !DATE_RE.test(source.accessedAt)) {
    errors.push(`${path}: 확인일(accessedAt)이 올바르지 않습니다 (YYYY-MM-DD).`)
  }
  if (source.publishedAt !== undefined) {
    if (typeof source.publishedAt !== 'string' || !DATE_RE.test(source.publishedAt)) {
      errors.push(`${path}: 발표일(publishedAt) 형식이 올바르지 않습니다 (YYYY-MM-DD).`)
    }
  }
}

function validateAssetImplication(input: unknown, path: string, errors: string[]): void {
  if (!isPlainObject(input)) {
    errors.push(`${path}: assetImplications 항목 형식이 올바르지 않습니다.`)
    return
  }
  if (!Array.isArray(input.assetTypes) || input.assetTypes.length === 0) {
    errors.push(`${path}: assetTypes가 비어 있습니다.`)
  }
  if (typeof input.explanation !== 'string' || !input.explanation.trim()) {
    errors.push(`${path}: explanation이 없습니다.`)
  }
}

function validateItem(input: unknown, index: number, errors: string[]): void {
  const path = `items[${index}]`
  if (!isPlainObject(input)) {
    errors.push(`${path}: 항목 형식이 올바르지 않습니다.`)
    return
  }

  if (typeof input.id !== 'string' || !input.id.trim()) errors.push(`${path}: id가 없습니다.`)
  if (typeof input.region !== 'string' || !VALID_REGIONS.has(input.region)) {
    errors.push(`${path}: region 값이 올바르지 않습니다 (korea/global).`)
  }
  if (typeof input.category !== 'string' || !VALID_CATEGORIES.has(input.category)) {
    errors.push(`${path}: category 값이 올바르지 않습니다.`)
  }
  if (typeof input.title !== 'string' || !input.title.trim()) {
    errors.push(`${path}: title이 없습니다.`)
  }
  if (typeof input.factSummary !== 'string' || !input.factSummary.trim()) {
    errors.push(`${path}: factSummary가 없습니다.`)
  }
  if (typeof input.referenceDate !== 'string' || !DATE_RE.test(input.referenceDate)) {
    errors.push(`${path}: referenceDate 형식이 올바르지 않습니다 (YYYY-MM-DD).`)
  }
  if (typeof input.significance !== 'string' || !input.significance.trim()) {
    errors.push(`${path}: significance가 없습니다.`)
  }
  if (!Array.isArray(input.checklist)) {
    errors.push(`${path}: checklist가 배열이 아닙니다.`)
  }
  if (!Array.isArray(input.tags)) {
    errors.push(`${path}: tags가 배열이 아닙니다.`)
  }

  if (input.value !== undefined && typeof input.value !== 'number') {
    errors.push(`${path}: value는 숫자여야 합니다.`)
  }
  if (input.value !== undefined && typeof input.unit !== 'string') {
    errors.push(`${path}: value가 있으면 unit도 있어야 합니다.`)
  }
  if (input.comparisonBasis !== undefined && !VALID_COMPARISON_BASES.has(input.comparisonBasis as string)) {
    errors.push(`${path}: comparisonBasis 값이 올바르지 않습니다.`)
  }
  if (input.policyStatus !== undefined && !VALID_POLICY_STATUSES.has(input.policyStatus as string)) {
    errors.push(`${path}: policyStatus 값이 올바르지 않습니다.`)
  }
  if (input.effectiveDate !== undefined) {
    if (typeof input.effectiveDate !== 'string' || !DATE_RE.test(input.effectiveDate)) {
      errors.push(`${path}: effectiveDate 형식이 올바르지 않습니다 (YYYY-MM-DD).`)
    }
  }

  // §10: 모든 카드는 출처가 최소 1개 이상 있어야 한다.
  if (!Array.isArray(input.sources) || input.sources.length === 0) {
    errors.push(`${path}: 출처(sources)가 없습니다.`)
  } else {
    input.sources.forEach((s, i) => validateSource(s, `${path}.sources[${i}]`, errors))
  }

  if (!Array.isArray(input.assetImplications)) {
    errors.push(`${path}: assetImplications가 배열이 아닙니다.`)
  } else {
    input.assetImplications.forEach((a, i) =>
      validateAssetImplication(a, `${path}.assetImplications[${i}]`, errors),
    )
  }

  // 기준금리(정책금리)와 시장금리를 같은 개념처럼 표현하지 않도록, interest_rate 카테고리는
  // tags에 어떤 금리인지 구분할 수 있는 표시가 있어야 한다는 최소한의 점검.
  if (input.category === 'interest_rate' && Array.isArray(input.tags) && input.tags.length === 0) {
    errors.push(`${path}: interest_rate 항목은 어떤 금리인지 구분할 태그(tags)가 필요합니다.`)
  }
}

export function validateBriefingFile(input: unknown): BriefingValidationResult {
  const errors: string[] = []

  if (!isPlainObject(input)) {
    return { valid: false, errors: ['JSON 형식이 아니거나 파일이 손상되었습니다.'] }
  }
  if (typeof input.yearMonth !== 'string' || !YEAR_MONTH_RE.test(input.yearMonth)) {
    errors.push('yearMonth 형식이 올바르지 않습니다 (YYYY-MM).')
  }
  if (typeof input.generatedAt !== 'string' || Number.isNaN(Date.parse(input.generatedAt))) {
    errors.push('generatedAt이 올바른 날짜가 아닙니다.')
  }
  if (typeof input.status !== 'string' || !VALID_STATUSES.has(input.status)) {
    errors.push('status 값이 올바르지 않습니다 (draft/reviewed).')
  }
  if (input.reviewedAt !== undefined) {
    if (typeof input.reviewedAt !== 'string' || Number.isNaN(Date.parse(input.reviewedAt))) {
      errors.push('reviewedAt이 올바른 날짜가 아닙니다.')
    }
  }
  if (typeof input.summary !== 'string' || !input.summary.trim()) {
    errors.push('summary가 없습니다.')
  }
  if (!Array.isArray(input.items)) {
    errors.push('items가 배열이 아닙니다.')
  } else {
    input.items.forEach((item, i) => validateItem(item, i, errors))
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }
  return { valid: true, errors: [], file: input as unknown as FinancialBriefing }
}

export interface SanitizeBriefingResult {
  briefing: FinancialBriefing | null
  skippedItemCount: number
  itemErrors: string[]
}

// 런타임 로더용 관대한 버전 — 최상위 구조(yearMonth/status/summary/items)는 꼭 있어야
// 하지만, items 배열 안에서 개별 항목이 잘못됐다면 그 항목만 건너뛰고 나머지는 살린다
// (§6 "데이터 일부만 불러온 상태", §11 "잘못된 JSON 또는 일부 데이터 실패 처리").
// 빌드/수집 단계에서는 이걸 쓰지 말고 validateBriefingFile(엄격 버전)을 써야 한다.
export function sanitizeBriefingFile(input: unknown): SanitizeBriefingResult {
  if (!isPlainObject(input)) {
    return { briefing: null, skippedItemCount: 0, itemErrors: ['JSON 형식이 아닙니다.'] }
  }

  const topErrors: string[] = []
  if (typeof input.yearMonth !== 'string' || !YEAR_MONTH_RE.test(input.yearMonth)) {
    topErrors.push('yearMonth 형식이 올바르지 않습니다.')
  }
  if (typeof input.generatedAt !== 'string' || Number.isNaN(Date.parse(input.generatedAt))) {
    topErrors.push('generatedAt이 올바르지 않습니다.')
  }
  if (typeof input.status !== 'string' || !VALID_STATUSES.has(input.status)) {
    topErrors.push('status가 올바르지 않습니다.')
  }
  if (typeof input.summary !== 'string' || !input.summary.trim()) {
    topErrors.push('summary가 없습니다.')
  }
  if (!Array.isArray(input.items)) {
    topErrors.push('items가 배열이 아닙니다.')
  }
  if (topErrors.length > 0) {
    return { briefing: null, skippedItemCount: 0, itemErrors: topErrors }
  }

  const validItems: BriefingItem[] = []
  const itemErrors: string[] = []
  let skippedItemCount = 0
  ;(input.items as unknown[]).forEach((raw, i) => {
    const errors: string[] = []
    validateItem(raw, i, errors)
    if (errors.length === 0) {
      validItems.push(raw as BriefingItem)
    } else {
      skippedItemCount += 1
      itemErrors.push(...errors)
    }
  })

  const briefing: FinancialBriefing = {
    yearMonth: input.yearMonth as string,
    generatedAt: input.generatedAt as string,
    status: input.status as FinancialBriefing['status'],
    reviewedAt: typeof input.reviewedAt === 'string' ? input.reviewedAt : undefined,
    summary: input.summary as string,
    items: validItems,
  }
  return { briefing, skippedItemCount, itemErrors }
}

// §10: "같은 지표의 단위가 월마다 달라지지 않도록 한다" — 같은 region+category 조합의
// 단위(unit)가 이전 달과 이번 달에서 갑자기 바뀌면 경고한다. 다른 지표를 잘못 이어붙였거나
// 단위 표기를 실수했을 가능성이 높기 때문. 카드를 막지는 않고 경고만 반환한다.
export function checkUnitConsistency(
  previous: FinancialBriefing | null,
  current: FinancialBriefing,
): string[] {
  if (!previous) return []
  const warnings: string[] = []
  const previousUnitByKey = new Map<string, string>()
  for (const item of previous.items) {
    if (item.unit) previousUnitByKey.set(`${item.region}:${item.category}`, item.unit)
  }
  for (const item of current.items) {
    if (!item.unit) continue
    const key = `${item.region}:${item.category}`
    const previousUnit = previousUnitByKey.get(key)
    if (previousUnit && previousUnit !== item.unit) {
      warnings.push(
        `${item.title}: 단위가 지난달(${previousUnit})과 다릅니다(${item.unit}). 확인이 필요합니다.`,
      )
    }
  }
  return warnings
}
