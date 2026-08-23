import { db } from './schema'
import { buildDefaultCategories } from './seedCategories'
import { migrateAssetTypesIfNeeded } from './migrateAssetTypes'
import type { Settings } from '../types/models'

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  largeAmountThreshold: 1_000_000,
  onboardingCompleted: false,
  lockPinHash: '',
  lockPinLength: 0,
  assetTypeMigrationApplied: false,
}

// 카테고리·설정이 비어 있을 때만 기본값을 채운다 (최초 실행, 또는 초기화 직후).
export async function seedDefaultsIfEmpty(): Promise<void> {
  await db.transaction('rw', db.categories, db.settings, async () => {
    const categoryCount = await db.categories.count()
    if (categoryCount === 0) {
      await db.categories.bulkAdd(buildDefaultCategories())
    }

    const settings = await db.settings.get('settings')
    if (!settings) {
      await db.settings.add(DEFAULT_SETTINGS)
    }
  })
}

export async function initDatabase(): Promise<void> {
  await seedDefaultsIfEmpty()
  await migrateAssetTypesIfNeeded()

  if ('storage' in navigator && 'persist' in navigator.storage) {
    await navigator.storage.persist()
  }
}
