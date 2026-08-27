// 공공데이터포털(data.go.kr) REST API 공통 응답 처리 — fscIndex.ts·fscCommodity.ts가
// 함께 쓴다(둘 다 apis.data.go.kr 위에 있고 같은 봉투 규격을 공유한다).
//
// 이 포털의 API는 두 겹의 오류 체계를 갖는다(포털 자체의 공개 "오픈API 활용가이드"에
// 문서화된 범포털 규격이며, 로그인 후에만 열람 가능한 개별 API 전용 활용자가이드와는
// 다른 층이다 — 이 파일은 그 공개 규격만 다루고, 개별 API 고유 필드는 다루지 않는다):
//   1) 서비스키 자체가 문제면(미등록·만료·IP제한·트래픽초과 등) resultType=json을
//      요청해도 무시되고 XML `<OpenAPI_ServiceResponse><cmmMsgHeader>...` 봉투로
//      내려온다 — 널리 알려진 동작이다.
//   2) 서비스키가 정상이면 요청한 형식(JSON)으로 `response.header.resultCode`를
//      담아 내려온다. '00'은 정상, '03'은 그 조회 조건에 해당하는 자료 없음
//      (NODATA_ERROR — 휴장일이거나 아직 미발표), 그 외 코드는 포털 공통 오류코드다.
// 두 층 모두 같은 오류코드 체계(01~99)를 쓰므로 classify() 하나로 함께 판정한다.
export interface DataGoKrOk {
  kind: 'ok'
  items: Record<string, unknown>[]
}
export interface DataGoKrNoData {
  kind: 'no-data'
}
export interface DataGoKrCodedError {
  kind: 'unauthorized' | 'rate-limited' | 'other-error'
  code: string
  msg: string
}
export interface DataGoKrParseError {
  kind: 'parse-error'
  reason: string
}
export type DataGoKrOutcome = DataGoKrOk | DataGoKrNoData | DataGoKrCodedError | DataGoKrParseError

const UNAUTHORIZED_CODES = new Set(['20', '30', '31', '32', '33'])
const RATE_LIMITED_CODES = new Set(['21', '22'])

function classify(code: string, msg: string): DataGoKrOutcome {
  if (code === '00') return { kind: 'ok', items: [] }
  if (code === '03') return { kind: 'no-data' }
  if (UNAUTHORIZED_CODES.has(code)) return { kind: 'unauthorized', code, msg }
  if (RATE_LIMITED_CODES.has(code)) return { kind: 'rate-limited', code, msg }
  return { kind: 'other-error', code, msg }
}

// items는 표준 규격상 `{ item: [...] }`이지만, 결과가 1건이면 `{ item: {...} }`로
// 배열이 아니라 객체로 오고, 0건이면 `items`가 빈 문자열 `""`로 오는 것으로 널리
// 알려진 규격이다 — 셋 다 안전하게 배열로 정규화한다.
function toItemArray(items: unknown): Record<string, unknown>[] {
  if (items === null || items === undefined || items === '') return []
  const wrapped = (items as { item?: unknown }).item
  if (wrapped === undefined) return []
  if (Array.isArray(wrapped)) return wrapped as Record<string, unknown>[]
  if (typeof wrapped === 'object') return [wrapped as Record<string, unknown>]
  return []
}

function parseAuthErrorXml(xml: string): DataGoKrOutcome {
  const codeMatch = xml.match(/<returnReasonCode>\s*(\d+)\s*<\/returnReasonCode>/)
  if (!codeMatch) {
    return { kind: 'parse-error', reason: '예상치 못한 XML 응답 형식입니다(알려진 공통 인증 오류 봉투가 아닙니다).' }
  }
  const code = codeMatch[1]
  const msgMatch = xml.match(/<returnAuthMsg>\s*([^<]*)<\/returnAuthMsg>/) ?? xml.match(/<errMsg>\s*([^<]*)<\/errMsg>/)
  const msg = msgMatch ? msgMatch[1].trim() : '알 수 없는 오류'
  return classify(code, msg)
}

function parseJsonEnvelope(json: unknown): DataGoKrOutcome {
  const response = (
    json as { response?: { header?: { resultCode?: unknown; resultMsg?: unknown }; body?: { items?: unknown } } }
  ).response
  const header = response?.header
  if (!header || typeof header.resultCode !== 'string') {
    return { kind: 'parse-error', reason: '응답에 response.header.resultCode가 없습니다.' }
  }
  const code = header.resultCode
  const msg = typeof header.resultMsg === 'string' ? header.resultMsg : ''
  if (code !== '00') return classify(code, msg)
  return { kind: 'ok', items: toItemArray(response?.body?.items) }
}

// 서비스키·전체 요청 URL은 이 함수에 넘기지 않는다 — 호출부가 응답 본문 텍스트만
// 전달하므로 로그에 노출될 구조적 경로 자체가 없다.
export function parseDataGoKrResponse(rawText: string): DataGoKrOutcome {
  const trimmed = rawText.trim()
  if (trimmed.startsWith('<')) return parseAuthErrorXml(trimmed)
  try {
    const json = JSON.parse(trimmed) as unknown
    return parseJsonEnvelope(json)
  } catch {
    return { kind: 'parse-error', reason: 'JSON도 알려진 XML 오류 형식도 아닌 응답입니다.' }
  }
}

export function toKstYyyymmdd(date: Date): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return `${kst.getUTCFullYear()}${String(kst.getUTCMonth() + 1).padStart(2, '0')}${String(kst.getUTCDate()).padStart(2, '0')}`
}

export function yyyymmddToIso(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
}

export type DataGoKrFetchResult =
  | { kind: 'ok'; dateStr: string; rows: Record<string, unknown>[] }
  | { kind: 'no-data' }
  | { kind: 'unauthorized'; detail: string }
  | { kind: 'rate-limited'; detail: string }
  | { kind: 'error'; detail: string }

async function fetchOnce(baseUrl: string, apiKey: string, dateStr: string): Promise<DataGoKrFetchResult> {
  const url = new URL(baseUrl)
  url.searchParams.set('serviceKey', apiKey)
  url.searchParams.set('resultType', 'json')
  url.searchParams.set('numOfRows', '100')
  url.searchParams.set('pageNo', '1')
  url.searchParams.set('basDt', dateStr)

  let res: Response
  try {
    res = await fetch(url)
  } catch (err) {
    return { kind: 'error', detail: err instanceof Error ? err.message : String(err) }
  }
  if (!res.ok) return { kind: 'error', detail: `HTTP ${res.status}` }

  const text = await res.text()
  const outcome = parseDataGoKrResponse(text)
  switch (outcome.kind) {
    case 'ok':
      return { kind: 'ok', dateStr, rows: outcome.items }
    case 'no-data':
      return { kind: 'no-data' }
    case 'unauthorized':
      return { kind: 'unauthorized', detail: `${outcome.code} ${outcome.msg}`.trim() }
    case 'rate-limited':
      return { kind: 'rate-limited', detail: `${outcome.code} ${outcome.msg}`.trim() }
    case 'other-error':
      return { kind: 'error', detail: `${outcome.code} ${outcome.msg}`.trim() }
    case 'parse-error':
      return { kind: 'error', detail: outcome.reason }
  }
}

// 영업일이 아닌 날은 그 날짜로 조회해도 자료가 없으므로(휴장·공휴일), 최근 영업일을
// 찾을 때까지 최대 10일 거슬러 올라간다(eximbankFx.ts의 findLatestAvailable과 같은
// 패턴 — 데이터가 하루 단위 배치라 값 하나를 찾는 데 열흘 이상 걸릴 일은 없다).
// 인증 오류·호출 한도 초과는 재시도해도 결과가 바뀌지 않으므로 즉시 위로 전파한다.
export async function findLatestDataGoKr(
  baseUrl: string,
  apiKey: string,
  startDate: Date,
  maxLookbackDays = 10,
): Promise<DataGoKrFetchResult> {
  for (let i = 0; i < maxLookbackDays; i++) {
    const d = new Date(startDate.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = toKstYyyymmdd(d)
    const outcome = await fetchOnce(baseUrl, apiKey, dateStr)
    if (outcome.kind !== 'no-data') return outcome
  }
  return { kind: 'no-data' }
}
