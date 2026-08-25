import { db } from '../schema'
import type { CryptoIndicatorCache } from '../../types/models'

export async function getCached(market: string): Promise<CryptoIndicatorCache | undefined> {
  return db.indicatorCryptoCache.get(market)
}

export async function setCached(
  market: string,
  data: { value: number; change: number | null; changeRate: number | null },
): Promise<void> {
  await db.indicatorCryptoCache.put({
    market,
    value: data.value,
    change: data.change,
    changeRate: data.changeRate,
    fetchedAt: new Date().toISOString(),
  })
}

export async function clearAll(): Promise<void> {
  await db.indicatorCryptoCache.clear()
}
