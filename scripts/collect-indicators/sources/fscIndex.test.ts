import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { collectFscIndex } from './fscIndex'
import { toKstYyyymmdd, yyyymmddToIso } from './dataGoKrEnvelope'

// referenceDate는 응답 본문의 basDt가 아니라 요청에 쓴 날짜(오늘, 조회 첫 시도)로
// 정해진다 — 테스트 실행 시점의 실제 오늘 날짜로 기대값을 계산해 하드코딩된 날짜가
// 시간이 지나 깨지지 않게 한다.
const TODAY_ISO = yyyymmddToIso(toKstYyyymmdd(new Date()))

function envelope(resultCode: string, resultMsg: string, items?: unknown): string {
  return JSON.stringify({ response: { header: { resultCode, resultMsg }, body: items === undefined ? undefined : { items } } })
}

function okEnvelope(rows: Record<string, unknown>[]): string {
  return envelope('00', 'NORMAL SERVICE.', { item: rows })
}

beforeEach(() => {
  process.env.DATA_GO_KR_API_KEY = 'test-key'
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.DATA_GO_KR_API_KEY
})

// collectFscIndex는 코스피/코스닥마다 별도로 idxNm 필터를 실어 요청한다(각각
// latest + 전일 교차검증, 최대 2회) — 순서대로 하나씩 소비되는 fetch 응답 큐를
// 만든다. 순차 await만 쓰므로(동시 호출 없음) 호출 순서를 그대로 신뢰할 수 있다.
function queueFetch(responses: { ok: boolean; status?: number; text?: () => Promise<string> }[]) {
  const spy = vi.fn(async () => {
    const next = responses.shift()
    if (!next) throw new Error('예상보다 많은 fetch 호출')
    return next
  })
  vi.stubGlobal('fetch', spy)
  return spy
}

describe('collectFscIndex', () => {
  it('키가 없으면 missing_key를 반환하고 fetch를 호출하지 않는다', async () => {
    delete process.env.DATA_GO_KR_API_KEY
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    expect(await collectFscIndex()).toEqual({ status: 'missing_key', provider: 'fsc-index' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('idxNm을 요청 필터로 실어 보낸다(클라이언트 페이지네이션에 의존하지 않는다)', async () => {
    const fetchSpy = queueFetch([
      { ok: true, text: async () => okEnvelope([{ basDt: '20260825', idxNm: '코스피', clpr: '3200.5', vs: '15.3', fltRt: '0.48' }]) },
      { ok: true, text: async () => okEnvelope([{ basDt: '20260824', idxNm: '코스피', clpr: '3185.2' }]) },
      { ok: true, text: async () => okEnvelope([{ basDt: '20260825', idxNm: '코스닥', clpr: '800.1', vs: '-2', fltRt: '-0.25' }]) },
      { ok: true, text: async () => okEnvelope([{ basDt: '20260824', idxNm: '코스닥', clpr: '802.1' }]) },
    ])
    await collectFscIndex()
    const firstUrl = new URL(String(fetchSpy.mock.calls[0][0]))
    expect(firstUrl.searchParams.get('idxNm')).toBe('코스피')
    const thirdUrl = new URL(String(fetchSpy.mock.calls[2][0]))
    expect(thirdUrl.searchParams.get('idxNm')).toBe('코스닥')
  })

  it('정상 응답이면 KOSPI·KOSDAQ을 API가 제공한 vs/fltRt로 채운다', async () => {
    queueFetch([
      // KOSPI: latest + 전일 교차검증
      { ok: true, text: async () => okEnvelope([{ basDt: '20260825', idxNm: '코스피', clpr: '3200.50', vs: '15.30', fltRt: '0.48' }]) },
      { ok: true, text: async () => okEnvelope([{ basDt: '20260824', idxNm: '코스피', clpr: '3185.20' }]) },
      // KOSDAQ: latest + 전일 교차검증
      { ok: true, text: async () => okEnvelope([{ basDt: '20260825', idxNm: '코스닥', clpr: '800.10', vs: '-2.00', fltRt: '-0.25' }]) },
      { ok: true, text: async () => okEnvelope([{ basDt: '20260824', idxNm: '코스닥', clpr: '802.10' }]) },
    ])
    const result = await collectFscIndex()
    expect(result.status).toBe('success')
    if (result.status !== 'success') throw new Error('unreachable')
    const kospi = result.indicators.find((i) => i.id === 'stock-kospi')
    expect(kospi).toMatchObject({ value: 3200.5, change: 15.3, changeRate: 0.48, referenceDate: TODAY_ISO, marketStatus: 'closed' })
    const kosdaq = result.indicators.find((i) => i.id === 'stock-kosdaq')
    expect(kosdaq).toMatchObject({ value: 800.1, change: -2, changeRate: -0.25 })
  })

  it('한쪽 지수만 응답에 있어도 그 지수만 성공으로 반환한다', async () => {
    queueFetch([
      // KOSPI: idxNm 필터를 걸었는데도 다른 지수만 온 경우(방어적 케이스) — row를
      // 못 찾으므로 전일 조회는 시도하지 않는다.
      { ok: true, text: async () => okEnvelope([{ basDt: '20260825', idxNm: '코스피200', clpr: '400.0', vs: '1', fltRt: '0.1' }]) },
      // KOSDAQ: 정상 + 전일 교차검증
      { ok: true, text: async () => okEnvelope([{ basDt: '20260825', idxNm: '코스닥', clpr: '800.0', vs: '1', fltRt: '0.1' }]) },
      { ok: true, text: async () => okEnvelope([{ basDt: '20260824', idxNm: '코스닥', clpr: '799.0' }]) },
    ])
    const result = await collectFscIndex()
    expect(result.status).toBe('success')
    if (result.status !== 'success') throw new Error('unreachable')
    expect(result.indicators.map((i) => i.id)).toEqual(['stock-kosdaq'])
  })

  it('둘 다 찾지 못하면 실제 idxNm 값과 함께 invalid_response를 반환한다', async () => {
    queueFetch([
      { ok: true, text: async () => okEnvelope([{ basDt: '20260825', idxNm: '코스피200', clpr: '400.0' }]) },
      { ok: true, text: async () => okEnvelope([{ basDt: '20260825', idxNm: '코스닥150', clpr: '100.0' }]) },
    ])
    const result = await collectFscIndex()
    expect(result.status).toBe('invalid_response')
    if (result.status !== 'invalid_response') throw new Error('unreachable')
    expect(result.reason).toContain('코스피200')
    expect(result.reason).toContain('코스닥150')
  })

  it('인증 오류(30)는 첫 지수에서 바로 unauthorized로 보고하고 나머지는 요청하지 않는다', async () => {
    const fetchSpy = queueFetch([{ ok: true, text: async () => envelope('30', 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR') }])
    const result = await collectFscIndex()
    expect(result).toEqual({ status: 'unauthorized', provider: 'fsc-index', code: '30 SERVICE_KEY_IS_NOT_REGISTERED_ERROR' })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('호출 한도 초과(22)는 rate_limited로 보고한다', async () => {
    queueFetch([{ ok: true, text: async () => envelope('22', 'LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR') }])
    const result = await collectFscIndex()
    expect(result.status).toBe('rate_limited')
  })

  it('둘 다 조회 기간 내내 자료가 없으면(resultCode 00 + 빈 items) not_released를 반환한다', async () => {
    const spy = vi.fn(async () => ({ ok: true, text: async () => envelope('00', 'NORMAL SERVICE.', '') }))
    vi.stubGlobal('fetch', spy)
    const result = await collectFscIndex()
    expect(result.status).toBe('not_released')
  })

  it('한쪽이 네트워크 오류여도 다른 지수는 계속 시도하고, 결국 아무것도 못 찾으면 invalid_response를 반환한다', async () => {
    let call = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        call += 1
        if (call === 1) throw new Error('network down') // KOSPI
        return { ok: true, text: async () => okEnvelope([{ basDt: '20260825', idxNm: '코스닥150', clpr: '100.0' }]) } // KOSDAQ
      }),
    )
    const result = await collectFscIndex()
    expect(result.status).toBe('invalid_response')
    if (result.status !== 'invalid_response') throw new Error('unreachable')
    expect(result.reason).toContain('코스닥150')
  })

  it('전일 조회에 실패해도 API가 제공한 값으로 성공 처리한다(교차검증은 부가 기능)', async () => {
    queueFetch([
      { ok: true, text: async () => okEnvelope([{ basDt: '20260825', idxNm: '코스피', clpr: '3200.50', vs: '15.30', fltRt: '0.48' }]) },
      { ok: false, status: 500 }, // KOSPI 전일 조회 실패 — 치명적이지 않아야 한다
      { ok: true, text: async () => okEnvelope([{ basDt: '20260825', idxNm: '코스닥', clpr: '800.10', vs: '-2.00', fltRt: '-0.25' }]) },
      { ok: false, status: 500 }, // KOSDAQ 전일 조회도 실패
    ])
    const result = await collectFscIndex()
    expect(result.status).toBe('success')
    if (result.status !== 'success') throw new Error('unreachable')
    expect(result.indicators.map((i) => i.id)).toEqual(['stock-kospi', 'stock-kosdaq'])
  })
})
