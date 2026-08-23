import { describe, expect, it } from 'vitest'
import {
  DEFAULT_HOUSEHOLD_SUBTITLE,
  DEFAULT_HOUSEHOLD_TITLE,
  MAX_HOUSEHOLD_NAME_LENGTH,
  MAX_HOUSEHOLD_SUBTITLE_LENGTH,
  resolveHouseholdSubtitle,
  resolveHouseholdTitle,
  sanitizeHouseholdName,
  sanitizeHouseholdSubtitle,
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

describe('sanitizeHouseholdSubtitle', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sanitizeHouseholdSubtitle('  천천히 꾸준하게  ')).toBe('천천히 꾸준하게')
  })

  it('caps the length at 30 characters', () => {
    const long = 'a'.repeat(40)
    const result = sanitizeHouseholdSubtitle(long)
    expect(result.length).toBe(MAX_HOUSEHOLD_SUBTITLE_LENGTH)
  })

  it('reduces a whitespace-only input to an empty string', () => {
    expect(sanitizeHouseholdSubtitle('   ')).toBe('')
  })
})

describe('resolveHouseholdSubtitle', () => {
  it('returns the default subtitle when empty/undefined/whitespace-only', () => {
    expect(resolveHouseholdSubtitle('')).toBe(DEFAULT_HOUSEHOLD_SUBTITLE)
    expect(resolveHouseholdSubtitle(undefined)).toBe(DEFAULT_HOUSEHOLD_SUBTITLE)
    expect(resolveHouseholdSubtitle('   ')).toBe(DEFAULT_HOUSEHOLD_SUBTITLE)
  })

  it('returns the trimmed custom subtitle as-is', () => {
    expect(resolveHouseholdSubtitle('  천천히, 그러나 꾸준하게  ')).toBe('천천히, 그러나 꾸준하게')
  })
})
