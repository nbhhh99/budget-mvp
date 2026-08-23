// public/에 실제 배포되는 학습 콘텐츠 JSON이 항상 스키마를 통과하는지 지키는 회귀 테스트.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateConceptCardsFile, validateMonthlyLesson } from './learningContentSchema'
import type { ConceptCard } from '../types/models'

const here = path.dirname(fileURLToPath(import.meta.url))
const learningDir = path.resolve(here, '../../public/data/learning')

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(path.join(learningDir, relativePath), 'utf-8'))
}

describe('shipped concepts.json', () => {
  const concepts = readJson('concepts.json') as ConceptCard[]

  it('is a non-empty array that passes strict validation', () => {
    expect(Array.isArray(concepts)).toBe(true)
    expect(concepts.length).toBeGreaterThan(0)
    const result = validateConceptCardsFile(concepts)
    expect(result.errors).toEqual([])
    expect(result.valid).toBe(true)
  })

  it('has no duplicate ids', () => {
    const ids = concepts.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every relatedConceptIds entry points at another id that actually exists in the file', () => {
    const ids = new Set(concepts.map((c) => c.id))
    for (const concept of concepts) {
      for (const relatedId of concept.relatedConceptIds ?? []) {
        expect(ids.has(relatedId), `${concept.id} -> ${relatedId}`).toBe(true)
      }
    }
  })
})

describe('shipped monthly lesson index + files', () => {
  const index = readJson('monthly/index.json') as {
    entries: { yearMonth: string; status: string }[]
  }

  it('index.json has the expected shape', () => {
    expect(Array.isArray(index.entries)).toBe(true)
    expect(index.entries.length).toBeGreaterThan(0)
  })

  it('every yearMonth in index.json has a matching, schema-valid JSON file', () => {
    for (const entry of index.entries) {
      const lesson = readJson(`monthly/${entry.yearMonth}.json`)
      const result = validateMonthlyLesson(lesson)
      expect(result.errors).toEqual([])
      expect(result.valid).toBe(true)
    }
  })

  it('a reviewed entry in index.json actually has status "reviewed" in its own file', () => {
    for (const entry of index.entries) {
      if (entry.status !== 'reviewed') continue
      const lesson = readJson(`monthly/${entry.yearMonth}.json`) as { status?: string }
      expect(lesson.status).toBe('reviewed')
    }
  })
})
