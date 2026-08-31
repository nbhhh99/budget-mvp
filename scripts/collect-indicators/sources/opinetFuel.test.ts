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
  it('공식 파라미터명 certkey로 인증키를 전달한다(잘못된 code 파라미터 사용 금지)', async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, text: async () => JSON.stringify({ RESULT: { OIL: [] } }) }))
    vi.stubGlobal('fetch', fetchSpy)
    await collectOpinetFuel()
    const requestedUrl = String(fetchSpy.mock.calls[0][0])
    expect(requestedUrl).toContain('certkey=test-key')
    expect(requestedUrl).not.toContain('code=test-key')
  })

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

  it('응답에 TRADE_DT(YYYYMMDD)가 있으면 오늘 날짜 대신 그 값을 기준일로 쓴다', async () => {
    stubFetch({
      ok: true,
      text: async () =>
        JSON.stringify({
          RESULT: {
            OIL: [
              { PRODCD: 'B027', PRICE: '1650.25', DIFF: '3.50', TRADE_DT: '20260825' },
              { PRODCD: 'D047', PRICE: '1520.10', DIFF: '-1.20', TRADE_DT: '20260825' },
            ],
          },
        }),
    })
    const result = await collectOpinetFuel()
    expect(result.status).toBe('success')
    if (result.status !== 'success') throw new Error('unreachable')
    expect(result.indicators.map((i) => i.referenceDate)).toEqual(['2026-08-25', '2026-08-25'])
  })

  it('TRADE_DT가 없거나 형식이 다르면(추측하지 않고) 오늘 날짜로 대체한다', async () => {
    stubFetch({
      ok: true,
      text: async () => JSON.stringify({ RESULT: { OIL: [{ PRODCD: 'B027', PRICE: '1650.25', DIFF: '3.50', TRADE_DT: '2026-08-25' }] } }),
    })
    const result = await collectOpinetFuel()
    expect(result.status).toBe('success')
    if (result.status !== 'success') throw new Error('unreachable')
    const today = new Date()
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    expect(result.indicators[0].referenceDate).toBe(todayIso)
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

  it('401 응답은 인증키 오류로 구분한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401 })))
    const result = await collectOpinetFuel()
    expect(result).toEqual({ status: 'unauthorized', provider: 'opinet-fuel', code: '인증키 오류로 추정 (HTTP 401)' })
  })

  it('403 응답은 API 활용 미승인으로 구분한다(401과 다른 사유)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 403 })))
    const result = await collectOpinetFuel()
    expect(result).toEqual({ status: 'unauthorized', provider: 'opinet-fuel', code: 'API 활용 미승인으로 추정 (HTTP 403)' })
  })

  it('HTTP 상태코드를 항상 기록한다(진단용)', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    stubFetch({ ok: true, status: 200, text: async () => JSON.stringify({ RESULT: { OIL: [] } }) })
    await collectOpinetFuel()
    expect(logSpy.mock.calls.some((call) => String(call[0]).includes('HTTP 상태코드: 200'))).toBe(true)
    logSpy.mockRestore()
  })

  it('응답의 최상위 필드명은 기록하되 API 키는 어떤 로그에도 남기지 않는다', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    stubFetch({ ok: true, text: async () => JSON.stringify({ RESULT: {}, EXTRA_FIELD: 1 }) })
    await collectOpinetFuel()
    expect(logSpy.mock.calls.some((call) => String(call[0]).includes('EXTRA_FIELD'))).toBe(true)
    const allLoggedText = [...logSpy.mock.calls, ...warnSpy.mock.calls].flat().map(String).join('\n')
    expect(allLoggedText).not.toContain('test-key')
    logSpy.mockRestore()
    warnSpy.mockRestore()
  })

  it('RESULT는 있지만 OIL이 없을 때 API 오류코드·메시지가 있으면 그대로 노출한다', async () => {
    stubFetch({ ok: true, text: async () => JSON.stringify({ RESULT: { CODE: 'ERR-001', MSG: '인증되지 않은 요청입니다.' } }) })
    const result = await collectOpinetFuel()
    expect(result.status).toBe('invalid_response')
    if (result.status !== 'invalid_response') throw new Error('unreachable')
    expect(result.reason).toContain('ERR-001')
    expect(result.reason).toContain('인증되지 않은 요청입니다.')
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
