// curriculumProgress가 백업/복원/전체초기화에 실제로 포함되는지, 그리고 서로 다른
// curriculumVersion(차근차근 경제사·생활로 읽는 경제)의 진행 기록이 뒤섞이지 않고
// 함께 보존되는지 확인하는 회귀 테스트. Dexie는 IndexedDB가 필요해 fake-indexeddb로
// 메모리 내 구현을 주입한다.
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './schema'
import { buildBackupFile, restoreFromBackup, resetAllData } from './backup'
import type { BriefingState, CurriculumProgress } from '../types/models'

function progress(overrides: Partial<CurriculumProgress> = {}): CurriculumProgress {
  return {
    curriculumId: 'x',
    status: 'in_progress',
    completedItemIds: [],
    curriculumVersion: 'economic-history-v1',
    ...overrides,
  }
}

describe('curriculumProgress backup/restore round-trip', () => {
  beforeEach(async () => {
    await db.curriculumProgress.clear()
  })

  it('backup includes curriculumProgress rows from every curriculum version', async () => {
    await db.curriculumProgress.bulkAdd([
      progress({ curriculumId: 'history-origin-of-money', curriculumVersion: 'economic-history-v1' }),
      progress({ curriculumId: 'life-economy-intro', curriculumVersion: 'real-life-economy-v1' }),
    ])

    const backup = await buildBackupFile()
    expect(backup.data.curriculumProgress).toHaveLength(2)
  })

  it('preserves progress records from multiple curriculum versions through a backup/restore round-trip', async () => {
    await db.curriculumProgress.bulkAdd([
      progress({
        curriculumId: 'history-origin-of-money',
        curriculumVersion: 'economic-history-v1',
        status: 'completed',
        completedItemIds: ['history-origin-of-money-body', 'history-origin-of-money-quiz'],
        completedAt: '2026-08-20T00:00:00.000Z',
      }),
      progress({
        curriculumId: 'life-economy-intro',
        curriculumVersion: 'real-life-economy-v1',
        status: 'in_progress',
        completedItemIds: ['life-economy-intro-body'],
      }),
    ])

    const backup = await buildBackupFile()

    await db.curriculumProgress.clear()
    expect(await db.curriculumProgress.count()).toBe(0)

    await restoreFromBackup(backup)

    const restored = await db.curriculumProgress.toArray()
    expect(restored).toHaveLength(2)
    const byVersion = new Map(restored.map((p) => [p.curriculumVersion, p]))
    expect(byVersion.get('economic-history-v1')?.status).toBe('completed')
    expect(byVersion.get('economic-history-v1')?.completedItemIds).toEqual([
      'history-origin-of-money-body',
      'history-origin-of-money-quiz',
    ])
    expect(byVersion.get('real-life-economy-v1')?.status).toBe('in_progress')
    expect(byVersion.get('real-life-economy-v1')?.completedItemIds).toEqual(['life-economy-intro-body'])
  })

  it('restoring an older backup with no curriculumProgress key leaves the table empty (backward compatible)', async () => {
    await db.curriculumProgress.bulkAdd([progress({ curriculumId: 'a' })])
    const legacyBackup = await buildBackupFile()
    // schemaVersion 1~3 백업 파일에는 이 키 자체가 없었다.
    delete (legacyBackup.data as { curriculumProgress?: CurriculumProgress[] }).curriculumProgress

    await restoreFromBackup(legacyBackup)

    expect(await db.curriculumProgress.count()).toBe(0)
  })

  it('resetAllData clears curriculumProgress for every curriculum version', async () => {
    await db.curriculumProgress.bulkAdd([
      progress({ curriculumId: 'a', curriculumVersion: 'economic-history-v1' }),
      progress({ curriculumId: 'b', curriculumVersion: 'real-life-economy-v1' }),
    ])

    await resetAllData()

    expect(await db.curriculumProgress.count()).toBe(0)
  })
})

describe('briefingState backup/restore round-trip', () => {
  beforeEach(async () => {
    await db.briefingState.clear()
  })

  const state: BriefingState = {
    id: 'state',
    daily: { dateKey: '2026-08-25', generatedAt: '2026-08-25T00:00:00.000Z', indicatorSnapshotGeneratedAt: '2026-08-25T00:00:00.000Z' },
    weekly: { weekId: '2026-W35', generatedAt: '2026-08-24T00:00:00.000Z' },
    monthly: { monthId: '2026-08', generatedAt: '2026-08-01T00:00:00.000Z' },
  }

  it('backup includes briefingState and restores it after a round-trip', async () => {
    await db.briefingState.put(state)

    const backup = await buildBackupFile()
    expect(backup.data.briefingState).toEqual([state])

    await db.briefingState.clear()
    await restoreFromBackup(backup)

    const restored = await db.briefingState.get('state')
    expect(restored).toEqual(state)
  })

  it('restoring an older backup with no briefingState key leaves the table empty (backward compatible)', async () => {
    await db.briefingState.put(state)
    const legacyBackup = await buildBackupFile()
    delete (legacyBackup.data as { briefingState?: BriefingState[] }).briefingState

    await restoreFromBackup(legacyBackup)

    expect(await db.briefingState.count()).toBe(0)
  })

  it('resetAllData clears briefingState', async () => {
    await db.briefingState.put(state)
    await resetAllData()
    expect(await db.briefingState.count()).toBe(0)
  })
})

describe('indicatorCryptoCache — excluded from backup, cleared on restore/reset', () => {
  beforeEach(async () => {
    await db.indicatorCryptoCache.clear()
  })

  it('is not included in the backup file at all', async () => {
    await db.indicatorCryptoCache.put({ market: 'KRW-BTC', value: 1, change: null, changeRate: null, fetchedAt: '2026-08-25T00:00:00.000Z' })
    const backup = await buildBackupFile()
    expect('indicatorCryptoCache' in backup.data).toBe(false)
  })

  it('is cleared by restoreFromBackup even though it is not part of the backup file', async () => {
    await db.indicatorCryptoCache.put({ market: 'KRW-BTC', value: 1, change: null, changeRate: null, fetchedAt: '2026-08-25T00:00:00.000Z' })
    const backup = await buildBackupFile()

    await restoreFromBackup(backup)

    expect(await db.indicatorCryptoCache.count()).toBe(0)
  })

  it('is cleared by resetAllData', async () => {
    await db.indicatorCryptoCache.put({ market: 'KRW-ETH', value: 1, change: null, changeRate: null, fetchedAt: '2026-08-25T00:00:00.000Z' })
    await resetAllData()
    expect(await db.indicatorCryptoCache.count()).toBe(0)
  })
})
