import { describe, expect, it } from 'vitest'
import { computeBudgetUsage } from './budgetStatus'

describe('computeBudgetUsage', () => {
  it('marks unset when there is no plan amount', () => {
    const usage = computeBudgetUsage(undefined, 50_000)
    expect(usage.status).toBe('unset')
    expect(usage.usageRatio).toBeNull()
    expect(usage.diff).toBeNull()
    expect(usage.actualAmount).toBe(50_000)
  })

  it('marks unset when the plan amount is zero', () => {
    expect(computeBudgetUsage(0, 10_000).status).toBe('unset')
  })

  it('marks ok when usage is below the warning threshold', () => {
    const usage = computeBudgetUsage(100_000, 50_000)
    expect(usage.status).toBe('ok')
    expect(usage.usageRatio).toBe(50)
    expect(usage.diff).toBe(50_000)
  })

  it('marks warning at or above 80% usage', () => {
    expect(computeBudgetUsage(100_000, 80_000).status).toBe('warning')
  })

  it('marks over at or above 100% usage', () => {
    const usage = computeBudgetUsage(100_000, 120_000)
    expect(usage.status).toBe('over')
    expect(usage.diff).toBe(-20_000)
  })
})
