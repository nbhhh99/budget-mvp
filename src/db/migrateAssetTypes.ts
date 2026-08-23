import { db } from './schema'
import type { AssetType } from '../types/models'

const EXPENSE_NAME_HINTS: Record<string, AssetType> = {
  이자: 'debt',
}

const SAVING_NAME_HINTS: Record<string, AssetType> = {
  '예금·적금': 'cash_deposit',
  CMA: 'cash_deposit',
  주식: 'domestic_stock',
  코인: 'crypto',
  AXA: 'pension',
  IBKR: 'foreign_stock',
}

// 카테고리 이름으로 자산 유형을 베스트에포트로 "한 번만" 제안한다. 재무 브리핑
// 개인화(§4)를 위한 마이그레이션 — 기존 거래·카테고리 데이터는 전혀 건드리지
// 않고 새 선택 필드만 채운다. 사용자가 분류 관리에서 나중에 바꾸거나 지우면
// 그 상태가 유지되도록, 이 마이그레이션은 설정에 완료 플래그를 남기고 다시는
// 실행하지 않는다.
export async function migrateAssetTypesIfNeeded(): Promise<void> {
  const settings = await db.settings.get('settings')
  if (!settings || settings.assetTypeMigrationApplied) return

  const categories = await db.categories.toArray()
  const updates = categories
    .map((c) => {
      if (c.assetType !== undefined) return null
      const hint =
        c.group === 'expense'
          ? EXPENSE_NAME_HINTS[c.name]
          : c.group === 'saving'
            ? SAVING_NAME_HINTS[c.name]
            : undefined
      return hint ? { id: c.id, assetType: hint } : null
    })
    .filter((u): u is { id: string; assetType: AssetType } => u !== null)

  await db.transaction('rw', db.categories, db.settings, async () => {
    await Promise.all(
      updates.map((u) => db.categories.update(u.id, { assetType: u.assetType })),
    )
    await db.settings.update('settings', { assetTypeMigrationApplied: true })
  })
}
