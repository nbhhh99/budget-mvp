import { describe, expect, it } from 'vitest'
import type { MarketIndicator } from '../../src/types/models'
import type { CollectedIndicator, ProviderResult } from './types'
import { type ManifestEntry, buildIndicator, isValidCollected, shouldUseNewValue } from './buildIndicator'

const manifestEntry: ManifestEntry = {
  id: 'fx-usd-krw',
  category: 'exchange',
  name: '원·달러 환율',
  unit: '원',
  sourceId: 'eximbank-fx',
  sourceName: '한국수출입은행',
  sourceUrl: 'https://www.koreaexim.go.kr',
  range: [100, 5000],
}

function makeCollected(overrides: Partial<CollectedIndicator> = {}): CollectedIndicator {
  return {
    id: 'fx-usd-krw',
    category: 'exchange',
    name: '원·달러 환율',
    value: 1350,
    unit: '원',
    change: 5,
    changeRate: 0.37,
    referenceDate: '2026-08-25',
    sourceId: 'eximbank-fx',
    sourceName: '한국수출입은행',
    sourceUrl: 'https://www.koreaexim.go.kr',
    marketStatus: 'closed',
    ...overrides,
  }
}

function makeExisting(overrides: Partial<MarketIndicator> = {}): MarketIndicator {
  return {
    id: 'fx-usd-krw',
    category: 'exchange',
    name: '원·달러 환율',
    value: 1340,
    unit: '원',
    change: 2,
    changeRate: 0.15,
    referenceDate: '2026-08-24',
    updatedAt: '2026-08-24T07:30:00.000Z',
    timezone: 'Asia/Seoul',
    sourceId: 'eximbank-fx',
    sourceName: '한국수출입은행',
    sourceUrl: 'https://www.koreaexim.go.kr',
    marketStatus: 'closed',
    freshness: 'fresh',
    ...overrides,
  }
}

const NOW = '2026-08-25T07:30:00.000Z'

describe('isValidCollected', () => {
  it('범위 안의 값은 유효하다', () => {
    expect(isValidCollected(makeCollected({ value: 1350 }), [manifestEntry])).toBe(true)
  })
  it('범위를 벗어난 값(이상치)은 무효로 처리한다', () => {
    expect(isValidCollected(makeCollected({ value: 99999 }), [manifestEntry])).toBe(false)
  })
  it('숫자가 아닌 값은 무효로 처리한다', () => {
    expect(isValidCollected(makeCollected({ value: Number.NaN }), [manifestEntry])).toBe(false)
  })
  it('매니페스트에 없는 id는 무효로 처리한다', () => {
    expect(isValidCollected(makeCollected({ id: 'unknown-id' }), [manifestEntry])).toBe(false)
  })
})

describe('shouldUseNewValue', () => {
  it('새 값이 없으면 쓰지 않는다', () => {
    expect(shouldUseNewValue(makeExisting(), undefined)).toBe(false)
  })
  it('기존 값이 없으면 새 값을 쓴다', () => {
    expect(shouldUseNewValue(undefined, makeCollected())).toBe(true)
  })
  it('기준일이 앞으로 나아가면 새 값을 쓴다', () => {
    expect(shouldUseNewValue(makeExisting({ referenceDate: '2026-08-24' }), makeCollected({ referenceDate: '2026-08-25' }))).toBe(true)
  })
  it('기준일이 과거로 역행하면 새 값을 쓰지 않는다', () => {
    expect(shouldUseNewValue(makeExisting({ referenceDate: '2026-08-25' }), makeCollected({ referenceDate: '2026-08-20' }))).toBe(false)
  })
})

describe('buildIndicator', () => {
  it('이번에 새 값을 얻었으면 fresh로 표시한다', () => {
    const result = buildIndicator(manifestEntry, makeCollected(), makeExisting(), { status: 'success', provider: 'eximbank-fx', indicators: [] }, NOW)
    expect(result.freshness).toBe('fresh')
    expect(result.value).toBe(1350)
    expect(result.updatedAt).toBe(NOW)
  })

  it('새 값을 못 얻었지만 기존 정상값이 있으면 stale로 보존한다', () => {
    const existing = makeExisting()
    const result = buildIndicator(manifestEntry, undefined, existing, { status: 'failed', provider: 'eximbank-fx', reason: 'network' }, NOW)
    expect(result.freshness).toBe('stale')
    expect(result.value).toBe(existing.value)
  })

  it('이번 그룹 호출 대상이 아니었으면(providerResult 없음) 기존 상태를 그대로 둔다', () => {
    const existing = makeExisting({ value: null, freshness: 'pending' })
    const result = buildIndicator(manifestEntry, undefined, existing, undefined, NOW)
    expect(result).toBe(existing)
  })

  it('키 미등록(missing_key)이면 pending("데이터 연동 준비 중")이다', () => {
    const result = buildIndicator(manifestEntry, undefined, undefined, { status: 'missing_key', provider: 'eximbank-fx' }, NOW)
    expect(result.freshness).toBe('pending')
    expect(result.value).toBeNull()
  })

  it('미구현(not_implemented)이면 pending이다', () => {
    const result = buildIndicator(manifestEntry, undefined, undefined, { status: 'not_implemented', provider: 'eximbank-fx', reason: '엔드포인트 미확인' }, NOW)
    expect(result.freshness).toBe('pending')
  })

  it('인증 오류(unauthorized)면 unavailable("일시적으로 불러올 수 없음")이다 — pending과 구분', () => {
    const result = buildIndicator(manifestEntry, undefined, undefined, { status: 'unauthorized', provider: 'eximbank-fx', code: 'result=3' }, NOW)
    expect(result.freshness).toBe('unavailable')
  })

  it('호출 한도 초과(rate_limited)면 unavailable이다', () => {
    const result = buildIndicator(manifestEntry, undefined, undefined, { status: 'rate_limited', provider: 'eximbank-fx' }, NOW)
    expect(result.freshness).toBe('unavailable')
  })

  it('응답 형식 오류(invalid_response)면 unavailable이다', () => {
    const result = buildIndicator(manifestEntry, undefined, undefined, { status: 'invalid_response', provider: 'eximbank-fx', reason: '필드 없음' }, NOW)
    expect(result.freshness).toBe('unavailable')
  })

  it('같은 상태가 반복되면 기존 객체를 그대로 재사용해 불필요한 diff를 만들지 않는다', () => {
    const pendingExisting = makeExisting({ value: null, freshness: 'pending', updatedAt: '2026-08-01T00:00:00.000Z' })
    const result: ProviderResult = { status: 'missing_key', provider: 'eximbank-fx' }
    const rebuilt = buildIndicator(manifestEntry, undefined, pendingExisting, result, NOW)
    expect(rebuilt).toBe(pendingExisting) // 새 객체를 만들지 않고 기존 참조를 그대로 반환
    expect(rebuilt.updatedAt).toBe('2026-08-01T00:00:00.000Z') // updatedAt이 갱신되지 않았다
  })

  it('pending에서 unavailable로 상태 분류가 바뀌면 새로 기록한다', () => {
    const pendingExisting = makeExisting({ value: null, freshness: 'pending' })
    const result = buildIndicator(manifestEntry, undefined, pendingExisting, { status: 'unauthorized', provider: 'eximbank-fx' }, NOW)
    expect(result.freshness).toBe('unavailable')
    expect(result.updatedAt).toBe(NOW)
  })
})
