import { afterEach, describe, expect, it, vi } from 'vitest'
import { findLatestDataGoKr, normalizeServiceKey, parseDataGoKrResponse, toKstYyyymmdd, yyyymmddToIso } from './dataGoKrEnvelope'

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

  it('resultCode 30(SERVICE_KEY_IS_NOT_REGISTERED_ERROR)은 unauthorized로 분류한다', () => {
    const outcome = parseDataGoKrResponse(jsonEnvelope('30', 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR'))
    expect(outcome).toEqual({ kind: 'unauthorized', code: '30', msg: 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR' })
  })

  it('resultCode 22(호출 한도 초과)는 rate-limited로 분류한다', () => {
    const outcome = parseDataGoKrResponse(jsonEnvelope('22', 'LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR'))
    expect(outcome).toEqual({ kind: 'rate-limited', code: '22', msg: 'LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR' })
  })

  it('활용자가이드에 있는 그 외 코드(1/10/12/99)는 other-error로 분류한다(빈 응답으로 뭉개지 않는다)', () => {
    const outcome = parseDataGoKrResponse(jsonEnvelope('99', 'UNKNOWN_ERROR'))
    expect(outcome).toEqual({ kind: 'other-error', code: '99', msg: 'UNKNOWN_ERROR' })
  })

  it('resultCode가 0으로 패딩되지 않아도(예: "1") 숫자로 정규화해 판정한다', () => {
    const outcome = parseDataGoKrResponse(jsonEnvelope('1', 'APPLICATION_ERROR'))
    expect(outcome).toEqual({ kind: 'other-error', code: '1', msg: 'APPLICATION_ERROR' })
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

describe('normalizeServiceKey', () => {
  it('앞뒤 공백을 지운다', () => {
    expect(normalizeServiceKey('  abc123==  ')).toBe('abc123==')
  })

  it('percent-encoding이 있는 키는 한 번만 decodeURIComponent를 적용한다', () => {
    // 원문 키 'ab+c/d=' 를 포털이 URL-인코딩해 배포한 형태를 가정한다.
    const raw = 'ab%2Bc%2Fd%3D'
    expect(normalizeServiceKey(raw)).toBe('ab+c/d=')
  })

  it('이미 디코딩된 키(percent 패턴이 없음)는 그대로 쓴다', () => {
    const raw = 'ab+c/d='
    expect(normalizeServiceKey(raw)).toBe('ab+c/d=')
  })

  it('malformed percent-encoding이면 디코딩을 포기하고 trim된 원본을 그대로 쓴다', () => {
    const raw = 'abc%1' // 잘린 percent-encoding, decodeURIComponent가 던진다
    expect(normalizeServiceKey(raw)).toBe('abc%1')
  })

  it('이중 인코딩을 정확히 한 번만 되돌린다(재인코딩 시 원래 인코딩과 동일해짐)', () => {
    const raw = 'ab%2Bc%2Fd%3D'
    const normalized = normalizeServiceKey(raw)
    // URLSearchParams가 넘겨받은 값을 다시 인코딩하면(percent-encoding) 원래
    // 포털이 준 인코딩 형태와 같아야 한다 — 즉 이중 인코딩(%25로 시작하는 값)이
    // 생기지 않는다는 뜻이다.
    const reEncoded = new URLSearchParams({ serviceKey: normalized }).toString()
    expect(reEncoded).not.toContain('%25')
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

  it('요청에는 정규화된(디코딩된) 키를 실어 보낸다(이중 인코딩 방지)', async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, status: 200, text: async () => jsonEnvelope('00', 'NORMAL SERVICE.', '') }))
    vi.stubGlobal('fetch', fetchSpy)
    await findLatestDataGoKr('https://example.com', 'ab%2Bc%2Fd%3D', new Date(), 1)
    const requestedUrl = new URL(String(fetchSpy.mock.calls[0][0]))
    expect(requestedUrl.searchParams.get('serviceKey')).toBe('ab+c/d=')
  })

  it('그 날짜에 자료가 없으면(resultCode 00 + 빈 items) 하루씩 거슬러 올라가 최신 영업일을 찾는다', async () => {
    // 활용자가이드에 "자료 없음" 전용 코드가 없다 — 휴장일 등은 정상(00) + 빈 items로 온다.
    let call = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        call += 1
        return { ok: true, status: 200, text: async () => jsonEnvelope('00', 'NORMAL SERVICE.', call < 3 ? '' : { item: { basDt: 'x' } }) }
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
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, text: async () => jsonEnvelope('00', 'NORMAL SERVICE.', '') })))
    const result = await findLatestDataGoKr('https://example.com', 'key', new Date(), 3)
    expect(result).toEqual({ kind: 'no-data' })
  })

  it('그 외 HTTP 오류는 error로 보고한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })))
    const result = await findLatestDataGoKr('https://example.com', 'key', new Date())
    expect(result).toEqual({ kind: 'error', detail: 'HTTP 500' })
  })

  it('HTTP 401/403은 (resultCode 본문까지 가지 않아도) unauthorized로 보고한다', async () => {
    // 실제 GitHub Actions 실행에서 fsc-index/fsc-gold가 JSON 오류 본문 대신
    // 게이트웨이 단계의 HTTP 403을 그대로 받은 것을 반영한다.
    const fetchSpy = vi.fn(async () => ({ ok: false, status: 403 }))
    vi.stubGlobal('fetch', fetchSpy)
    const result = await findLatestDataGoKr('https://example.com', 'key', new Date())
    expect(result).toEqual({ kind: 'unauthorized', detail: 'HTTP 403' })
    expect(fetchSpy).toHaveBeenCalledTimes(1) // 재시도하지 않고 즉시 전파
  })

  it('fetch 자체가 네트워크 계층에서 계속 실패하면(재시도 소진) 원인(cause)까지 함께 보고한다', async () => {
    const fetchSpy = vi.fn(async () => {
      throw new Error('fetch failed', { cause: new Error('getaddrinfo ENOTFOUND apis.data.go.kr') })
    })
    vi.stubGlobal('fetch', fetchSpy)
    // delayMs: 0으로 재시도 사이 대기 없이 빠르게 테스트한다 — 재시도 자체는
    // fetchWithRetry.test.ts에서 이미 검증했으므로, 여기서는 findLatestDataGoKr가
    // 그 결과를 error로 정확히 옮기는지만 확인한다.
    const result = await findLatestDataGoKr('https://example.com', 'key', new Date(), 10, undefined, { attempts: 2, delayMs: 0 })
    expect(result).toEqual({ kind: 'error', detail: 'fetch failed: getaddrinfo ENOTFOUND apis.data.go.kr' })
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('네트워크 계층 오류가 일시적이면(재시도 중 성공) 정상 응답으로 복구된다', async () => {
    // 실제 GitHub Actions 실행에서 관측된 증상을 재현한다: 같은 날짜에 대한 호출이
    // 처음엔 Connect Timeout Error로 실패했다가 재시도에서 성공한다.
    let call = 0
    const fetchSpy = vi.fn(async () => {
      call += 1
      if (call === 1) throw new Error('fetch failed', { cause: new Error('Connect Timeout Error') })
      return { ok: true, status: 200, text: async () => jsonEnvelope('00', 'NORMAL SERVICE.', { item: { basDt: '20260828' } }) }
    })
    vi.stubGlobal('fetch', fetchSpy)
    const result = await findLatestDataGoKr('https://example.com', 'key', new Date(), 10, undefined, { attempts: 3, delayMs: 0 })
    expect(result).toEqual({ kind: 'ok', dateStr: expect.any(String), rows: [{ basDt: '20260828' }] })
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })
})
