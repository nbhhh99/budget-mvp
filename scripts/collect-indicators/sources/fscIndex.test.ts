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

// 순서대로 하나씩 소비되는 fetch 응답 큐를 만든다. collectFscIndex는 순차적으로
// await하므로(동시 호출 없음) 호출 순서를 그대로 신뢰할 수 있다.
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

  it('정상 응답이면 KOSPI·KOSDAQ을 API가 제공한 vs/fltRt로 채운다', async () => {
    queueFetch([
      { ok: true, text: async () => okEnvelope([{ basDt: '20260825', idxNm: '코스피', clpr: '3200.50', vs: '15.30', fltRt: '0.48' }, { basDt: '20260825', idxNm: '코스닥', clpr: '800.10', vs: '-2.00', fltRt: '-0.25' }]) },
      { ok: true, text: async () => okEnvelope([{ basDt: '20260824', idxNm: '코스피', clpr: '3185.20' }, { basDt: '20260824', idxNm: '코스닥', clpr: '802.10' }]) },
    ])
    const result = await collectFscIndex()
    expect(result.status).toBe('success')
    if (result.status !== 'success') throw new Error('unreachable')
    const kospi = result.indicators.find((i) => i.id === 'stock-kospi')
    expect(kospi).toMatchObject({ value: 3200.5, change: 15.3, changeRate: 0.48, referenceDate: TODAY_ISO, marketStatus: 'closed' })
    const kosdaq = result.indicators.find((i) => i.id === 'stock-kosdaq')
    expect(kosdaq).toMatchObject({ value: 800.1, change: -2, changeRate: -0.25 })
  })

  it('코스피200처럼 이름이 비슷한 하위지수는 채택하지 않는다', async () => {
    queueFetch([
      { ok: true, text: async () => okEnvelope([{ basDt: '20260825', idxNm: '코스피200', clpr: '400.0', vs: '1', fltRt: '0.1' }, { basDt: '20260825', idxNm: '코스닥', clpr: '800.0', vs: '1', fltRt: '0.1' }]) },
      { ok: true, text: async () => okEnvelope([]) },
    ])
    const result = await collectFscIndex()
    expect(result.status).toBe('success')
    if (result.status !== 'success') throw new Error('unreachable')
    expect(result.indicators.map((i) => i.id)).toEqual(['stock-kosdaq'])
  })

  it('코스피/코스닥을 전혀 찾지 못하면 실제 idxNm 값과 함께 invalid_response를 반환한다', async () => {
    queueFetch([{ ok: true, text: async () => okEnvelope([{ basDt: '20260825', idxNm: '코스피200', clpr: '400.0' }]) }])
    const result = await collectFscIndex()
    expect(result.status).toBe('invalid_response')
    if (result.status !== 'invalid_response') throw new Error('unreachable')
    expect(result.reason).toContain('코스피200')
  })

  it('인증 오류(30)는 unauthorized로 보고한다', async () => {
    queueFetch([{ ok: true, text: async () => envelope('30', 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR') }])
    const result = await collectFscIndex()
    expect(result).toEqual({ status: 'unauthorized', provider: 'fsc-index', code: '30 SERVICE_KEY_IS_NOT_REGISTERED_ERROR' })
  })

  it('호출 한도 초과(22)는 rate_limited로 보고한다', async () => {
    queueFetch([{ ok: true, text: async () => envelope('22', 'LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR') }])
    const result = await collectFscIndex()
    expect(result.status).toBe('rate_limited')
  })

  it('조회 기간 내내 자료가 없으면(휴장 연속 등) not_released를 반환한다', async () => {
    const spy = vi.fn(async () => ({ ok: true, text: async () => envelope('03', 'NODATA_ERROR') }))
    vi.stubGlobal('fetch', spy)
    const result = await collectFscIndex()
    expect(result.status).toBe('not_released')
  })

  it('네트워크 오류는 failed로 보고한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    const result = await collectFscIndex()
    expect(result.status).toBe('failed')
    if (result.status !== 'failed') throw new Error('unreachable')
    expect(result.reason).toContain('network down')
  })

  it('전일 조회에 실패해도 API가 제공한 값으로 성공 처리한다(교차검증은 부가 기능)', async () => {
    queueFetch([
      { ok: true, text: async () => okEnvelope([{ basDt: '20260825', idxNm: '코스피', clpr: '3200.50', vs: '15.30', fltRt: '0.48' }]) },
      { ok: false, status: 500 },
    ])
    const result = await collectFscIndex()
    expect(result.status).toBe('success')
  })
})
