import type { BriefingItem } from '../../src/types/models'

// 두 항목의 "내용"이 같은지 비교한다 — 같은 자료를 다른 순서의 키로 다시 만들어도
// 같다고 판정하도록 키를 정렬해서 비교한다(§10 "동일 공식 자료의 내용 변경 감지").
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>).sort()
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export function itemsEqual(a: BriefingItem, b: BriefingItem): boolean {
  return stableStringify(a) === stableStringify(b)
}

// id가 같으면 같은 자료로 본다. id는 다르지만 첫 출처 URL + 기준일이 같으면 같은
// 공식 자료를 다른 이름으로 실어온 것으로 보고 역시 같은 자료로 취급한다(§16
// "ID·출처 URL·발표일 기준 중복 제거").
function secondaryKey(item: BriefingItem): string | null {
  const url = item.sources[0]?.url
  return url ? `${url}::${item.referenceDate}` : null
}

export interface MergeResult {
  mergedItems: BriefingItem[]
  newItems: BriefingItem[]
  changedItems: BriefingItem[]
}

// 기존 항목(주로 검수를 마친 항목)은 그대로 둔 채, 새로 수집된 항목 중 정말 새것만
// 추가하고, 같은 자료인데 내용이 바뀐 것만 교체한다. 사람이 검수한 적 없는 다른
// 항목을 자동으로 지우거나 덮어쓰는 일은 없다(§10).
export function mergeItems(existingItems: BriefingItem[], collectedItems: BriefingItem[]): MergeResult {
  const byId = new Map(existingItems.map((item) => [item.id, item]))
  const bySecondary = new Map<string, BriefingItem>()
  for (const item of existingItems) {
    const key = secondaryKey(item)
    if (key) bySecondary.set(key, item)
  }

  const newItems: BriefingItem[] = []
  const changedItems: BriefingItem[] = []
  const seenInBatch = new Set<string>()

  for (const collected of collectedItems) {
    if (seenInBatch.has(collected.id)) continue // 이번 수집 배치 내부 중복
    seenInBatch.add(collected.id)

    const secondary = secondaryKey(collected)
    const existingMatch = byId.get(collected.id) ?? (secondary ? bySecondary.get(secondary) : undefined)

    if (!existingMatch) {
      newItems.push(collected)
      byId.set(collected.id, collected)
      if (secondary) bySecondary.set(secondary, collected)
      continue
    }

    // id는 식별자일 뿐 내용이 아니다 — 2차 키(출처 URL+기준일)로 매칭됐을 때는
    // 두 소스가 같은 자료에 서로 다른 id를 붙였을 뿐일 수 있으므로, id 차이만으로
    // "내용이 바뀌었다"고 오판하지 않도록 비교 전에 id를 맞춰준다.
    const normalizedCollected = { ...collected, id: existingMatch.id }
    if (!itemsEqual(existingMatch, normalizedCollected)) {
      changedItems.push(normalizedCollected)
      byId.set(existingMatch.id, normalizedCollected)
      if (secondary) bySecondary.set(secondary, normalizedCollected)
    }
    // 내용까지 완전히 같으면 이미 있는 자료이므로 아무 것도 하지 않는다(중복 제거).
  }

  return { mergedItems: [...byId.values()], newItems, changedItems }
}
