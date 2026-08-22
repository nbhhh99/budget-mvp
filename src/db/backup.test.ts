import { describe, expect, it } from 'vitest'
import { BACKUP_SCHEMA_VERSION, validateBackupFile } from './backup'

function validBackup() {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: '2026-08-01T00:00:00.000Z',
    data: {
      transactions: [],
      categories: [],
      monthlyBudgets: [],
      monthlyMeta: [],
      settings: [],
    },
  }
}

describe('validateBackupFile', () => {
  it('accepts a well-formed backup file', () => {
    const result = validateBackupFile(validBackup())
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('rejects non-object input', () => {
    expect(validateBackupFile(null).valid).toBe(false)
    expect(validateBackupFile('not json').valid).toBe(false)
    expect(validateBackupFile([1, 2, 3]).valid).toBe(false)
  })

  it('rejects a file missing schemaVersion', () => {
    const file = validBackup() as Record<string, unknown>
    delete file.schemaVersion
    const result = validateBackupFile(file)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('schemaVersion'))).toBe(true)
  })

  it('rejects a file from a newer, unsupported schema version', () => {
    const file = { ...validBackup(), schemaVersion: BACKUP_SCHEMA_VERSION + 1 }
    expect(validateBackupFile(file).valid).toBe(false)
  })

  it('rejects a file missing one of the required data arrays', () => {
    const file = validBackup()
    // @ts-expect-error intentionally malformed for the test
    delete file.data.categories
    const result = validateBackupFile(file)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('categories'))).toBe(true)
  })

  it('rejects a file with no data object at all', () => {
    const result = validateBackupFile({ schemaVersion: BACKUP_SCHEMA_VERSION })
    expect(result.valid).toBe(false)
  })
})
