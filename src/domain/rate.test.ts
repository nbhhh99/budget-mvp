import { describe, expect, it } from 'vitest'
import { computeRate, percentChange } from './rate'

describe('computeRate', () => {
  it('computes a percentage when the denominator is positive', () => {
    expect(computeRate(50, 200)).toBe(25)
  })

  it('returns null when the denominator is zero (avoids division by zero)', () => {
    expect(computeRate(50, 0)).toBeNull()
  })

  it('returns null when the denominator is null or undefined', () => {
    expect(computeRate(50, null)).toBeNull()
    expect(computeRate(50, undefined)).toBeNull()
  })

  it('returns 0, not null, when the numerator is zero but the denominator is valid', () => {
    expect(computeRate(0, 100)).toBe(0)
  })
})

describe('percentChange', () => {
  it('computes percent increase relative to the previous value', () => {
    expect(percentChange(150, 100)).toBe(50)
  })

  it('returns null when the previous value is zero', () => {
    expect(percentChange(100, 0)).toBeNull()
  })

  it('returns null when the previous value is missing', () => {
    expect(percentChange(100, undefined)).toBeNull()
  })
})
