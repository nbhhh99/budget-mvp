import { describe, expect, it } from 'vitest'
import {
  computeModuleProgress,
  getModuleUiStatus,
  getRecommendedModule,
  getUnlockedModuleIds,
  isModuleComplete,
} from './curriculum'
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

describe('getUnlockedModuleIds', () => {
  const curriculum = [module('a', 1), module('b', 2), module('c', 3), module('d', 4)]

  it('unlocks only the first module when there is no progress', () => {
    expect(getUnlockedModuleIds(curriculum, [])).toEqual(['a'])
  })

  it('unlocks the second module immediately after the first is completed', () => {
    expect(getUnlockedModuleIds(curriculum, [progress('a', 'completed')])).toEqual(['a', 'b'])
  })

  it('keeps the fourth module locked while the third is incomplete', () => {
    const result = getUnlockedModuleIds(curriculum, [
      progress('a', 'completed'),
      progress('b', 'completed'),
      progress('c', 'in_progress'),
    ])
    expect(result).toEqual(['a', 'b', 'c'])
    expect(result).not.toContain('d')
  })

  it('keeps a completed module open even after later modules unlock', () => {
    const result = getUnlockedModuleIds(curriculum, [
      progress('a', 'completed'),
      progress('b', 'completed'),
    ])
    expect(result).toContain('a')
  })

  it('unlocks every module once the last one is completed', () => {
    const result = getUnlockedModuleIds(curriculum, [
      progress('a', 'completed'),
      progress('b', 'completed'),
      progress('c', 'completed'),
      progress('d', 'completed'),
    ])
    expect(result).toEqual(['a', 'b', 'c', 'd'])
  })

  it('skips over a placeholder (준비 중, no items) module instead of permanently blocking later modules', () => {
    const withPlaceholder = [module('a', 1), module('placeholder', 2, []), module('c', 3)]
    // 'a'만 완료했고 'placeholder'는 완료 기록이 없어도, itemIds가 비어 있어
    // 통과시키고 'c'까지 열려야 한다.
    const result = getUnlockedModuleIds(withPlaceholder, [progress('a', 'completed')])
    expect(result).toEqual(['a', 'placeholder', 'c'])
  })

  it('still stops at a real module that follows a placeholder if that real module is incomplete', () => {
    const modules = [module('a', 1, ['a-item']), module('placeholder', 2, []), module('c', 3, ['c-item'])]
    const result = getUnlockedModuleIds(modules, [progress('a', 'completed')])
    expect(result).toEqual(['a', 'placeholder', 'c'])
    // c는 열려있지만(available) 완료되지 않았으므로 다음 모듈이 있었다면 잠겨야 한다
    const modulesWithD = [...modules, module('d', 4)]
    const resultWithD = getUnlockedModuleIds(modulesWithD, [progress('a', 'completed')])
    expect(resultWithD).toEqual(['a', 'placeholder', 'c'])
  })

  it('does not depend on any date field (order/id only)', () => {
    // progress에는애초에 날짜 필드가 잠금 계산에 관여하지 않는다 — completedAt이
    // 있어도 없어도 결과가 같아야 한다.
    const withDate: CurriculumProgress = { ...progress('a', 'completed'), completedAt: '2020-01-01T00:00:00.000Z' }
    const withoutDate: CurriculumProgress = { ...progress('a', 'completed') }
    expect(getUnlockedModuleIds(curriculum, [withDate])).toEqual(
      getUnlockedModuleIds(curriculum, [withoutDate]),
    )
  })
})

describe('getModuleUiStatus', () => {
  const curriculum = [module('a', 1), module('b', 2)]

  it('reports locked for a module beyond the unlocked frontier', () => {
    const unlocked = getUnlockedModuleIds(curriculum, [])
    const byId = new Map<string, CurriculumProgress>()
    expect(getModuleUiStatus(curriculum[1], unlocked, byId)).toBe('locked')
  })

  it('reports available for an unlocked module with no progress record', () => {
    const unlocked = getUnlockedModuleIds(curriculum, [])
    const byId = new Map<string, CurriculumProgress>()
    expect(getModuleUiStatus(curriculum[0], unlocked, byId)).toBe('available')
  })

  it('reports in_progress and completed correctly', () => {
    const unlocked = ['a']
    const byId = new Map([['a', progress('a', 'in_progress')]])
    expect(getModuleUiStatus(curriculum[0], unlocked, byId)).toBe('in_progress')
    byId.set('a', progress('a', 'completed'))
    expect(getModuleUiStatus(curriculum[0], unlocked, byId)).toBe('completed')
  })

  it('reports unavailable(준비 중) for a module with no items regardless of lock state', () => {
    const placeholder = module('p', 5, [])
    expect(getModuleUiStatus(placeholder, ['p'], new Map())).toBe('unavailable')
    expect(getModuleUiStatus(placeholder, [], new Map())).toBe('unavailable')
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
