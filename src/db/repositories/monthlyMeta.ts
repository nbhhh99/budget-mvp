import { db } from '../schema'
import type { MonthlyMeta } from '../../types/models'

export async function getMonthlyMeta(yearMonth: string): Promise<MonthlyMeta | undefined> {
  return db.monthlyMeta.get(yearMonth)
}

async function ensureMeta(yearMonth: string): Promise<MonthlyMeta> {
  const existing = await db.monthlyMeta.get(yearMonth)
  if (existing) return existing
  const created: MonthlyMeta = {
    yearMonth,
    openingBalance: 0,
    openingBalanceSource: 'manual',
    locked: false,
  }
  await db.monthlyMeta.add(created)
  return created
}

// 사용자가 확인한 뒤에만 호출되는 이월 함수 (§13, §23 — 자동 이월 금지).
export async function setOpeningBalance(
  yearMonth: string,
  amount: number,
  source: MonthlyMeta['openingBalanceSource'],
): Promise<void> {
  await ensureMeta(yearMonth)
  await db.monthlyMeta.update(yearMonth, { openingBalance: amount, openingBalanceSource: source })
}

export async function setMonthLocked(yearMonth: string, locked: boolean): Promise<void> {
  await ensureMeta(yearMonth)
  await db.monthlyMeta.update(yearMonth, { locked })
}

export async function setClosingNote(yearMonth: string, closingNote: string): Promise<void> {
  await ensureMeta(yearMonth)
  await db.monthlyMeta.update(yearMonth, { closingNote })
}
