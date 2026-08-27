import { describeFetchError } from './fetchError'

// 공공데이터포털(data.go.kr) REST API 공통 응답 처리 — fscIndex.ts·fscCommodity.ts가
// 함께 쓴다(둘 다 apis.data.go.kr 위에 있고, 로그인 후 다운로드한 각 API의
// "오픈API 활용자가이드" 문서에 실린 "2. OpenAPI 에러 코드정리" 표가 완전히 동일하다
// — 이 파일은 그 문서로 확인된 오류코드만 다룬다):
//   1  APPLICATION_ERROR                                어플리케이션 에러
//   10 INVALID_REQUEST_PARAMETER_ERROR                  잘못된 요청 파라메터 에러
//   12 NO_OPENAPI_SERVICE_ERROR                          해당 오픈API서비스가 없거나 폐기됨
//   20 SERVICE_ACCESS_DENIED_ERROR                       서비스 접근거부
//   22 LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR  서비스 요청제한횟수 초과
//   30 SERVICE_KEY_IS_NOT_REGISTERED_ERROR               등록되지 않은 서비스키
//   31 DEADLINE_HAS_EXPIRED_ERROR                        기한 만료된 서비스키
//   32 UNREGISTERED_IP_ERROR                             등록되지 않은 IP
//   99 UNKNOWN_ERROR                                     기타에러
// 문서에 "자료 없음"을 뜻하는 별도 코드가 없다 — 조회 조건에 해당하는 자료가 없는
// 날(휴장일 등)은 resultCode 00(정상)에 totalCount 0으로 내려온다는 뜻이라,
// items가 비어 있는 정상 응답은 findLatestDataGoKr가 "그 날짜엔 자료 없음"으로 보고
// 하루 더 거슬러 올라간다(no-data와 동일하게 취급).
// 서비스키 자체가 문제면(미등록·만료·IP제한 등) resultType=json을 요청해도 무시되고
// XML `<OpenAPI_ServiceResponse><cmmMsgHeader>...` 공통 인증 오류 봉투로 내려오는
// 것으로 널리 알려져 있다 — 이 계층은 개별 API 문서가 아니라 포털 공통 동작이지만,
// 봉투 안의 코드 체계는 위와 같은 숫자를 쓰므로 classify() 하나로 함께 판정한다.
export interface DataGoKrOk {
  kind: 'ok'
  items: Record<string, unknown>[]
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
export type DataGoKrOutcome = DataGoKrOk | DataGoKrCodedError | DataGoKrParseError

// 활용자가이드 문서로 확인된 코드만 쓴다(추측 금지) — resultCode 필드 크기가 2라
// 실제로는 "01"처럼 0으로 채워질 수 있어 숫자로 정규화해 비교한다.
const UNAUTHORIZED_CODES = new Set([20, 30, 31, 32]) // 접근거부·미등록 키·기한만료·미등록 IP
const RATE_LIMITED_CODES = new Set([22]) // 서비스 요청제한횟수 초과

function classify(code: string, msg: string): DataGoKrOutcome {
  if (code === '00') return { kind: 'ok', items: [] }
  const num = Number(code)
  if (UNAUTHORIZED_CODES.has(num)) return { kind: 'unauthorized', code, msg }
  if (RATE_LIMITED_CODES.has(num)) return { kind: 'rate-limited', code, msg }
  return { kind: 'other-error', code, msg } // 1/10/12/99 및 문서에 없는 그 외 코드
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
    return { kind: 'error', detail: describeFetchError(err) }
  }
  if (!res.ok) {
    // 실제 GitHub Actions 실행에서 fsc-index·fsc-gold 둘 다 HTTP 403을 그대로
    // 받았다 — resultCode 본문(20 SERVICE_ACCESS_DENIED_ERROR 등)까지 가지 않고
    // 게이트웨이 단계에서 거부된 것으로 보인다. 401/403은 원인이 명확하므로 generic
    // error(=failed)가 아니라 unauthorized로 분류해 화면·로그에서 구분되게 한다.
    if (res.status === 401 || res.status === 403) {
      return { kind: 'unauthorized', detail: `HTTP ${res.status}` }
    }
    return { kind: 'error', detail: `HTTP ${res.status}` }
  }

  const text = await res.text()
  const outcome = parseDataGoKrResponse(text)
  switch (outcome.kind) {
    case 'ok':
      // 활용자가이드 문서에 "자료 없음" 전용 코드가 없다 — 그 날짜에 해당하는 자료가
      // 없으면(휴장일 등) resultCode 00 그대로 totalCount 0(빈 items)으로 내려온다.
      return outcome.items.length === 0 ? { kind: 'no-data' } : { kind: 'ok', dateStr, rows: outcome.items }
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
