import { describe, expect, it } from 'vitest'
import { parseCsv, toCsvLine } from './csv'

describe('parseCsv', () => {
  it('parses simple comma-separated rows', () => {
    const rows = parseCsv('date,type,amount\n2026-08-01,expense,5000\n')
    expect(rows).toEqual([
      ['date', 'type', 'amount'],
      ['2026-08-01', 'expense', '5000'],
    ])
  })

  it('handles quoted fields containing commas', () => {
    const rows = parseCsv('memo\n"점심, 저녁"\n')
    expect(rows).toEqual([['memo'], ['점심, 저녁']])
  })

  it('handles escaped double quotes inside quoted fields', () => {
    const rows = parseCsv('memo\n"그가 ""안녕""이라고 했다"\n')
    expect(rows).toEqual([['memo'], ['그가 "안녕"이라고 했다']])
  })

  it('handles newlines inside quoted fields', () => {
    const rows = parseCsv('memo\n"줄1\n줄2"\n')
    expect(rows).toEqual([['memo'], ['줄1\n줄2']])
  })

  it('skips blank lines', () => {
    const rows = parseCsv('a,b\n\n1,2\n')
    expect(rows).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })
})

describe('toCsvLine', () => {
  it('quotes fields that contain commas', () => {
    expect(toCsvLine(['a', 'b,c'])).toBe('a,"b,c"')
  })

  it('escapes embedded double quotes', () => {
    expect(toCsvLine(['say "hi"'])).toBe('"say ""hi"""')
  })

  it('leaves plain fields unquoted', () => {
    expect(toCsvLine(['plain', '123'])).toBe('plain,123')
  })
})
