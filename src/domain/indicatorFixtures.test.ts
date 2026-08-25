// 실제로 public/에 배포되는 경제지표 JSON이 항상 스키마를 지키는지 확인하는 회귀
// 테스트. 이 테스트가 곧 GitHub Actions collect-indicators.yml의 커밋 게이트다 —
// 여기서 실패하면 워크플로가 main에 아무것도 커밋하지 않는다.
//
// public/data/indicators/는 scripts/collect-indicators가 관리하는 산출물이라 첫
// 스케줄 실행 전에는 비어있거나 최소 상태일 수 있다 — 그래도 로컬 npm test가
// 깨지지 않도록 폴더가 없으면 관대하게 통과시킨다.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateIndicatorSnapshot } from './indicatorSchema'

const here = path.dirname(fileURLToPath(import.meta.url))
const indicatorsDir = path.resolve(here, '../../public/data/indicators')
const latestPath = path.join(indicatorsDir, 'latest.json')
const historyDir = path.join(indicatorsDir, 'history')

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf-8'))
}

describe('shipped indicator fixtures', () => {
  if (!existsSync(latestPath)) {
    it('latest.json does not exist yet (before the first scheduled collection) — nothing to validate', () => {
      expect(true).toBe(true)
    })
    return
  }

  const snapshot = readJson(latestPath)

  it('latest.json passes strict schema validation', () => {
    const result = validateIndicatorSnapshot(snapshot)
    expect(result.errors).toEqual([])
    expect(result.valid).toBe(true)
  })

  it('has no duplicate indicator ids', () => {
    const ids = (snapshot as { indicators: { id: string }[] }).indicators.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every history/*.json file (if any) is an array of well-formed {referenceDate, value} points capped at 30', () => {
    if (!existsSync(historyDir)) return
    const files = readdirSync(historyDir).filter((f) => f.endsWith('.json'))
    for (const file of files) {
      const points = readJson(path.join(historyDir, file)) as unknown[]
      expect(Array.isArray(points), file).toBe(true)
      expect(points.length, file).toBeLessThanOrEqual(30)
      for (const point of points as { referenceDate?: unknown; value?: unknown }[]) {
        expect(typeof point.referenceDate, file).toBe('string')
        expect(/^\d{4}-\d{2}-\d{2}$/.test(point.referenceDate as string), file).toBe(true)
        expect(typeof point.value, file).toBe('number')
      }
    }
  })

  it('history files are sorted by referenceDate ascending with no duplicate dates', () => {
    if (!existsSync(historyDir)) return
    const files = readdirSync(historyDir).filter((f) => f.endsWith('.json'))
    for (const file of files) {
      const points = readJson(path.join(historyDir, file)) as { referenceDate: string }[]
      const dates = points.map((p) => p.referenceDate)
      expect(new Set(dates).size, file).toBe(dates.length)
      expect([...dates].sort(), file).toEqual(dates)
    }
  })
})
