import { afterEach, describe, expect, it, vi } from 'vitest'
import { findLatestDataGoKr, parseDataGoKrResponse, toKstYyyymmdd, yyyymmddToIso } from './dataGoKrEnvelope'

function jsonEnvelope(resultCode: string, resultMsg: string, items?: unknown): string {
  return JSON.stringify({
    response: {
      header: { resultCode, resultMsg },
      body: items === undefined ? undefined : { items },
    },
  })
}

describe('parseDataGoKrResponse', () => {
  it('resultCode 00이면 items를 배열로 정규화해 ok를 반환한다(단일 객체 케이스)', () => {
    const outcome = parseDataGoKrResponse(jsonEnvelope('00', 'NORMAL SERVICE.', { item: { basDt: '20260825' } }))
    expect(outcome).toEqual({ kind: 'ok', items: [{ basDt: '20260825' }] })
  })

  it('resultCode 00이고 item이 배열이면 그대로 반환한다', () => {
    const outcome = parseDataGoKrResponse(jsonEnvelope('00', 'NORMAL SERVICE.', { item: [{ a: 1 }, { a: 2 }] }))
    expect(outcome).toEqual({ kind: 'ok', items: [{ a: 1 }, { a: 2 }] })
  })

  it('items가 빈 문자열이면 빈 배열로 처리한다(0건 조회의 표준 표기)', () => {
    const outcome = parseDataGoKrResponse(jsonEnvelope('00', 'NORMAL SERVICE.', ''))
    expect(outcome).toEqual({ kind: 'ok', items: [] })
  })

  it('resultCode 03은 no-data(그 조건에 해당하는 자료 없음)로 구분한다', () => {
    expect(parseDataGoKrResponse(jsonEnvelope('03', 'NODATA_ERROR'))).toEqual({ kind: 'no-data' })
  })

  it('resultCode 30(SERVICE_KEY_IS_NOT_REGISTERED_ERROR)은 unauthorized로 분류한다', () => {
    const outcome = parseDataGoKrResponse(jsonEnvelope('30', 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR'))
    expect(outcome).toEqual({ kind: 'unauthorized', code: '30', msg: 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR' })
  })

  it('resultCode 22(호출 한도 초과)는 rate-limited로 분류한다', () => {
    const outcome = parseDataGoKrResponse(jsonEnvelope('22', 'LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR'))
    expect(outcome).toEqual({ kind: 'rate-limited', code: '22', msg: 'LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR' })
  })

  it('알 수 없는 코드는 other-error로 분류한다(데이터 없음으로 뭉개지 않는다)', () => {
    const outcome = parseDataGoKrResponse(jsonEnvelope('99', 'UNKNOWN_ERROR'))
    expect(outcome).toEqual({ kind: 'other-error', code: '99', msg: 'UNKNOWN_ERROR' })
  })

  it('서비스키 오류는 resultType=json 요청과 무관하게 XML 공통 인증 봉투로 온다', () => {
    const xml =
      '<OpenAPI_ServiceResponse><cmmMsgHeader><returnReasonCode>30</returnReasonCode>' +
      '<returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg></cmmMsgHeader></OpenAPI_ServiceResponse>'
    expect(parseDataGoKrResponse(xml)).toEqual({ kind: 'unauthorized', code: '30', msg: 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR' })
  })

  it('알려진 인증 오류 봉투가 아닌 XML은 parse-error로 보고한다(추측하지 않는다)', () => {
    const outcome = parseDataGoKrResponse('<html><body>알 수 없는 오류 페이지</body></html>')
    expect(outcome.kind).toBe('parse-error')
  })

  it('resultCode가 없는 JSON은 parse-error로 보고한다', () => {
    expect(parseDataGoKrResponse('{"foo":"bar"}').kind).toBe('parse-error')
  })

  it('JSON도 XML도 아닌 응답은 parse-error로 보고한다', () => {
    expect(parseDataGoKrResponse('not json at all').kind).toBe('parse-error')
  })
})

describe('toKstYyyymmdd / yyyymmddToIso', () => {
  it('KST 기준 YYYYMMDD 문자열을 만들고 ISO 형식으로 되돌릴 수 있다', () => {
    const dateStr = toKstYyyymmdd(new Date('2026-08-25T20:00:00Z')) // KST로는 08-26 05:00
    expect(dateStr).toBe('20260826')
    expect(yyyymmddToIso(dateStr)).toBe('2026-08-26')
  })
})

describe('findLatestDataGoKr', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('오늘 자료가 없으면(no-data) 하루씩 거슬러 올라가 최신 영업일을 찾는다', async () => {
    let call = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        call += 1
        const resultCode = call < 3 ? '03' : '00'
        return { ok: true, status: 200, text: async () => jsonEnvelope(resultCode, '', call < 3 ? undefined : { item: { basDt: 'x' } }) }
      }),
    )
    const result = await findLatestDataGoKr('https://example.com', 'key', new Date('2026-08-26T00:00:00Z'))
    expect(result.kind).toBe('ok')
    expect(call).toBe(3)
  })

  it('인증 오류는 재시도하지 않고 즉시 전파한다', async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, status: 200, text: async () => jsonEnvelope('30', 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR') }))
    vi.stubGlobal('fetch', fetchSpy)
    const result = await findLatestDataGoKr('https://example.com', 'key', new Date())
    expect(result).toEqual({ kind: 'unauthorized', detail: '30 SERVICE_KEY_IS_NOT_REGISTERED_ERROR' })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('최대 조회 기간 안에 자료를 찾지 못하면 no-data를 반환한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, text: async () => jsonEnvelope('03', 'NODATA_ERROR') })))
    const result = await findLatestDataGoKr('https://example.com', 'key', new Date(), 3)
    expect(result).toEqual({ kind: 'no-data' })
  })

  it('HTTP 오류는 error로 보고한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })))
    const result = await findLatestDataGoKr('https://example.com', 'key', new Date())
    expect(result).toEqual({ kind: 'error', detail: 'HTTP 500' })
  })
})
