import { sanitizeConceptCardsFile, sanitizeMonthlyLesson } from '../../domain'
import type { ConceptCard, MonthlyLessonIndex, MonthlyMoneyLesson } from '../../types/models'

// 브리핑과 동일한 원칙 — 같은 출처의 정적 JSON만 읽고, yearMonth 외에는 아무 값도
// 요청에 싣지 않는다. 개인화는 이 데이터를 받아온 이후 브라우저 안에서만 계산한다.
function dataUrl(path: string): string {
  return `${import.meta.env.BASE_URL}data/learning/${path}`
}

export interface LoadedConcepts {
  concepts: ConceptCard[]
  skippedCount: number
}

export async function fetchConceptCards(): Promise<LoadedConcepts> {
  try {
    const res = await fetch(dataUrl('concepts.json'))
    if (!res.ok) return { concepts: [], skippedCount: 0 }
    const json: unknown = await res.json()
    const { cards, skippedCount } = sanitizeConceptCardsFile(json)
    return { concepts: cards, skippedCount }
  } catch {
    return { concepts: [], skippedCount: 0 }
  }
}

export async function fetchMonthlyLessonIndex(): Promise<MonthlyLessonIndex | null> {
  try {
    const res = await fetch(dataUrl('monthly/index.json'))
    if (!res.ok) return null
    const json: unknown = await res.json()
    if (
      typeof json !== 'object' ||
      json === null ||
      !Array.isArray((json as { entries?: unknown }).entries)
    ) {
      return null
    }
    return json as MonthlyLessonIndex
  } catch {
    return null
  }
}

export async function fetchMonthlyLesson(yearMonth: string): Promise<MonthlyMoneyLesson | null> {
  try {
    const res = await fetch(dataUrl(`monthly/${yearMonth}.json`))
    if (!res.ok) return null
    const json: unknown = await res.json()
    return sanitizeMonthlyLesson(json)
  } catch {
    return null
  }
}
