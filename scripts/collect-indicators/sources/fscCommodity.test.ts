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

  it('likeSrtnCd=4020000을 요청 필터로 실어 보낸다(종목명 정확 일치 대신 코드 포함 검색)', async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, text: async () => okEnvelope([{ basDt: '20260825', srtnCd: '04020000', clpr: '92000' }]) }))
    vi.stubGlobal('fetch', fetchSpy)
    await collectFscGold()
    const requestedUrl = new URL(String(fetchSpy.mock.calls[0][0]))
    expect(requestedUrl.searchParams.get('likeSrtnCd')).toBe('4020000')
    expect(requestedUrl.searchParams.has('itmsNm')).toBe(false)
  })

  it('srtnCd=04020000인 행을 골라 clpr을 그대로 원/g으로 쓴다(1Kg은 거래단위 표기일 뿐 가격단위가 아님)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () =>
          okEnvelope([
            { basDt: '20260825', srtnCd: '04020001', itmsNm: '금 99.99_100g', clpr: '9200', vs: '15', fltRt: '0.16' },
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

  it('srtnCd가 공백을 포함하거나 숫자 타입으로 와도(문자열 변환·trim) 정확히 매칭한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, text: async () => okEnvelope([{ basDt: '20260825', srtnCd: ' 04020000 ', clpr: '92000' }]) })),
    )
    const result = await collectFscGold()
    expect(result.status).toBe('success')
  })

  it('종목명이 활용가이드 예시와 달라도 srtnCd(04020000)가 정확히 일치하면 선택한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => okEnvelope([{ basDt: '20260825', srtnCd: '04020000', itmsNm: '금(순도99.99) 1키로', clpr: '92000' }]),
      })),
    )
    const result = await collectFscGold()
    expect(result.status).toBe('success')
    if (result.status !== 'success') throw new Error('unreachable')
    expect(result.indicators[0].value).toBe(92000)
  })

  it('srtnCd 정확 일치가 없으면 itmsNm에 금·99.99·1kg이 모두 포함된 행을 보조 후보로 쓰고, 그 사실을 로그에 남긴다', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => okEnvelope([{ basDt: '20260825', srtnCd: '04020077', itmsNm: '금 99.99_1kg(신규코드)', clpr: '92000' }]),
      })),
    )
    const result = await collectFscGold()
    expect(result.status).toBe('success')
    if (result.status !== 'success') throw new Error('unreachable')
    expect(result.indicators[0].value).toBe(92000)
    expect(warnSpy.mock.calls.some((c) => String(c[0]).includes('보조 후보') && String(c[0]).includes('04020077'))).toBe(true)
    warnSpy.mockRestore()
  })

  it('100g 등 다른 중량의 금 종목은 제외한다(srtnCd 불일치 + itmsNm에 1kg 표기 없음)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => okEnvelope([{ basDt: '20260825', srtnCd: '04020001', itmsNm: '금 99.99_100g', clpr: '9200' }]),
      })),
    )
    const result = await collectFscGold()
    expect(result.status).toBe('invalid_response')
    if (result.status !== 'invalid_response') throw new Error('unreachable')
    expect(result.reason).toContain('100g')
  })

  it('국제 금처럼 "금"·"99.99"만 있고 1kg 표기가 없는 종목도 제외한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => okEnvelope([{ basDt: '20260825', srtnCd: '99999999', itmsNm: '국제 금 99.99', clpr: '92000' }]),
      })),
    )
    const result = await collectFscGold()
    expect(result.status).toBe('invalid_response')
  })

  it('금 1kg 종목임을 확인하지 못하면 실제 종목 목록과 함께 invalid_response를 반환한다', async () => {
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

  it('종가(clpr)가 숫자로 해석되지 않으면 invalid_response를 반환한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => okEnvelope([{ basDt: '20260825', srtnCd: '04020000', clpr: '알수없음' }]),
      })),
    )
    const result = await collectFscGold()
    expect(result.status).toBe('invalid_response')
    if (result.status !== 'invalid_response') throw new Error('unreachable')
    expect(result.reason).toContain('clpr')
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

  it('자료를 못 찾으면 진단용으로 필터 없이 최근 10일을 다시 조회해 기준일·itmsNm·srtnCd를 로그에 남긴다', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    let call = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        call += 1
        // likeSrtnCd 필터가 걸린 최대 10번의 조회는 전부 빈 응답, 그다음 필터
        // 없는 진단용 조회(최대 10일)의 첫 시도에서 실제 종목명이 담긴 응답을 준다.
        if (call <= 10) return { ok: true, text: async () => envelope('00', 'NORMAL SERVICE.', '') }
        return { ok: true, text: async () => okEnvelope([{ basDt: '20260827', srtnCd: '04020099', itmsNm: '미니금 99.99_100g' }]) }
      }),
    )
    const result = await collectFscGold()
    expect(result.status).toBe('not_released')
    const diagnosticLine = warnSpy.mock.calls.map((c) => String(c[0])).find((line) => line.includes('미니금 99.99_100g'))
    expect(diagnosticLine).toBeDefined()
    expect(diagnosticLine).toContain('기준일=')
    expect(diagnosticLine).toContain('srtnCd=04020099')
    warnSpy.mockRestore()
  })

  it('진단 조회도 10일 내내 자료가 없으면 조용히 not_released만 반환한다(추가 오류를 만들지 않음)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => envelope('00', 'NORMAL SERVICE.', '') })))
    const fetchSpy = vi.fn(async () => ({ ok: true, text: async () => envelope('00', 'NORMAL SERVICE.', '') }))
    vi.stubGlobal('fetch', fetchSpy)
    const result = await collectFscGold()
    expect(result.status).toBe('not_released')
    // 본 조회 최대 10회 + 진단 조회 최대 10회 = 20회를 넘기지 않는다.
    expect(fetchSpy.mock.calls.length).toBeLessThanOrEqual(20)
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
