import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../schema'
import { getBriefingState, markDailyGenerated, markMonthlyGenerated, markWeeklyGenerated } from './briefingState'

describe('briefingState repository', () => {
  beforeEach(async () => {
    await db.briefingState.clear()
  })

  it('returns undefined before anything has been generated', async () => {
    expect(await getBriefingState()).toBeUndefined()
  })

  it('markDailyGenerated stores the date key and snapshot marker without touching weekly/monthly', async () => {
    await markDailyGenerated('2026-08-25', '2026-08-25T07:30:00.000Z')
    const state = await getBriefingState()
    expect(state?.daily?.dateKey).toBe('2026-08-25')
    expect(state?.daily?.indicatorSnapshotGeneratedAt).toBe('2026-08-25T07:30:00.000Z')
    expect(state?.weekly).toBeUndefined()
    expect(state?.monthly).toBeUndefined()
  })

  it('marking weekly/monthly independently preserves the other fields already set (single-row merge)', async () => {
    await markDailyGenerated('2026-08-25', '2026-08-25T07:30:00.000Z')
    await markWeeklyGenerated('2026-W35')
    await markMonthlyGenerated('2026-08')

    const state = await getBriefingState()
    expect(state?.daily?.dateKey).toBe('2026-08-25')
    expect(state?.weekly?.weekId).toBe('2026-W35')
    expect(state?.monthly?.monthId).toBe('2026-08')
    expect(await db.briefingState.count()).toBe(1)
  })

  it('re-marking the same tier overwrites only that tier', async () => {
    await markDailyGenerated('2026-08-25', 'a')
    await markDailyGenerated('2026-08-26', 'b')
    const state = await getBriefingState()
    expect(state?.daily?.dateKey).toBe('2026-08-26')
  })
})
