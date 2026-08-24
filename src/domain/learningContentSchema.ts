import type { ConceptCard } from '../types/models'
import { DATE_RE, isPlainObject } from './sourceValidation'

const VALID_CATEGORIES = new Set([
  'daily-finance',
  'money-interest',
  'debt-credit',
  'investing',
  'financial-products',
  'insurance-pension-tax',
  'economy-market',
])
const VALID_STATUSES = new Set(['reviewed', 'in_review'])

function validateStringArray(input: unknown, path: string, errors: string[]): void {
  if (!Array.isArray(input) || input.some((v) => typeof v !== 'string')) {
    errors.push(`${path}가 문자열 배열이 아닙니다.`)
  }
}

// ── 돈 개념 사전 ─────────────────────────────────────────────────
// status: 'in_review'인 카드는 body/keyPoints/sourceIds/reviewedAt이 비어 있어도
// 되고("검토 중"으로 표시), 'reviewed'인 카드만 실제 상세 내용을 갖춰야 한다(§5, §19).

export function validateConceptCard(input: unknown, path: string, errors: string[]): void {
  if (!isPlainObject(input)) {
    errors.push(`${path}: 형식이 올바르지 않습니다.`)
    return
  }
  if (typeof input.id !== 'string' || !input.id.trim()) errors.push(`${path}: id가 없습니다.`)
  if (typeof input.title !== 'string' || !input.title.trim()) errors.push(`${path}: title이 없습니다.`)
  if (typeof input.category !== 'string' || !VALID_CATEGORIES.has(input.category)) {
    errors.push(`${path}: category 값이 올바르지 않습니다.`)
  }
  if (typeof input.status !== 'string' || !VALID_STATUSES.has(input.status)) {
    errors.push(`${path}: status 값이 올바르지 않습니다 (reviewed/in_review).`)
  }
  if (typeof input.version !== 'number' || input.version <= 0) {
    errors.push(`${path}: version은 양수여야 합니다.`)
  }
  validateStringArray(input.keyPoints, `${path}.keyPoints`, errors)
  validateStringArray(input.relatedConceptIds, `${path}.relatedConceptIds`, errors)
  validateStringArray(input.sourceIds, `${path}.sourceIds`, errors)
  if (typeof input.shortDefinition !== 'string') errors.push(`${path}: shortDefinition이 없습니다.`)
  if (typeof input.body !== 'string') errors.push(`${path}: body가 없습니다.`)
  if (typeof input.reviewedAt !== 'string') errors.push(`${path}: reviewedAt이 없습니다.`)

  const status = input.status
  if (status === 'reviewed') {
    if (typeof input.shortDefinition === 'string' && !input.shortDefinition.trim()) {
      errors.push(`${path}: reviewed 카드는 shortDefinition이 비어 있으면 안 됩니다.`)
    }
    if (typeof input.body === 'string' && !input.body.trim()) {
      errors.push(`${path}: reviewed 카드는 body가 비어 있으면 안 됩니다.`)
    }
    if (typeof input.reviewedAt === 'string' && !DATE_RE.test(input.reviewedAt)) {
      errors.push(`${path}: reviewedAt 형식이 올바르지 않습니다 (YYYY-MM-DD).`)
    }
    if (!Array.isArray(input.sourceIds) || input.sourceIds.length === 0) {
      errors.push(`${path}: reviewed 카드는 출처(sourceIds)가 최소 1개 있어야 합니다.`)
    }
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

  const ids = input.map((c) => (isPlainObject(c) ? c.id : undefined))
  const dupes = ids.filter((id, i) => typeof id === 'string' && ids.indexOf(id) !== i)
  if (dupes.length > 0) errors.push(`중복된 id가 있습니다: ${[...new Set(dupes)].join(', ')}`)

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
