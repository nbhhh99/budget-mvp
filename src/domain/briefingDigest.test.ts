import { describe, expect, it } from 'vitest'
import {
  deriveMonthlyIndicatorMoves,
  generateDailyDigest,
  generateWeeklySummary,
  getIsoWeekId,
  getKstDateKey,
  getMonthId,
  isSameKstDay,
} from './briefingDigest'
import type { IndicatorHistoryPoint, MarketIndicator, Transaction } from '../types/models'

function indicator(overrides: Partial<MarketIndicator> = {}): MarketIndicator {
  return {
    id: 'fx-usd-krw',
    category: 'exchange',
    name: '원·달러 환율',
    value: 1350.5,
    unit: '원',
    change: 5.2,
    changeRate: 0.39,
    referenceDate: '2026-08-25',
    updatedAt: '2026-08-25T07:30:00.000Z',
    timezone: 'Asia/Seoul',
    sourceId: 'eximbank-fx',
    sourceName: '한국수출입은행',
    sourceUrl: 'https://www.koreaexim.go.kr',
    marketStatus: 'closed',
    freshness: 'fresh',
    ...overrides,
  }
}

describe('날짜/주차/월 경계 헬퍼', () => {
  it('getKstDateKey converts a UTC instant to a KST YYYY-MM-DD key', () => {
    // 2026-08-24T16:00:00Z -> 2026-08-25 01:00 KST
    expect(getKstDateKey(new Date('2026-08-24T16:00:00.000Z'))).toBe('2026-08-25')
  })

  it('isSameKstDay treats two instants on either side of UTC midnight, but the same KST day, as equal', () => {
    const a = new Date('2026-08-24T20:00:00.000Z') // 2026-08-25 05:00 KST
    const b = new Date('2026-08-24T23:00:00.000Z') // 2026-08-25 08:00 KST
    expect(isSameKstDay(a, b)).toBe(true)
  })

  it('getIsoWeekId matches known ISO week boundaries', () => {
    expect(getIsoWeekId(new Date(2026, 7, 25))).toBe('2026-W35')
    expect(getIsoWeekId(new Date(2026, 7, 24))).toBe('2026-W35')
    // 2025-12-31은 ISO 기준으로 2026년 1주차에 속한다(그 주의 목요일이 1월에 있음).
    expect(getIsoWeekId(new Date(2025, 11, 31))).toBe('2026-W01')
  })

  it('getMonthId formats as YYYY-MM', () => {
    expect(getMonthId(new Date(2026, 7, 25))).toBe('2026-08')
    expect(getMonthId(new Date(2026, 0, 5))).toBe('2026-01')
  })
})

describe('generateDailyDigest', () => {
  it('picks up to 3 indicators with the largest |changeRate| among fresh ones', () => {
    const indicators = [
      indicator({ id: 'a', changeRate: 0.5 }),
      indicator({ id: 'b', changeRate: -3.2 }),
      indicator({ id: 'c', changeRate: 1.1 }),
      indicator({ id: 'd', changeRate: -0.2 }),
      indicator({ id: 'e', changeRate: 2.0 }),
    ]
    const digest = generateDailyDigest(indicators)
    expect(digest.map((d) => d.indicatorId)).toEqual(['b', 'e', 'c'])
  })

  it('excludes indicators that are not fresh or have no changeRate', () => {
    const indicators = [
      indicator({ id: 'stale', changeRate: 5, freshness: 'stale' }),
      indicator({ id: 'pending', changeRate: null, freshness: 'pending', value: null, change: null }),
      indicator({ id: 'ok', changeRate: 1 }),
    ]
    expect(generateDailyDigest(indicators).map((d) => d.indicatorId)).toEqual(['ok'])
  })

  it('excludes indicators with a zero changeRate (no meaningful change)', () => {
    expect(generateDailyDigest([indicator({ changeRate: 0 })])).toEqual([])
  })

  it('never fabricates a cause — headline only states the observed change', () => {
    const [finding] = generateDailyDigest([indicator({ name: '원·달러 환율', change: 5.2, changeRate: 0.39 })])
    expect(finding.headline).toContain('원·달러 환율')
    expect(finding.pathway).not.toMatch(/때문|원인/)
  })
})

describe('generateWeeklySummary', () => {
  const history = new Map<string, IndicatorHistoryPoint[]>([
    [
      'fx-usd-krw',
      [
        { referenceDate: '2026-08-18', value: 1330 },
        { referenceDate: '2026-08-25', value: 1350 },
      ],
    ],
  ])

  function tx(overrides: Partial<Transaction> = {}): Transaction {
    return {
      id: 't1',
      type: 'expense',
      amount: 10000,
      categoryId: 'food',
      date: '2026-08-20',
      time: '12:00',
      createdAt: '2026-08-20T12:00:00.000Z',
      updatedAt: '2026-08-20T12:00:00.000Z',
      ...overrides,
    }
  }

  it('computes an indicator move only for indicators with 2+ history points', () => {
    const summary = generateWeeklySummary([indicator()], history, [])
    expect(summary.indicatorMoves).toHaveLength(1)
    expect(summary.indicatorMoves[0].changeRate).toBeCloseTo(((1350 - 1330) / 1330) * 100, 2)
  })

  it('excludes indicators with fewer than 2 history points instead of guessing', () => {
    const summary = generateWeeklySummary([indicator({ id: 'no-history' })], new Map(), [])
    expect(summary.indicatorMoves).toEqual([])
  })

  it('sums personal transactions by type for the week', () => {
    const summary = generateWeeklySummary(
      [],
      new Map(),
      [tx({ type: 'income', amount: 100000 }), tx({ type: 'expense', amount: 30000 }), tx({ type: 'saving', amount: 20000 })],
    )
    expect(summary.personal).toEqual({ income: 100000, expense: 30000, saving: 20000 })
  })
})

describe('deriveMonthlyIndicatorMoves', () => {
  it('mirrors the weekly move calculation but is independent of it', () => {
    const history = new Map<string, IndicatorHistoryPoint[]>([
      ['fx-usd-krw', [{ referenceDate: '2026-08-01', value: 1300 }, { referenceDate: '2026-08-25', value: 1350 }]],
    ])
    const moves = deriveMonthlyIndicatorMoves([indicator()], history)
    expect(moves[0].changeRate).toBeCloseTo(((1350 - 1300) / 1300) * 100, 2)
  })
})
