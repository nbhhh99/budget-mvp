import { db } from '../schema'
import type { BriefingState } from '../../types/models'

const STATE_ID = 'state' as const

export async function getBriefingState(): Promise<BriefingState | undefined> {
  return db.briefingState.get(STATE_ID)
}

async function updateState(patch: Partial<Omit<BriefingState, 'id'>>): Promise<BriefingState> {
  const existing = await db.briefingState.get(STATE_ID)
  const next: BriefingState = { id: STATE_ID, ...existing, ...patch }
  await db.briefingState.put(next)
  return next
}

export async function markDailyGenerated(dateKey: string, indicatorSnapshotGeneratedAt: string): Promise<void> {
  await updateState({
    daily: { dateKey, generatedAt: new Date().toISOString(), indicatorSnapshotGeneratedAt },
  })
}

export async function markWeeklyGenerated(weekId: string): Promise<void> {
  await updateState({ weekly: { weekId, generatedAt: new Date().toISOString() } })
}

export async function markMonthlyGenerated(monthId: string): Promise<void> {
  await updateState({ monthly: { monthId, generatedAt: new Date().toISOString() } })
}
