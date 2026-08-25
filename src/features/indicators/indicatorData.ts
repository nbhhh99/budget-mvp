import { sanitizeIndicatorHistory, sanitizeIndicatorSnapshot } from '../../domain'
import type { IndicatorHistoryPoint, IndicatorSnapshot } from '../../types/models'

// briefingData.ts와 동일한 원칙 — 이 앱과 같은 출처(GitHub Pages)의 정적 JSON만
// 읽는다. 요청에는 지표 id 외에 아무 값도 실리지 않아, 사용자의 거래·자산 데이터가
// 섞여 들어갈 방법이 없다.
function dataUrl(path: string): string {
  return `${import.meta.env.BASE_URL}data/indicators/${path}`
}

export interface LoadedIndicatorSnapshot {
  snapshot: IndicatorSnapshot | null
  skippedCount: number
}

export async function fetchIndicatorSnapshot(): Promise<LoadedIndicatorSnapshot> {
  try {
    const res = await fetch(dataUrl('latest.json'))
    if (!res.ok) return { snapshot: null, skippedCount: 0 }
    const json: unknown = await res.json()
    const { snapshot, skippedCount } = sanitizeIndicatorSnapshot(json)
    return { snapshot, skippedCount }
  } catch {
    return { snapshot: null, skippedCount: 0 }
  }
}

export async function fetchIndicatorHistory(id: string): Promise<IndicatorHistoryPoint[]> {
  try {
    const res = await fetch(dataUrl(`history/${id}.json`))
    if (!res.ok) return []
    const json: unknown = await res.json()
    return sanitizeIndicatorHistory(json)
  } catch {
    return []
  }
}
