import { describe, expect, it } from 'vitest'
import {
  UPDATE_SCHEDULE_LABEL,
  computeFreshness,
  formatChangeText,
  formatKstDate,
  formatKstDateTime,
  getDirection,
  getIndicatorBasisKind,
} from './indicatorFormat'

describe('getDirection', () => {
  it('classifies positive/negative/zero/null/undefined change', () => {
    expect(getDirection(5)).toBe('up')
    expect(getDirection(-5)).toBe('down')
    expect(getDirection(0)).toBe('flat')
    expect(getDirection(null)).toBe('flat')
    expect(getDirection(undefined)).toBe('flat')
  })
})

describe('formatChangeText', () => {
  it('includes both the amount and rate with a direction word', () => {
    const text = formatChangeText(5.2, 0.42)
    expect(text).toContain('5.2')
    expect(text).toContain('+0.42%')
    expect(text).toContain('상승')
  })

  it('uses 하락 for negative change', () => {
    expect(formatChangeText(-3, -1.1)).toContain('하락')
  })

  it('handles missing change/changeRate gracefully', () => {
    expect(formatChangeText(null, null)).toBe('전일 대비 정보 없음')
  })
})

describe('computeFreshness', () => {
  // KST로도 같은 날짜(2026-08-25)라 날짜 경계 문제 없이 단순하게 테스트할 수 있다.
  const now = new Date('2026-08-25T12:00:00.000Z')

  it('is unavailable when value is null', () => {
    expect(computeFreshness({ value: null, updatedAt: now.toISOString(), referenceDate: '2026-08-25', category: 'exchange' }, now)).toBe(
      'unavailable',
    )
  })

  it('is unavailable when referenceDate is malformed(non-crypto categories rely on it)', () => {
    expect(computeFreshness({ value: 1, updatedAt: now.toISOString(), referenceDate: 'not-a-date', category: 'exchange' }, now)).toBe(
      'unavailable',
    )
  })

  it('crypto는 여전히 updatedAt 기준 15분 창을 쓴다(referenceDate가 조회 날짜일 뿐이라 무시)', () => {
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString()
    const twentyMinAgo = new Date(now.getTime() - 20 * 60 * 1000).toISOString()
    expect(computeFreshness({ value: 1, updatedAt: tenMinAgo, referenceDate: '2026-08-25', category: 'crypto' }, now)).toBe('fresh')
    expect(computeFreshness({ value: 1, updatedAt: twentyMinAgo, referenceDate: '2026-08-25', category: 'crypto' }, now)).toBe('stale')
  })

  it('crypto가 아니면 updatedAt이 아무리 최근이어도 referenceDate가 오래됐으면 stale이다(수집 성공 ≠ 데이터가 최신)', () => {
    // 실제로 관측된 사례를 그대로 재현한다: EIA(WTI/Brent) 수집이 매일 성공해
    // updatedAt은 계속 "지금"으로 갱신되지만, 응답의 최신 값 자체(referenceDate)는
    // 며칠째 그대로였다 — updatedAt만 보면 "fresh"로 잘못 표시된다.
    expect(
      computeFreshness({ value: 1, updatedAt: now.toISOString(), referenceDate: '2026-08-19', category: 'oil' }, now),
    ).toBe('stale')
  })

  it('평일 발표 카테고리(환율·주식·금·해외유가)는 4일까지는 fresh, 5일부터 stale이다', () => {
    for (const category of ['exchange', 'stock', 'gold', 'oil'] as const) {
      expect(computeFreshness({ value: 1, updatedAt: now.toISOString(), referenceDate: '2026-08-21', category }, now)).toBe('fresh')
      expect(computeFreshness({ value: 1, updatedAt: now.toISOString(), referenceDate: '2026-08-20', category }, now)).toBe('stale')
    }
  })

  it('기름값(매일 발표)은 2일까지는 fresh, 3일부터 stale이다', () => {
    expect(computeFreshness({ value: 1, updatedAt: now.toISOString(), referenceDate: '2026-08-23', category: 'fuel' }, now)).toBe(
      'fresh',
    )
    expect(computeFreshness({ value: 1, updatedAt: now.toISOString(), referenceDate: '2026-08-22', category: 'fuel' }, now)).toBe(
      'stale',
    )
  })

  it('거시지표는 월간·분기 통계라 45일까지 fresh로 본다', () => {
    expect(computeFreshness({ value: 1, updatedAt: now.toISOString(), referenceDate: '2026-07-16', category: 'macro' }, now)).toBe(
      'fresh',
    )
  })
})

describe('formatKstDateTime', () => {
  it('formats an ISO UTC timestamp as KST (UTC+9)', () => {
    // 2026-08-25T00:00:00Z -> 2026-08-25 09:00 KST
    expect(formatKstDateTime('2026-08-25T00:00:00.000Z')).toBe('2026.08.25 09:00')
  })

  it('returns a fallback string for an invalid date', () => {
    expect(formatKstDateTime('not-a-date')).toBe('알 수 없음')
  })
})

describe('formatKstDate', () => {
  it('formats a YYYY-MM-DD reference date without leading zeros', () => {
    expect(formatKstDate('2026-08-27')).toBe('2026. 8. 27.')
  })

  it('does not shift the date across a timezone conversion (no Date object involved)', () => {
    expect(formatKstDate('2026-01-01')).toBe('2026. 1. 1.')
  })

  it('returns the input unchanged when it is not a YYYY-MM-DD string', () => {
    expect(formatKstDate('알 수 없음')).toBe('알 수 없음')
  })
})

describe('getIndicatorBasisKind / UPDATE_SCHEDULE_LABEL', () => {
  it('treats crypto as observed(조회 시각) since referenceDate is just the lookup date, not an official as-of date', () => {
    expect(getIndicatorBasisKind('crypto')).toBe('observed')
  })

  it('treats every other category as reference(기준일)', () => {
    expect(getIndicatorBasisKind('exchange')).toBe('reference')
    expect(getIndicatorBasisKind('stock')).toBe('reference')
    expect(getIndicatorBasisKind('oil')).toBe('reference')
    expect(getIndicatorBasisKind('fuel')).toBe('reference')
    expect(getIndicatorBasisKind('gold')).toBe('reference')
    expect(getIndicatorBasisKind('macro')).toBe('reference')
  })

  it('applies the schedule text §4 assigns to each category', () => {
    expect(UPDATE_SCHEDULE_LABEL.exchange).toBe('평일 오후 4시 30분')
    expect(UPDATE_SCHEDULE_LABEL.stock).toBe('평일 오후 4시 30분')
    expect(UPDATE_SCHEDULE_LABEL.gold).toBe('평일 오후 4시 30분')
    expect(UPDATE_SCHEDULE_LABEL.fuel).toBe('매일 오전 7시')
    expect(UPDATE_SCHEDULE_LABEL.oil).toBe('평일 오전 9시')
    expect(UPDATE_SCHEDULE_LABEL.crypto).toBe('화면 진입 시 확인')
    expect(UPDATE_SCHEDULE_LABEL.macro).toBe('재무 브리핑 업데이트 시 반영')
  })
})
