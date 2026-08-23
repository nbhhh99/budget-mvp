import { db } from '../schema'
import type { AssetValuation } from '../../types/models'

export async function getAllAssetValuations(): Promise<AssetValuation[]> {
  return db.assetValuations.toArray()
}

export async function setCurrentValue(categoryId: string, currentValue: number): Promise<void> {
  await db.assetValuations.put({
    categoryId,
    currentValue,
    updatedAt: new Date().toISOString(),
  })
}
