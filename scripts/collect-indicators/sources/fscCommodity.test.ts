import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { collectFscGold } from './fscCommodity'
import { toKstYyyymmdd, yyyymmddToIso } from './dataGoKrEnvelope'

// referenceDate는 응답의 basDt가 아니라 요청 날짜(오늘)로 정해진다 — 테스트 실행
// 시점의 실제 날짜로 기대값을 계산해 하드코딩된 날짜가 시간이 지나 깨지지 않게 한다.
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

describe('collectFscGold', () => {
  it('키가 없으면 missing_key를 반환하고 fetch를 호출하지 않는다', async () => {
    delete process.env.DATA_GO_KR_API_KEY
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    expect(await collectFscGold()).toEqual({ status: 'missing_key', provider: 'fsc-gold' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('금 99.99_1Kg(04020000) 종목만 골라 clpr을 그대로 원/g으로 쓴다(1Kg은 거래단위 표기일 뿐 가격단위가 아님)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () =>
          okEnvelope([
            { basDt: '20260825', srtnCd: '04020001', itmsNm: '금 99.99_100g', clpr: '92000', vs: '150', fltRt: '0.16' },
            { basDt: '20260825', srtnCd: '04020000', itmsNm: '금 99.99_1Kg', clpr: '92000', vs: '150', fltRt: '0.16' },
          ]),
      })),
    )
    const result = await collectFscGold()
    expect(result.status).toBe('success')
    if (result.status !== 'success') throw new Error('unreachable')
    expect(result.indicators).toEqual([
      expect.objectContaining({
        id: 'gold-krx',
        category: 'gold',
        value: 92000,
        unit: '원/g',
        change: 150,
        changeRate: 0.16,
        referenceDate: TODAY_ISO,
        marketStatus: 'closed',
      }),
    ])
  })

  it('srtnCd가 없어도 itmsNm으로 보조 매칭한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, text: async () => okEnvelope([{ basDt: '20260825', itmsNm: '금 99.99_1Kg', clpr: '92000' }]) })),
    )
    const result = await collectFscGold()
    expect(result.status).toBe('success')
    if (result.status !== 'success') throw new Error('unreachable')
    expect(result.indicators[0].value).toBe(92000)
  })

  it('대상 종목이 응답에 없으면 실제 종목 목록과 함께 invalid_response를 반환한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, text: async () => okEnvelope([{ basDt: '20260825', srtnCd: '09999999', itmsNm: '배출권' }]) })),
    )
    const result = await collectFscGold()
    expect(result.status).toBe('invalid_response')
    if (result.status !== 'invalid_response') throw new Error('unreachable')
    expect(result.reason).toContain('배출권')
  })

  it('단일 결과가 배열이 아니라 단일 객체로 와도 처리한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => envelope('00', 'NORMAL SERVICE.', { item: { basDt: '20260825', srtnCd: '04020000', clpr: '92000' } }),
      })),
    )
    const result = await collectFscGold()
    expect(result.status).toBe('success')
  })

  it('인증 오류는 unauthorized로 보고한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => envelope('20', 'SERVICE_ACCESS_DENIED_ERROR') })))
    const result = await collectFscGold()
    expect(result).toEqual({ status: 'unauthorized', provider: 'fsc-gold', code: '20 SERVICE_ACCESS_DENIED_ERROR' })
  })

  it('조회 기간 내내 자료가 없으면(resultCode 00 + 빈 items) not_released를 반환한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => envelope('00', 'NORMAL SERVICE.', '') })))
    const result = await collectFscGold()
    expect(result.status).toBe('not_released')
  })

  it('네트워크 오류는 failed로 보고한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    const result = await collectFscGold()
    expect(result.status).toBe('failed')
  })
})
