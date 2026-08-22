import { describe, expect, it } from 'vitest'
import { parseImportFile } from './csvImport'
import type { Category, Transaction } from '../../types/models'

function category(overrides: Partial<Category>): Category {
  return {
    id: Math.random().toString(),
    group: 'expense',
    name: '식비',
    order: 0,
    color: '#fff',
    hidden: false,
    createdAt: '',
    ...overrides,
  }
}

function transaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: Math.random().toString(),
    type: 'expense',
    amount: 10_000,
    categoryId: 'food',
    date: '2026-08-01',
    time: '12:00',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('parseImportFile', () => {
  it('reports header errors when a required column is missing', () => {
    const preview = parseImportFile('date,type,amount\n2026-08-01,expense,1000\n', [], [])
    expect(preview.headerErrors.length).toBeGreaterThan(0)
  })

  it('accepts a well-formed row referencing an existing category', () => {
    const categories = [category({ id: 'food', name: '식비', group: 'expense' })]
    const csv =
      'date,time,type,category,amount,memo,paymentMethod,sourceId\n2026-08-01,12:30,expense,식비,10000,점심,카드,src-1\n'
    const preview = parseImportFile(csv, categories, [])
    expect(preview.validRows).toHaveLength(1)
    expect(preview.validRows[0].draft?.amount).toBe(10_000)
    expect(preview.newCategoryNames).toEqual([])
  })

  it('flags an invalid date format', () => {
    const csv = 'date,type,category,amount\n2026/08/01,expense,식비,1000\n'
    const preview = parseImportFile(csv, [], [])
    expect(preview.invalidRows).toHaveLength(1)
    expect(preview.invalidRows[0].errors.some((e) => e.includes('날짜'))).toBe(true)
  })

  it('flags a non-positive or non-integer amount', () => {
    const csv =
      'date,type,category,amount\n2026-08-01,expense,식비,0\n2026-08-01,expense,식비,-500\n2026-08-01,expense,식비,12.5\n'
    const preview = parseImportFile(csv, [], [])
    expect(preview.invalidRows).toHaveLength(3)
  })

  it('flags an unknown transaction type', () => {
    const csv = 'date,type,category,amount\n2026-08-01,shopping,식비,1000\n'
    const preview = parseImportFile(csv, [], [])
    expect(preview.invalidRows[0].errors.some((e) => e.includes('유형'))).toBe(true)
  })

  it('skips blank rows when processing, while still counting them in totalRows', () => {
    const csv = 'date,type,category,amount\n2026-08-01,expense,식비,1000\n,,,\n'
    const preview = parseImportFile(csv, [category({ id: 'food' })], [])
    expect(preview.totalRows).toBe(2)
    expect(
      preview.validRows.length + preview.invalidRows.length + preview.duplicateRows.length,
    ).toBe(1)
  })

  it('flags a category not yet in the app as a new category to create', () => {
    const csv = 'date,type,category,amount\n2026-08-01,expense,새분류,1000\n'
    const preview = parseImportFile(csv, [], [])
    expect(preview.newCategoryNames).toEqual([{ group: 'expense', name: '새분류' }])
  })

  it('deduplicates rows against existing transactions by sourceId', () => {
    const existing = [transaction({ importSourceId: 'src-1' })]
    const csv = 'date,type,category,amount,sourceId\n2026-08-01,expense,식비,10000,src-1\n'
    const preview = parseImportFile(csv, [category({ id: 'food' })], existing)
    expect(preview.duplicateRows).toHaveLength(1)
    expect(preview.validRows).toHaveLength(0)
  })

  it('deduplicates rows against existing transactions by content hash when no sourceId is given', () => {
    const foodCategory = category({ id: 'food', name: '식비', group: 'expense' })
    const existing = [
      transaction({
        date: '2026-08-01',
        time: '12:00',
        type: 'expense',
        categoryId: 'food',
        amount: 10_000,
      }),
    ]
    const csv = 'date,time,type,category,amount\n2026-08-01,12:00,expense,식비,10000\n'
    const preview = parseImportFile(csv, [foodCategory], existing)
    expect(preview.duplicateRows).toHaveLength(1)
  })

  it('deduplicates identical rows within the same import batch', () => {
    const csv =
      'date,type,category,amount\n2026-08-01,expense,식비,10000\n2026-08-01,expense,식비,10000\n'
    const preview = parseImportFile(csv, [category({ id: 'food' })], [])
    expect(preview.validRows).toHaveLength(1)
    expect(preview.duplicateRows).toHaveLength(1)
  })
})
