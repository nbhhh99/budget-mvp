import { describe, expect, it } from 'vitest'
import { computeModuleProgress, getModuleUiStatus, getRecommendedModule, isModuleComplete } from './curriculum'
import type { CurriculumModule, CurriculumProgress, LearningContent } from '../types/models'

function module(id: string, order: number, itemIds: string[] = [`${id}-item`]): CurriculumModule {
  return { id, order, title: id, description: '', itemIds }
}

function content(id: string, curriculumId: string, required = true): LearningContent {
  return {
    id,
    curriculumId,
    type: 'concept',
    title: '',
    body: '',
    required,
    order: 1,
    version: 1,
    reviewedAt: '2026-08-24',
  }
}

function progress(curriculumId: string, status: CurriculumProgress['status']): CurriculumProgress {
  return { curriculumId, status, completedItemIds: [] }
}

describe('isModuleComplete', () => {
  it('is complete when every required item is completed', () => {
    const contents = [content('a', 'm'), content('b', 'm')]
    expect(isModuleComplete(contents, ['a', 'b'])).toBe(true)
  })

  it('excludes optional items from the completion condition', () => {
    const contents = [content('a', 'm'), content('b', 'm', false)]
    expect(isModuleComplete(contents, ['a'])).toBe(true)
  })

  it('is not complete when a required item is missing', () => {
    const contents = [content('a', 'm'), content('b', 'm')]
    expect(isModuleComplete(contents, ['a'])).toBe(false)
  })

  it('is not complete for a module with zero required items (준비 중)', () => {
    expect(isModuleComplete([], [])).toBe(false)
    expect(isModuleComplete([content('a', 'm', false)], ['a'])).toBe(false)
  })
})

describe('computeModuleProgress', () => {
  it('counts only required items', () => {
    const contents = [content('a', 'm'), content('b', 'm'), content('c', 'm', false)]
    expect(computeModuleProgress(contents, ['a'])).toEqual({ completed: 1, total: 2 })
  })
})

describe('getModuleUiStatus', () => {
  const curriculum = [module('a', 1), module('b', 2)]

  it('reports available for any real module with no progress record, regardless of order(순차 잠금 없음)', () => {
    const byId = new Map<string, CurriculumProgress>()
    expect(getModuleUiStatus(curriculum[0], byId)).toBe('available')
    // 이전 과정(a)을 전혀 시작하지 않았어도 두 번째 과정(b)이 바로 들어갈 수 있다 —
    // 과거의 순차 잠금 구조가 없어졌다는 회귀 테스트.
    expect(getModuleUiStatus(curriculum[1], byId)).toBe('available')
  })

  it('reports in_progress and completed correctly', () => {
    const byId = new Map([['a', progress('a', 'in_progress')]])
    expect(getModuleUiStatus(curriculum[0], byId)).toBe('in_progress')
    byId.set('a', progress('a', 'completed'))
    expect(getModuleUiStatus(curriculum[0], byId)).toBe('completed')
  })

  it('reports unavailable(준비 중) for a module with no items — the only case content is withheld', () => {
    const placeholder = module('p', 5, [])
    expect(getModuleUiStatus(placeholder, new Map())).toBe('unavailable')
  })
})

describe('getRecommendedModule', () => {
  const curriculum = [module('a', 1), module('b', 2), module('c', 3)]

  it('recommends the first incomplete module with status not_started when there is no progress', () => {
    expect(getRecommendedModule(curriculum, [])).toEqual({ module: curriculum[0], status: 'not_started' })
  })

  it('reports in_progress for a module that has been started', () => {
    const result = getRecommendedModule(curriculum, [progress('a', 'in_progress')])
    expect(result?.status).toBe('in_progress')
    expect(result?.module.id).toBe('a')
  })

  it('recommends the next module after the current one completes', () => {
    const result = getRecommendedModule(curriculum, [progress('a', 'completed')])
    expect(result?.module.id).toBe('b')
    expect(result?.status).toBe('not_started')
  })

  it('returns null when every module is completed', () => {
    const result = getRecommendedModule(curriculum, [
      progress('a', 'completed'),
      progress('b', 'completed'),
      progress('c', 'completed'),
    ])
    expect(result).toBeNull()
  })

  it('recommends module c directly even though a and b were never touched(순차 잠금 없이도 순서 안내는 유지)', () => {
    const result = getRecommendedModule(curriculum, [progress('c', 'in_progress')])
    // c가 진행 중이어도, 순서상 더 앞선 미완료 과정(a)을 먼저 추천한다 — 추천은
    // "순서대로 안내"이지 "가장 최근에 만진 것"이 아니다. 이 동작 자체는 잠금
    // 제거 이전과 동일하게 유지된다(잠금이 없어졌다고 추천 순서 로직이 바뀌지
    // 않았음을 확인).
    expect(result?.module.id).toBe('a')
  })

  it('skips placeholder (준비 중) modules and never recommends them', () => {
    const withPlaceholder = [module('a', 1), module('placeholder', 2, []), module('c', 3)]
    const result = getRecommendedModule(withPlaceholder, [progress('a', 'completed')])
    expect(result?.module.id).toBe('c')
  })

  it('returns null once every real module is completed even if a placeholder never completes', () => {
    const withPlaceholder = [module('a', 1), module('placeholder', 2, []), module('c', 3)]
    const result = getRecommendedModule(withPlaceholder, [
      progress('a', 'completed'),
      progress('c', 'completed'),
    ])
    expect(result).toBeNull()
  })
})
