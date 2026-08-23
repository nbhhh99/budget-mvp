import { db } from './schema'
import { seedDefaultsIfEmpty } from './init'
import type {
  AssetValuation,
  Category,
  MonthlyBudget,
  MonthlyMeta,
  Settings,
  Transaction,
} from '../types/models'

export const BACKUP_SCHEMA_VERSION = 2

export interface BackupFile {
  schemaVersion: number
  exportedAt: string
  data: {
    transactions: Transaction[]
    categories: Category[]
    monthlyBudgets: MonthlyBudget[]
    monthlyMeta: MonthlyMeta[]
    settings: Settings[]
    assetValuations?: AssetValuation[] // schemaVersion 1 백업에는 없을 수 있다
  }
}

export async function buildBackupFile(): Promise<BackupFile> {
  const [transactions, categories, monthlyBudgets, monthlyMeta, settings, assetValuations] =
    await Promise.all([
      db.transactions.toArray(),
      db.categories.toArray(),
      db.monthlyBudgets.toArray(),
      db.monthlyMeta.toArray(),
      db.settings.toArray(),
      db.assetValuations.toArray(),
    ])

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: { transactions, categories, monthlyBudgets, monthlyMeta, settings, assetValuations },
  }
}

export interface BackupValidationResult {
  valid: boolean
  errors: string[]
  file?: BackupFile
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// 형식이 명백히 잘못된 백업 파일을 걸러낸다 (§12 "잘못된 백업 파일 복원 방지").
// 상세한 스키마 검증보다는 필수 구조(버전, 테이블별 배열)가 있는지 확인하는 수준으로 충분하다 —
// 이 앱 자체가 만든 백업 파일을 다시 불러오는 용도이기 때문.
export function validateBackupFile(input: unknown): BackupValidationResult {
  const errors: string[] = []

  if (!isPlainObject(input)) {
    return { valid: false, errors: ['JSON 형식이 아니거나 파일이 손상되었습니다.'] }
  }
  if (typeof input.schemaVersion !== 'number') {
    errors.push('백업 파일 형식(schemaVersion)을 확인할 수 없습니다.')
  } else if (input.schemaVersion > BACKUP_SCHEMA_VERSION) {
    errors.push(
      '더 최신 버전의 앱에서 만든 백업 파일입니다. 앱을 업데이트한 뒤 다시 시도해 주세요.',
    )
  }
  if (!isPlainObject(input.data)) {
    errors.push('백업 파일에 데이터가 없습니다.')
    return { valid: false, errors }
  }

  const data = input.data
  const requiredArrays = ['transactions', 'categories', 'monthlyBudgets', 'monthlyMeta', 'settings']
  for (const key of requiredArrays) {
    if (!Array.isArray(data[key])) {
      errors.push(`백업 파일의 "${key}" 항목이 올바르지 않습니다.`)
    }
  }
  // assetValuations는 schemaVersion 1 백업에는 없을 수 있으므로, 있을 때만 배열인지 확인한다.
  if (data.assetValuations !== undefined && !Array.isArray(data.assetValuations)) {
    errors.push('백업 파일의 "assetValuations" 항목이 올바르지 않습니다.')
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return {
    valid: true,
    errors: [],
    file: input as unknown as BackupFile,
  }
}

// 기존 데이터를 모두 지우고 백업 파일 내용으로 덮어쓴다. 호출 전 사용자 확인이 선행되어야 한다.
export async function restoreFromBackup(file: BackupFile): Promise<void> {
  await db.transaction(
    'rw',
    [db.transactions, db.categories, db.monthlyBudgets, db.monthlyMeta, db.settings, db.assetValuations],
    async () => {
      await Promise.all([
        db.transactions.clear(),
        db.categories.clear(),
        db.monthlyBudgets.clear(),
        db.monthlyMeta.clear(),
        db.settings.clear(),
        db.assetValuations.clear(),
      ])
      await Promise.all([
        db.transactions.bulkAdd(file.data.transactions),
        db.categories.bulkAdd(file.data.categories),
        db.monthlyBudgets.bulkAdd(file.data.monthlyBudgets),
        db.monthlyMeta.bulkAdd(file.data.monthlyMeta),
        db.settings.bulkAdd(file.data.settings),
        db.assetValuations.bulkAdd(file.data.assetValuations ?? []),
      ])
    },
  )
}

// 전체 초기화: 모든 데이터를 지우고 기본 카테고리/설정으로 되돌린다.
export async function resetAllData(): Promise<void> {
  await db.transaction(
    'rw',
    [db.transactions, db.categories, db.monthlyBudgets, db.monthlyMeta, db.settings, db.assetValuations],
    async () => {
      await Promise.all([
        db.transactions.clear(),
        db.categories.clear(),
        db.monthlyBudgets.clear(),
        db.monthlyMeta.clear(),
        db.settings.clear(),
        db.assetValuations.clear(),
      ])
    },
  )
  await seedDefaultsIfEmpty()
}
