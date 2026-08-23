// 실제로 public/에 배포되는 브리핑 JSON이 항상 스키마를 통과하는지 지키는 회귀 테스트.
// §10 "출처가 없으면 빌드용 데이터 검증에서 오류로 처리한다"를 CI에서 강제한다.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateBriefingFile } from './briefingSchema'

const here = path.dirname(fileURLToPath(import.meta.url))
const briefingsDir = path.resolve(here, '../../public/data/briefings')

function readJson(fileName: string): unknown {
  return JSON.parse(readFileSync(path.join(briefingsDir, fileName), 'utf-8'))
}

describe('shipped briefing fixtures', () => {
  const index = readJson('index.json') as { entries: { yearMonth: string; status: string }[] }

  it('index.json has the expected shape', () => {
    expect(Array.isArray(index.entries)).toBe(true)
    expect(index.entries.length).toBeGreaterThan(0)
  })

  it('every yearMonth in index.json has a matching, schema-valid JSON file', () => {
    for (const entry of index.entries) {
      const file = readJson(`${entry.yearMonth}.json`)
      const result = validateBriefingFile(file)
      expect(result.errors).toEqual([])
      expect(result.valid).toBe(true)
    }
  })

  it('a reviewed entry in index.json actually has status "reviewed" in its own file (§10)', () => {
    for (const entry of index.entries) {
      if (entry.status !== 'reviewed') continue
      const file = readJson(`${entry.yearMonth}.json`) as { status?: string }
      expect(file.status).toBe('reviewed')
    }
  })
})
