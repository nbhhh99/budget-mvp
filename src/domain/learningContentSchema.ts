import type { ConceptCard, MonthlyMoneyLesson } from '../types/models'
import { DATE_RE, YEAR_MONTH_RE, isPlainObject, validateSource } from './sourceValidation'

const VALID_DIFFICULTIES = new Set(['basic', 'intermediate'])
const VALID_STATUSES = new Set(['draft', 'reviewed'])

function validateStringArray(input: unknown, path: string, errors: string[]): void {
  if (!Array.isArray(input) || input.some((v) => typeof v !== 'string')) {
    errors.push(`${path}가 문자열 배열이 아닙니다.`)
  }
}

// ── 개념 카드 ────────────────────────────────────────────────────

export function validateConceptCard(input: unknown, path: string, errors: string[]): void {
  if (!isPlainObject(input)) {
    errors.push(`${path}: 형식이 올바르지 않습니다.`)
    return
  }
  if (typeof input.id !== 'string' || !input.id.trim()) errors.push(`${path}: id가 없습니다.`)
  if (typeof input.title !== 'string' || !input.title.trim()) errors.push(`${path}: title이 없습니다.`)
  if (typeof input.oneLineSummary !== 'string' || !input.oneLineSummary.trim()) {
    errors.push(`${path}: oneLineSummary가 없습니다.`)
  }
  if (typeof input.definition !== 'string' || !input.definition.trim()) {
    errors.push(`${path}: definition이 없습니다.`)
  }
  if (typeof input.example !== 'string' || !input.example.trim()) {
    errors.push(`${path}: example이 없습니다.`)
  }
  if (typeof input.whyItMatters !== 'string' || !input.whyItMatters.trim()) {
    errors.push(`${path}: whyItMatters가 없습니다.`)
  }
  if (!Array.isArray(input.relatedAssetTypes)) {
    errors.push(`${path}: relatedAssetTypes가 배열이 아닙니다.`)
  }
  validateStringArray(input.checklist, `${path}.checklist`, errors)
  if (typeof input.reviewedAt !== 'string' || !DATE_RE.test(input.reviewedAt)) {
    errors.push(`${path}: reviewedAt 형식이 올바르지 않습니다 (YYYY-MM-DD).`)
  }
  if (typeof input.estimatedMinutes !== 'number' || input.estimatedMinutes <= 0) {
    errors.push(`${path}: estimatedMinutes는 양수여야 합니다.`)
  }
  if (typeof input.difficulty !== 'string' || !VALID_DIFFICULTIES.has(input.difficulty)) {
    errors.push(`${path}: difficulty 값이 올바르지 않습니다 (basic/intermediate).`)
  }
  if (input.relatedConceptIds !== undefined) {
    validateStringArray(input.relatedConceptIds, `${path}.relatedConceptIds`, errors)
  }
  // §9: 모든 콘텐츠는 출처를 최소 1개 이상 가져야 한다.
  if (!Array.isArray(input.sources) || input.sources.length === 0) {
    errors.push(`${path}: 출처(sources)가 없습니다.`)
  } else {
    input.sources.forEach((s, i) => validateSource(s, `${path}.sources[${i}]`, errors))
  }
}

export interface ConceptCardsValidationResult {
  valid: boolean
  errors: string[]
  cards?: ConceptCard[]
}

// 빌드/테스트용 엄격 버전 — 배열 안 카드 하나라도 잘못되면 파일 전체를 무효로 본다.
export function validateConceptCardsFile(input: unknown): ConceptCardsValidationResult {
  if (!Array.isArray(input)) {
    return { valid: false, errors: ['개념 카드 파일은 배열이어야 합니다.'] }
  }
  const errors: string[] = []
  input.forEach((card, i) => validateConceptCard(card, `concepts[${i}]`, errors))
  if (errors.length > 0) return { valid: false, errors }
  return { valid: true, errors: [], cards: input as ConceptCard[] }
}

export interface SanitizeConceptCardsResult {
  cards: ConceptCard[]
  skippedCount: number
  itemErrors: string[]
}

// 런타임 로더용 관대한 버전 — 카드 하나가 잘못돼도 나머지는 살린다.
export function sanitizeConceptCardsFile(input: unknown): SanitizeConceptCardsResult {
  if (!Array.isArray(input)) {
    return { cards: [], skippedCount: 0, itemErrors: ['개념 카드 파일은 배열이어야 합니다.'] }
  }
  const cards: ConceptCard[] = []
  const itemErrors: string[] = []
  let skippedCount = 0
  input.forEach((card, i) => {
    const errors: string[] = []
    validateConceptCard(card, `concepts[${i}]`, errors)
    if (errors.length === 0) {
      cards.push(card as ConceptCard)
    } else {
      skippedCount += 1
      itemErrors.push(...errors)
    }
  })
  return { cards, skippedCount, itemErrors }
}

// ── 이번 달 돈 공부 ──────────────────────────────────────────────

function validateLessonSection(input: unknown, path: string, errors: string[]): void {
  if (!isPlainObject(input)) {
    errors.push(`${path}: 형식이 올바르지 않습니다.`)
    return
  }
  if (typeof input.heading !== 'string' || !input.heading.trim()) {
    errors.push(`${path}: heading이 없습니다.`)
  }
  if (typeof input.body !== 'string' || !input.body.trim()) {
    errors.push(`${path}: body가 없습니다.`)
  }
}

export function validateMonthlyLesson(input: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!isPlainObject(input)) {
    return { valid: false, errors: ['JSON 형식이 아니거나 파일이 손상되었습니다.'] }
  }
  if (typeof input.id !== 'string' || !input.id.trim()) errors.push('id가 없습니다.')
  if (typeof input.yearMonth !== 'string' || !YEAR_MONTH_RE.test(input.yearMonth)) {
    errors.push('yearMonth 형식이 올바르지 않습니다 (YYYY-MM).')
  }
  if (typeof input.title !== 'string' || !input.title.trim()) errors.push('title이 없습니다.')
  if (typeof input.subtitle !== 'string' || !input.subtitle.trim()) errors.push('subtitle이 없습니다.')
  validateStringArray(input.relatedBriefingItemIds, 'relatedBriefingItemIds', errors)
  validateStringArray(input.learningGoals, 'learningGoals', errors)
  if (!Array.isArray(input.sections) || input.sections.length === 0) {
    errors.push('sections가 비어 있습니다.')
  } else {
    input.sections.forEach((s, i) => validateLessonSection(s, `sections[${i}]`, errors))
  }
  if (typeof input.reflectionQuestion !== 'string' || !input.reflectionQuestion.trim()) {
    errors.push('reflectionQuestion이 없습니다.')
  }
  validateStringArray(input.relatedConceptIds, 'relatedConceptIds', errors)
  validateStringArray(input.relatedCalculatorIds, 'relatedCalculatorIds', errors)
  if (!Array.isArray(input.sources) || input.sources.length === 0) {
    errors.push('출처(sources)가 없습니다.')
  } else {
    input.sources.forEach((s, i) => validateSource(s, `sources[${i}]`, errors))
  }
  if (typeof input.status !== 'string' || !VALID_STATUSES.has(input.status)) {
    errors.push('status 값이 올바르지 않습니다 (draft/reviewed).')
  }
  if (input.reviewedAt !== undefined) {
    if (typeof input.reviewedAt !== 'string' || Number.isNaN(Date.parse(input.reviewedAt))) {
      errors.push('reviewedAt이 올바른 날짜가 아닙니다.')
    }
  }

  if (errors.length > 0) return { valid: false, errors }
  return { valid: true, errors: [] }
}

export function sanitizeMonthlyLesson(input: unknown): MonthlyMoneyLesson | null {
  const result = validateMonthlyLesson(input)
  return result.valid ? (input as MonthlyMoneyLesson) : null
}
