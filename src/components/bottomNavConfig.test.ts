import { describe, expect, it } from 'vitest'
import { NAV_ITEMS, resolveActiveTab } from './bottomNavConfig'

describe('NAV_ITEMS', () => {
  it('has exactly 4 menus in the required order: 홈 → 경제지표 → 공부하기 → 설정', () => {
    expect(NAV_ITEMS).toHaveLength(4)
    expect(NAV_ITEMS.map((i) => i.to)).toEqual(['/', '/indicators', '/learn', '/settings'])
    expect(NAV_ITEMS.map((i) => i.label)).toEqual(['홈', '경제지표', '공부하기', '설정'])
  })

  it('does not include a separate 재무 브리핑 tab', () => {
    expect(NAV_ITEMS.some((i) => i.label.includes('브리핑'))).toBe(false)
  })
})

describe('resolveActiveTab', () => {
  it('activates 홈 for the root path', () => {
    expect(resolveActiveTab('/')).toBe('/')
  })

  it('activates 경제지표 for /indicators and its detail sub-route', () => {
    expect(resolveActiveTab('/indicators')).toBe('/indicators')
    expect(resolveActiveTab('/indicators/fx-usd-krw')).toBe('/indicators')
  })

  it('activates 공부하기 for /learn and its sub-routes, including 재무 브리핑', () => {
    expect(resolveActiveTab('/learn')).toBe('/learn')
    expect(resolveActiveTab('/learn/concepts')).toBe('/learn')
    expect(resolveActiveTab('/learn/monthly/history-origin-of-money')).toBe('/learn')
  })

  it('activates 공부하기 (not 홈) for 재무 브리핑 and its nested routes — it lives under /learn', () => {
    expect(resolveActiveTab('/learn/briefing')).toBe('/learn')
    expect(resolveActiveTab('/learn/briefing/2026-08')).toBe('/learn')
    expect(resolveActiveTab('/learn/briefing/indicators/fx-usd-krw')).toBe('/learn')
  })

  it('activates 설정 for settings routes', () => {
    expect(resolveActiveTab('/settings')).toBe('/settings')
    expect(resolveActiveTab('/settings/backup')).toBe('/settings')
  })

  it('falls back to 홈 for other home-nested screens (transactions/stats/assets/budgets), matching prior 3-tab behavior', () => {
    expect(resolveActiveTab('/transactions')).toBe('/')
    expect(resolveActiveTab('/transactions/new')).toBe('/')
    expect(resolveActiveTab('/stats')).toBe('/')
    expect(resolveActiveTab('/assets')).toBe('/')
    expect(resolveActiveTab('/budgets')).toBe('/')
  })
})
