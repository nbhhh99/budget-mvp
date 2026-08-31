import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchWithRetry } from './fetchWithRetry'

describe('fetchWithRetry', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('첫 시도에서 성공하면 재시도 없이 그 응답을 반환한다', async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, status: 200 }) as Response)
    vi.stubGlobal('fetch', fetchSpy)
    const res = await fetchWithRetry('https://example.com', undefined, { attempts: 3, delayMs: 0 })
    expect(res.status).toBe(200)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('fetch()가 네트워크 계층에서 예외를 던지면(연결 실패 등) 재시도한 뒤 성공 시 그 응답을 반환한다', async () => {
    let call = 0
    const fetchSpy = vi.fn(async () => {
      call += 1
      if (call < 3) throw new Error('fetch failed', { cause: new Error('Connect Timeout Error') })
      return { ok: true, status: 200 } as Response
    })
    vi.stubGlobal('fetch', fetchSpy)
    const res = await fetchWithRetry('https://example.com', undefined, { attempts: 3, delayMs: 0 })
    expect(res.status).toBe(200)
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })

  it('지정한 시도 횟수를 모두 소진하면 마지막 오류를 그대로 던진다', async () => {
    const err = new Error('fetch failed', { cause: new Error('Connect Timeout Error') })
    const fetchSpy = vi.fn(async () => {
      throw err
    })
    vi.stubGlobal('fetch', fetchSpy)
    await expect(fetchWithRetry('https://example.com', undefined, { attempts: 3, delayMs: 0 })).rejects.toBe(err)
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })

  it('attempts를 지정하지 않으면 기본 3회(최초 1회 + 재시도 2회)를 시도한다', async () => {
    const fetchSpy = vi.fn(async () => {
      throw new Error('network down')
    })
    vi.stubGlobal('fetch', fetchSpy)
    await expect(fetchWithRetry('https://example.com', undefined, { delayMs: 0 })).rejects.toThrow('network down')
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })

  it('HTTP 오류 응답(fetch()가 예외 없이 반환한 Response)은 재시도하지 않는다 — 재시도는 fetch() 자체의 예외만 대상으로 한다', async () => {
    const fetchSpy = vi.fn(async () => ({ ok: false, status: 500 }) as Response)
    vi.stubGlobal('fetch', fetchSpy)
    const res = await fetchWithRetry('https://example.com', undefined, { attempts: 3, delayMs: 0 })
    expect(res.status).toBe(500)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })
})
