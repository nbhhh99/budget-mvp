// 잠금 비밀번호는 평문으로 저장하지 않고 SHA-256 해시만 IndexedDB에 남긴다.
// 외부 서버가 없는 개인용 기기 저장이라 완벽한 보안은 아니지만, 평문 저장은 피한다.
export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
