// 실제 GitHub Actions 실행에서 apis.data.go.kr(공공데이터포털)에 대한 fetch() 자체가
// 네트워크 계층에서 실패하는 사례가 관측됐다:
//   [fsc-index] KOSPI 수집 실패 — fetch failed: Connect Timeout Error
//     (attempted address: apis.data.go.kr:443, timeout: 10000ms)
// 같은 GitHub Actions 실행 안에서 다른 호출(예: eximbank-fx)은 정상 응답했고, 하루
// 전 같은 도메인 호출도 성공했다 — 특정 순간의 일시적 혼잡/지연으로 보이며, 재시도로
// 회복될 가능성이 있다(반대로 인증 오류·호출 한도 초과처럼 재시도해도 결과가 바뀌지
// 않는 오류는 이 함수가 다루지 않는다 — 그건 fetch()가 정상적으로 응답을 반환한
// 경우라 여기 도달하지 않는다).
//
// 재시도 대상은 오직 fetch() 자체가 던지는 예외(DNS 실패·연결 거부·TLS 오류·연결
// 타임아웃 등 네트워크 계층 오류)뿐이다 — HTTP 상태 코드(401/403/5xx 등)는 fetch()가
// 정상적으로 Response를 반환한 경우이므로 이 함수의 재시도 루프에 걸리지 않는다
// (호출부가 그 Response를 보고 재시도할지 여부를 별도로 판단한다).
export interface FetchWithRetryOptions {
  /** 총 시도 횟수(최초 시도 포함). 기본 3(최초 1회 + 재시도 2회). */
  attempts?: number
  /** 재시도 사이 대기 시간(ms). 기본 2000. */
  delayMs?: number
}

const DEFAULT_ATTEMPTS = 3
const DEFAULT_DELAY_MS = 2000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchWithRetry(
  input: string | URL,
  init?: RequestInit,
  options?: FetchWithRetryOptions,
): Promise<Response> {
  const attempts = options?.attempts ?? DEFAULT_ATTEMPTS
  const delayMs = options?.delayMs ?? DEFAULT_DELAY_MS

  let lastErr: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fetch(input, init)
    } catch (err) {
      lastErr = err
      if (attempt < attempts) {
        // 키·전체 요청 URL은 여기서 로그에 남기지 않는다 — err(및 그 cause)는
        // 네트워크 계층 오류 메시지만 담고 있어 안전하다(fetchError.ts 참고).
        const message = err instanceof Error ? err.message : String(err)
        console.warn(`[fetchWithRetry] 네트워크 계층 오류로 재시도합니다 (${attempt}/${attempts}) — ${message}`)
        await sleep(delayMs)
      }
    }
  }
  throw lastErr
}
