import { describe, expect, it } from 'vitest'
import {
  DEFAULT_HOUSEHOLD_TITLE,
  MAX_HOUSEHOLD_NAME_LENGTH,
  resolveHouseholdTitle,
  sanitizeHouseholdName,
} from './householdName'

describe('sanitizeHouseholdName', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sanitizeHouseholdName('  민지의 가계부  ')).toBe('민지의 가계부')
  })

  it('caps the length at 20 characters', () => {
    const long = 'a'.repeat(30)
    const result = sanitizeHouseholdName(long)
    expect(result.length).toBe(MAX_HOUSEHOLD_NAME_LENGTH)
    expect(result).toBe('a'.repeat(20))
  })

  it('reduces a whitespace-only input to an empty string', () => {
    expect(sanitizeHouseholdName('   ')).toBe('')
  })

  it('leaves an already-short name untouched', () => {
    expect(sanitizeHouseholdName('우리 집 가계부')).toBe('우리 집 가계부')
  })
})

describe('resolveHouseholdTitle', () => {
  it('returns the default title when the name is empty', () => {
    expect(resolveHouseholdTitle('')).toBe(DEFAULT_HOUSEHOLD_TITLE)
  })

  it('returns the default title when the name is undefined', () => {
    expect(resolveHouseholdTitle(undefined)).toBe(DEFAULT_HOUSEHOLD_TITLE)
  })

  it('returns the default title when the name is only whitespace', () => {
    expect(resolveHouseholdTitle('   ')).toBe(DEFAULT_HOUSEHOLD_TITLE)
  })

  it('returns the trimmed custom name as-is, without appending anything', () => {
    expect(resolveHouseholdTitle('차곡차곡 가계부')).toBe('차곡차곡 가계부')
    expect(resolveHouseholdTitle('  내 돈 기록장  ')).toBe('내 돈 기록장')
  })
})
