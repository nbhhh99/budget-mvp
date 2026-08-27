import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { collectOpinetFuel } from './opinetFuel'

beforeEach(() => {
  process.env.OPINET_API_KEY = 'test-key'
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.OPINET_API_KEY
})

function stubFetch(body: { ok: boolean; status?: number; text: () => Promise<string> }) {
  vi.stubGlobal('fetch', vi.fn(async () => body))
}

describe('collectOpinetFuel', () => {
  it('키가 없으면 missing_key를 반환하고 fetch를 호출하지 않는다', async () => {
    delete process.env.OPINET_API_KEY
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    expect(await collectOpinetFuel()).toEqual({ status: 'missing_key', provider: 'opinet-fuel' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('실제 응답 형태(RESULT.OIL 배열)를 정상 파싱해 휘발유·경유만 저장한다', async () => {
    stubFetch({
      ok: true,
      text: async () =>
        JSON.stringify({
          RESULT: {
            OIL: [
              { PRODCD: 'B027', PRICE: '1650.25', DIFF: '3.50', TRADE_DT: '20260825' },
              { PRODCD: 'D047', PRICE: '1520.10', DIFF: '-1.20', TRADE_DT: '20260825' },
              { PRODCD: 'K015', PRICE: '999.00', DIFF: '0.00', TRADE_DT: '20260825' }, // 대상 외 유종
            ],
          },
        }),
    })
    const result = await collectOpinetFuel()
    expect(result.status).toBe('success')
    if (result.status !== 'success') throw new Error('unreachable')
    expect(result.indicators.map((i) => i.id)).toEqual(['fuel-gasoline', 'fuel-diesel'])
    expect(result.indicators[0]).toMatchObject({ value: 1650.25, change: 3.5 })
  })

  it('결과가 1건이면 RESULT.OIL이 배열이 아니라 단일 객체로 와도 처리한다', async () => {
    stubFetch({ ok: true, text: async () => JSON.stringify({ RESULT: { OIL: { PRODCD: 'B027', PRICE: '1650.25', DIFF: '3.50' } } }) })
    const result = await collectOpinetFuel()
    expect(result.status).toBe('success')
    if (result.status !== 'success') throw new Error('unreachable')
    expect(result.indicators.map((i) => i.id)).toEqual(['fuel-gasoline'])
  })

  it('RESULT.OIL이 빈 배열이면 not_released로 처리한다(아직 발표 전일 수 있음)', async () => {
    stubFetch({ ok: true, text: async () => JSON.stringify({ RESULT: { OIL: [] } }) })
    const result = await collectOpinetFuel()
    expect(result.status).toBe('not_released')
  })

  it('RESULT는 있지만 OIL 필드 자체가 없으면(오류 응답 가능성) 빈 배열로 뭉개지 않고 invalid_response로 보고한다', async () => {
    stubFetch({ ok: true, text: async () => JSON.stringify({ RESULT: { CODE: 'ERR-001', MSG: '인증 오류' } }) })
    const result = await collectOpinetFuel()
    expect(result.status).toBe('invalid_response')
    if (result.status !== 'invalid_response') throw new Error('unreachable')
    expect(result.reason).toContain('CODE')
  })

  it('RESULT 자체가 없으면 invalid_response로 보고한다', async () => {
    stubFetch({ ok: true, text: async () => JSON.stringify({ FOO: 'bar' }) })
    const result = await collectOpinetFuel()
    expect(result.status).toBe('invalid_response')
  })

  it('JSON을 요청했는데 XML이 오면 invalid_response로 보고한다', async () => {
    stubFetch({ ok: true, text: async () => '<html><body>error</body></html>' })
    const result = await collectOpinetFuel()
    expect(result.status).toBe('invalid_response')
    if (result.status !== 'invalid_response') throw new Error('unreachable')
    expect(result.reason).toContain('XML')
  })

  it('대상 유종(B027/D047)이 응답에 없으면 실제 PRODCD와 함께 invalid_response를 반환한다', async () => {
    stubFetch({ ok: true, text: async () => JSON.stringify({ RESULT: { OIL: [{ PRODCD: 'K015', PRICE: '999' }] } }) })
    const result = await collectOpinetFuel()
    expect(result.status).toBe('invalid_response')
    if (result.status !== 'invalid_response') throw new Error('unreachable')
    expect(result.reason).toContain('K015')
  })

  it('401 응답이면 unauthorized로 구분한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401 })))
    const result = await collectOpinetFuel()
    expect(result).toEqual({ status: 'unauthorized', provider: 'opinet-fuel', code: 'HTTP 401' })
  })

  it('네트워크 오류는 failed로 보고한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    const result = await collectOpinetFuel()
    expect(result.status).toBe('failed')
  })
})
