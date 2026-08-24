import { sanitizeConceptCardsFile } from '../../domain'
import type { ConceptCard } from '../../types/models'

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
