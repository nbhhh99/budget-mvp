import type { Category, CategoryGroup, Transaction, TransactionType } from '../../types/models'
import { parseCsv } from './csv'

const REQUIRED_COLUMNS = ['date', 'type', 'category', 'amount']
const VALID_TYPES: TransactionType[] = ['income', 'expense', 'saving', 'transfer']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/

export interface ImportRowDraft {
  type: TransactionType
  amount: number
  date: string
  time: string
  memo?: string
  paymentMethod?: string
  importSourceId?: string
}

export interface ImportRowResult {
  rowNumber: number // 1부터 시작하는 데이터 행 번호 (헤더 제외)
  errors: string[]
  isDuplicate: boolean
  categoryGroup: CategoryGroup | null
  categoryName: string
  draft?: ImportRowDraft
}

export interface ImportPreview {
  headerErrors: string[]
  totalRows: number
  validRows: ImportRowResult[]
  invalidRows: ImportRowResult[]
  duplicateRows: ImportRowResult[]
  newCategoryNames: { group: CategoryGroup; name: string }[]
}

function rowHash(
  date: string,
  time: string,
  type: string,
  categoryName: string,
  amount: number,
): string {
  return `hash:${date}|${time}|${type}|${categoryName}|${amount}`
}

const EMPTY_PREVIEW: ImportPreview = {
  headerErrors: [],
  totalRows: 0,
  validRows: [],
  invalidRows: [],
  duplicateRows: [],
  newCategoryNames: [],
}

export function parseImportFile(
  text: string,
  existingCategories: Category[],
  existingTransactions: Transaction[],
): ImportPreview {
  const rows = parseCsv(text)
  if (rows.length === 0) {
    return { ...EMPTY_PREVIEW, headerErrors: ['빈 파일입니다.'] }
  }

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const headerErrors: string[] = REQUIRED_COLUMNS.filter((col) => !header.includes(col)).map(
    (col) => `필수 컬럼 "${col}"이 없습니다.`,
  )
  if (headerErrors.length > 0) {
    return { ...EMPTY_PREVIEW, headerErrors, totalRows: Math.max(rows.length - 1, 0) }
  }

  const colIndex = (name: string) => header.indexOf(name)
  const idx = {
    date: colIndex('date'),
    time: colIndex('time'),
    type: colIndex('type'),
    category: colIndex('category'),
    amount: colIndex('amount'),
    memo: colIndex('memo'),
    paymentMethod: colIndex('paymentmethod'),
    sourceId: colIndex('sourceid'),
  }

  const categoryNameById = new Map(existingCategories.map((c) => [c.id, c.name]))
  const categoryExists = new Set(existingCategories.map((c) => `${c.group}:${c.name}`))

  const existingKeys = new Set<string>()
  for (const t of existingTransactions) {
    const key = t.importSourceId
      ? `src:${t.importSourceId}`
      : rowHash(t.date, t.time, t.type, categoryNameById.get(t.categoryId) ?? '', t.amount)
    existingKeys.add(key)
  }

  const dataRows = rows.slice(1)
  const results: ImportRowResult[] = []
  const seenInBatch = new Set<string>()
  const newCategoryNamesSet = new Map<string, CategoryGroup>()

  dataRows.forEach((cols, i) => {
    if (cols.every((c) => c.trim() === '')) return // 빈 행은 건너뜀

    const rowNumber = i + 1
    const get = (index: number) => (index >= 0 ? (cols[index] ?? '').trim() : '')

    const date = get(idx.date)
    const time = get(idx.time) || '00:00'
    const typeRaw = get(idx.type).toLowerCase()
    const categoryName = get(idx.category)
    const amountRaw = get(idx.amount)
    const memo = get(idx.memo)
    const paymentMethod = get(idx.paymentMethod)
    const sourceId = get(idx.sourceId)

    const errors: string[] = []
    if (!DATE_RE.test(date)) errors.push('날짜 형식이 올바르지 않습니다 (YYYY-MM-DD).')
    if (time !== '00:00' && !TIME_RE.test(time))
      errors.push('시간 형식이 올바르지 않습니다 (HH:mm).')
    const isValidType = VALID_TYPES.includes(typeRaw as TransactionType)
    if (!isValidType) errors.push('거래 유형이 올바르지 않습니다 (income/expense/saving/transfer).')
    if (!categoryName) errors.push('분류가 비어 있습니다.')
    const amount = Number(amountRaw)
    if (!amountRaw || !Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
      errors.push('금액이 올바르지 않습니다 (양의 정수).')
    }

    const group: CategoryGroup | null = isValidType ? (typeRaw as CategoryGroup) : null
    if (group && categoryName && !categoryExists.has(`${group}:${categoryName}`)) {
      newCategoryNamesSet.set(`${group}:${categoryName}`, group)
    }

    const dedupeKey = sourceId
      ? `src:${sourceId}`
      : rowHash(date, time, typeRaw, categoryName, amount)
    const isDuplicate = existingKeys.has(dedupeKey) || seenInBatch.has(dedupeKey)
    seenInBatch.add(dedupeKey)

    results.push({
      rowNumber,
      errors,
      isDuplicate,
      categoryGroup: group,
      categoryName,
      draft:
        errors.length === 0
          ? {
              type: typeRaw as TransactionType,
              amount,
              date,
              time,
              memo: memo || undefined,
              paymentMethod: paymentMethod || undefined,
              importSourceId: sourceId || undefined,
            }
          : undefined,
    })
  })

  const validRows = results.filter((r) => r.errors.length === 0 && !r.isDuplicate)
  const invalidRows = results.filter((r) => r.errors.length > 0)
  const duplicateRows = results.filter((r) => r.errors.length === 0 && r.isDuplicate)
  const newCategoryNames = [...newCategoryNamesSet.entries()].map(([key, group]) => ({
    group,
    name: key.slice(group.length + 1),
  }))

  return {
    headerErrors: [],
    totalRows: dataRows.length,
    validRows,
    invalidRows,
    duplicateRows,
    newCategoryNames,
  }
}
