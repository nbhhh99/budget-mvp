// §5: 기존에 briefingState(개인 재무 브리핑 일간/주간 다이제스트 생성 기록) 테이블에
// 데이터가 있던 기기가 앱을 업데이트해도, 마이그레이션이 실패해 전체 초기화로
// 이어지지 않고, 다른 테이블(특히 curriculumProgress 같은 사용자 데이터)이 그대로
// 보존되면서 briefingState 스토어만 조용히 사라지는지 확인하는 회귀 테스트.
import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import Dexie from 'dexie'

const DB_NAME = 'budget-mvp-briefing-state-migration-test'

const V5_STORES = {
  transactions: 'id, date, type, categoryId, [date+type], [categoryId+date]',
  categories: 'id, group, order, hidden',
  monthlyBudgets: 'id, yearMonth, categoryId, [yearMonth+categoryId]',
  monthlyMeta: 'yearMonth',
  settings: 'id',
  assetValuations: 'categoryId',
  learningProgress: 'contentId, contentType',
  curriculumProgress: 'curriculumId',
  indicatorCryptoCache: 'market',
  briefingState: 'id',
}

describe('briefingState table removal migration (schema v5 -> v6)', () => {
  it('drops the old briefingState store while preserving other tables, without crashing', async () => {
    // 1) 예전 버전(v5, briefingState 포함)의 앱이 만들어뒀을 법한 데이터를 실제로
    //    IndexedDB에 심어둔다.
    const oldDb = new Dexie(DB_NAME)
    oldDb.version(5).stores(V5_STORES)
    await oldDb.open()
    await oldDb.table('curriculumProgress').put({
      curriculumId: 'history-origin-of-money',
      status: 'completed',
      completedItemIds: ['a', 'b'],
      curriculumVersion: 'economic-history-v1',
    })
    await oldDb.table('briefingState').put({
      id: 'state',
      daily: { dateKey: '2026-08-25', generatedAt: '2026-08-25T00:00:00.000Z', indicatorSnapshotGeneratedAt: '2026-08-25T00:00:00.000Z' },
    })
    oldDb.close()

    // 2) 지금 앱(v6, briefingState 삭제)이 같은 이름의 DB를 열었을 때 예외 없이
    //    업그레이드되는지 확인한다.
    const newDb = new Dexie(DB_NAME)
    newDb.version(5).stores(V5_STORES)
    newDb.version(6).stores({ ...V5_STORES, briefingState: null })

    await expect(newDb.open()).resolves.toBeDefined()

    // 3) 다른 테이블(사용자의 경제사 진행 기록)은 그대로 남아있다.
    const progress = await newDb.table('curriculumProgress').get('history-origin-of-money')
    expect(progress?.status).toBe('completed')
    expect(progress?.completedItemIds).toEqual(['a', 'b'])

    // 4) briefingState 스토어 자체가 스키마에서 사라졌다(마이그레이션 성공).
    expect(newDb.tables.some((t) => t.name === 'briefingState')).toBe(false)

    newDb.close()
    await Dexie.delete(DB_NAME)
  })
})
