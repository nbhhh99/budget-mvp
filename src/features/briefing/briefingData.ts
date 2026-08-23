import { sanitizeBriefingFile } from '../../domain'
import type { BriefingIndex, FinancialBriefing } from '../../types/models'

// 재무 브리핑은 항상 이 앱과 같은 출처(GitHub Pages)의 정적 JSON만 읽는다.
// yearMonth 외에는 아무 값도 요청에 실리지 않으므로, 사용자의 거래·자산 데이터가
// 이 요청에 섞여 들어갈 방법이 없다 — 개인화는 이 데이터를 받아온 "이후"
// 브라우저 안에서만 계산한다(§4, §8).
function dataUrl(path: string): string {
  return `${import.meta.env.BASE_URL}data/briefings/${path}`
}

export async function fetchBriefingIndex(): Promise<BriefingIndex | null> {
  try {
    const res = await fetch(dataUrl('index.json'))
    if (!res.ok) return null
    const json: unknown = await res.json()
    if (
      typeof json !== 'object' ||
      json === null ||
      !Array.isArray((json as { entries?: unknown }).entries)
    ) {
      return null
    }
    return json as BriefingIndex
  } catch {
    return null
  }
}

export interface LoadedBriefingMonth {
  briefing: FinancialBriefing | null
  skippedItemCount: number
}

export async function fetchBriefingMonth(yearMonth: string): Promise<LoadedBriefingMonth> {
  try {
    const res = await fetch(dataUrl(`${yearMonth}.json`))
    if (!res.ok) return { briefing: null, skippedItemCount: 0 }
    const json: unknown = await res.json()
    const { briefing, skippedItemCount } = sanitizeBriefingFile(json)
    return { briefing, skippedItemCount }
  } catch {
    return { briefing: null, skippedItemCount: 0 }
  }
}
