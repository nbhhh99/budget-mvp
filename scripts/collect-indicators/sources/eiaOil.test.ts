import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { collectEiaOil } from './eiaOil'

// EIA API v2 문서화된 표준 응답 스키마(response.data[].{period,value,series,units})를
// 기준으로 구성한 fixture다. 이 세션에는 등록된 EIA_API_KEY가 없어 실제 응답을 캡처하지
// 못했으므로, 필드가 문서와 다를 경우를 대비해 eiaOil.ts는 이 형태와 다르면
// invalid_response/empty로 처리하고 값을 지어내지 않는다.
function eiaFixture(seriesId: string, rows: { period: string; value: string | number }[]) {
  return {
    response: {
      data: rows.map((r) => ({ period: r.period, series: seriesId, value: r.value, units: '$/BBL' })),
    },
  }
}

beforeEach(() => {
  process.env.EIA_API_KEY = 'test-key'
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.EIA_API_KEY
})

describe('collectEiaOil', () => {
  it('키가 없으면 missing_key를 반환하고 fetch를 호출하지 않는다', async () => {
    delete process.env.EIA_API_KEY
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const result = await collectEiaOil()
    expect(result).toEqual({ status: 'missing_key', provider: 'eia' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('정상 응답이면 WTI·Brent 최신값과 직전값 대비 등락을 계산한다', async () => {
    const fetchSpy = vi.fn(async (url: unknown) => {
      const seriesId = String(url).includes('RWTC') ? 'RWTC' : 'RBRTE'
      const fixture =
        seriesId === 'RWTC'
          ? eiaFixture('RWTC', [
              { period: '2026-08-25', value: 63.5 },
              { period: '2026-08-24', value: 63.0 },
            ])
          : eiaFixture('RBRTE', [
              { period: '2026-08-25', value: 67.2 },
              { period: '2026-08-24', value: 66.0 },
            ])
      return { ok: true, status: 200, json: async () => fixture }
    })
    vi.stubGlobal('fetch', fetchSpy)

    const result = await collectEiaOil()
    expect(result.status).toBe('success')
    if (result.status !== 'success') throw new Error('unreachable')
    const wti = result.indicators.find((i) => i.id === 'oil-wti')
    expect(wti?.value).toBe(63.5)
    expect(wti?.change).toBe(0.5)
    expect(wti?.referenceDate).toBe('2026-08-25')
    const brent = result.indicators.find((i) => i.id === 'oil-brent')
    expect(brent?.value).toBe(67.2)
  })

  it('결측치(".")는 건너뛰고 다음 유효값을 최신값으로 쓴다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () =>
          eiaFixture('RWTC', [
            { period: '2026-08-25', value: '.' }, // 결측
            { period: '2026-08-24', value: 63.0 },
            { period: '2026-08-23', value: 62.5 },
          ]),
      })),
    )
    const result = await collectEiaOil()
    expect(result.status).toBe('success')
    if (result.status !== 'success') throw new Error('unreachable')
    const wti = result.indicators.find((i) => i.id === 'oil-wti')
    expect(wti?.value).toBe(63.0)
    expect(wti?.referenceDate).toBe('2026-08-24')
  })

  it('401 응답이면 unauthorized로 구분한다(데이터 없음과 다르게 취급)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401 })))
    const result = await collectEiaOil()
    expect(result).toEqual({ status: 'unauthorized', provider: 'eia', code: 'HTTP 401' })
  })

  it('빈 데이터 배열이면 not_released로 처리한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ response: { data: [] } }) })),
    )
    const result = await collectEiaOil()
    expect(result.status).toBe('not_released')
  })

  it('네트워크 오류는 failed로 보고한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    const result = await collectEiaOil()
    expect(result.status).toBe('failed')
    if (result.status !== 'failed') throw new Error('unreachable')
    expect(result.reason).toContain('network down')
  })
})
