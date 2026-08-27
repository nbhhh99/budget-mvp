// Node의 undici 기반 fetch는 네트워크 계층 오류(DNS 실패·연결 거부·TLS 오류 등)를
// 던질 때 최상위 Error.message가 그냥 "fetch failed"뿐이고, 실제 원인은
// `error.cause`에 담아 보낸다 — 이 실제 GitHub Actions 실행에서 fsc-index·fsc-gold가
// 정확히 이 증상("수집 실패 — fetch failed")으로 관측됐다. cause를 함께 풀어내면
// 다음 실행에서 원인(호스트를 못 찾음·연결 거부·TLS 오류 등)을 바로 알 수 있다.
// 호스트명은 이미 소스코드·README에 공개돼 있어 노출해도 안전하고, serviceKey나
// 전체 요청 URL은 이 함수에 전달되지 않으므로 노출될 경로가 없다.
export function describeFetchError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  const cause = err instanceof Error ? err.cause : undefined
  if (cause === undefined) return message
  const causeText = cause instanceof Error ? cause.message : String(cause)
  return `${message}: ${causeText}`
}
