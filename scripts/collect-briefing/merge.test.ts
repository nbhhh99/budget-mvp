import { describe, expect, it } from 'vitest'
import type { BriefingItem } from '../../src/types/models'
import { itemsEqual, mergeItems } from './merge'

function makeItem(overrides: Partial<BriefingItem> = {}): BriefingItem {
  return {
    id: 'item-1',
    region: 'korea',
    category: 'interest_rate',
    title: '기준금리 발표',
    factSummary: '한국은행이 기준금리를 동결했습니다.',
    referenceDate: '2026-08-01',
    significance: '가계 대출 금리에 영향을 줄 수 있습니다.',
    assetImplications: [{ assetTypes: ['savings'], explanation: '예금 금리에 영향을 줄 수 있어요.' }],
    checklist: ['내 예금 금리를 확인해보세요.'],
    sources: [{ organization: '한국은행', title: '기준금리 결정', url: 'https://bok.or.kr/1', accessedAt: '2026-08-01' }],
    tags: ['기준금리'],
    ...overrides,
  }
}

describe('itemsEqual', () => {
  it('키 순서가 달라도 내용이 같으면 같다고 판정한다', () => {
    const a = makeItem()
    const b = { ...makeItem() }
    // 객체 프로퍼티 삽입 순서를 뒤바꿔도 stableStringify 비교는 영향받지 않아야 한다.
    const reordered = Object.fromEntries(Object.entries(b).reverse()) as unknown as BriefingItem
    expect(itemsEqual(a, reordered)).toBe(true)
  })

  it('내용이 다르면 다르다고 판정한다', () => {
    const a = makeItem()
    const b = makeItem({ factSummary: '다른 내용입니다.' })
    expect(itemsEqual(a, b)).toBe(false)
  })
})

describe('mergeItems', () => {
  it('기존 항목을 보존하고 새 항목만 추가한다', () => {
    const existing = [makeItem({ id: 'a' })]
    const collected = [
      makeItem({ id: 'a' }),
      makeItem({
        id: 'b',
        title: '새 항목',
        sources: [{ organization: '한국은행', title: '다른 발표', url: 'https://bok.or.kr/2', accessedAt: '2026-08-01' }],
      }),
    ]
    const result = mergeItems(existing, collected)
    expect(result.newItems.map((i) => i.id)).toEqual(['b'])
    expect(result.changedItems).toHaveLength(0)
    expect(result.mergedItems.map((i) => i.id).sort()).toEqual(['a', 'b'])
  })

  it('같은 id의 내용이 바뀌면 변경 항목으로 교체한다', () => {
    const existing = [makeItem({ id: 'a', factSummary: '이전 내용' })]
    const collected = [makeItem({ id: 'a', factSummary: '바뀐 내용' })]
    const result = mergeItems(existing, collected)
    expect(result.newItems).toHaveLength(0)
    expect(result.changedItems.map((i) => i.id)).toEqual(['a'])
    expect(result.mergedItems).toHaveLength(1)
    expect(result.mergedItems[0].factSummary).toBe('바뀐 내용')
  })

  it('id가 달라도 출처 URL과 기준일이 같으면 같은 자료로 취급해 중복 제거한다', () => {
    const existing = [makeItem({ id: 'a' })]
    const collected = [makeItem({ id: 'different-id' })] // 같은 sources[0].url + referenceDate
    const result = mergeItems(existing, collected)
    expect(result.newItems).toHaveLength(0)
    expect(result.changedItems).toHaveLength(0)
    expect(result.mergedItems).toHaveLength(1)
  })

  it('완전히 같은 항목은 신규도 변경도 아니다(중복 제거)', () => {
    const existing = [makeItem({ id: 'a' })]
    const collected = [makeItem({ id: 'a' })]
    const result = mergeItems(existing, collected)
    expect(result.newItems).toHaveLength(0)
    expect(result.changedItems).toHaveLength(0)
    expect(result.mergedItems).toHaveLength(1)
  })

  it('수집 배치 내부에 같은 id가 중복되면 첫 번째만 반영한다', () => {
    const collected = [makeItem({ id: 'a', factSummary: '첫 번째' }), makeItem({ id: 'a', factSummary: '두 번째' })]
    const result = mergeItems([], collected)
    expect(result.newItems).toHaveLength(1)
    expect(result.newItems[0].factSummary).toBe('첫 번째')
  })

  it('기존 항목이 없고 신규 수집도 없으면 빈 결과를 반환한다', () => {
    const result = mergeItems([], [])
    expect(result.mergedItems).toHaveLength(0)
    expect(result.newItems).toHaveLength(0)
    expect(result.changedItems).toHaveLength(0)
  })
})
