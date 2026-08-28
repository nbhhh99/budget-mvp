import { describe, expect, it } from 'vitest'
import { INDICATOR_SCHEDULE_DISCLAIMER, INDICATOR_SCHEDULE_TIMEZONE_NOTE, INDICATOR_UPDATE_SCHEDULE } from './indicatorSchedule'

function groupByTitle(title: string) {
  const group = INDICATOR_UPDATE_SCHEDULE.find((g) => g.title === title)
  if (!group) throw new Error(`missing schedule group: ${title}`)
  return group
}

describe('INDICATOR_UPDATE_SCHEDULE', () => {
  it('has exactly the 5 groups the schedule notice defines', () => {
    expect(INDICATOR_UPDATE_SCHEDULE.map((g) => g.title)).toEqual([
      '국내 시장',
      '국내 기름값',
      '해외시장·국제유가',
      '가상자산',
      '주요 거시경제 지표',
    ])
  })

  it('국내 시장 은 평일 오후 4시 30분에 환율·KOSPI·KOSDAQ·KRX 국내 금을 갱신한다', () => {
    const group = groupByTitle('국내 시장')
    expect(group.time).toBe('평일 오후 4시 30분')
    expect(group.targets).toBe('환율 · KOSPI · KOSDAQ · KRX 국내 금')
  })

  it('국내 기름값 은 매일 오전 7시에 휘발유·경유를 갱신한다', () => {
    const group = groupByTitle('국내 기름값')
    expect(group.time).toBe('매일 오전 7시')
    expect(group.targets).toBe('전국 평균 휘발유 · 전국 평균 경유')
  })

  it('해외시장·국제유가 는 평일 오전 9시에 WTI·Brent만 갱신한다(S&P 500·NASDAQ·국제 금 제외)', () => {
    const group = groupByTitle('해외시장·국제유가')
    expect(group.time).toBe('평일 오전 9시')
    expect(group.targets).toBe('WTI · Brent')
  })

  it('가상자산 은 화면 진입 시 확인하며 15분 캐시 안내 문구를 포함한다', () => {
    const group = groupByTitle('가상자산')
    expect(group.time).toBe('화면에 들어올 때 확인')
    expect(group.targets).toBe('비트코인 · 이더리움')
    expect(group.note).toBe('최근 조회 후 15분 동안은 저장된 시세를 사용해요.')
  })

  it('주요 거시경제 지표 는 검수된 재무 브리핑 갱신 시 반영된다고 안내한다', () => {
    const group = groupByTitle('주요 거시경제 지표')
    expect(group.time).toBe('검수된 재무 브리핑이 업데이트될 때 반영')
    expect(group.targets).toContain('기준금리')
  })

  it('미연동 상태인 S&P 500·NASDAQ Composite·국제 금을 정상 업데이트 대상으로 올리지 않는다', () => {
    const text = INDICATOR_UPDATE_SCHEDULE.map((g) => `${g.title} ${g.targets}`).join(' ')
    expect(text).not.toContain('S&P')
    expect(text).not.toContain('NASDAQ')
    expect(text).not.toContain('국제 금')
  })
})

describe('INDICATOR_SCHEDULE_DISCLAIMER / INDICATOR_SCHEDULE_TIMEZONE_NOTE', () => {
  it('한국시간 기준임을 명시한다', () => {
    expect(INDICATOR_SCHEDULE_TIMEZONE_NOTE).toContain('한국시간')
  })

  it('"실시간"이라는 표현을 쓰지 않는다', () => {
    expect(INDICATOR_SCHEDULE_DISCLAIMER).not.toContain('실시간')
  })

  it('수동 새로고침이 가능하다는 문구를 넣지 않는다', () => {
    expect(INDICATOR_SCHEDULE_DISCLAIMER).not.toContain('새로고침')
  })

  it('API 성공을 단정하지 않고, 예정 시각과 실제 기준일을 구분해서 표현한다', () => {
    expect(INDICATOR_SCHEDULE_DISCLAIMER).toContain('예정 시각')
    expect(INDICATOR_SCHEDULE_DISCLAIMER).toContain('기준일')
    expect(INDICATOR_SCHEDULE_DISCLAIMER).not.toMatch(/성공|완료했|반영됐/)
  })
})
