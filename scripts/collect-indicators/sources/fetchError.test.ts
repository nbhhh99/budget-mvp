import { describe, expect, it } from 'vitest'
import { describeFetchError } from './fetchError'

describe('describeFetchError', () => {
  it('cause가 없으면 메시지만 반환한다', () => {
    expect(describeFetchError(new Error('network down'))).toBe('network down')
  })

  it('cause가 있으면(undici의 실제 실패 원인) 함께 풀어낸다', () => {
    // 실제 GitHub Actions 실행에서 fsc-index/fsc-gold가 "fetch failed"라는
    // 원인 없는 메시지만 남긴 문제를 재현한다 — Node fetch는 진짜 원인을
    // error.cause에 담는다.
    const cause = new Error('getaddrinfo ENOTFOUND apis.data.go.kr')
    const err = new Error('fetch failed', { cause })
    expect(describeFetchError(err)).toBe('fetch failed: getaddrinfo ENOTFOUND apis.data.go.kr')
  })

  it('cause가 Error가 아니어도 문자열로 붙인다', () => {
    const err = new Error('fetch failed', { cause: 'ECONNREFUSED' })
    expect(describeFetchError(err)).toBe('fetch failed: ECONNREFUSED')
  })

  it('Error가 아닌 값도 안전하게 처리한다', () => {
    expect(describeFetchError('그냥 문자열')).toBe('그냥 문자열')
  })
})
