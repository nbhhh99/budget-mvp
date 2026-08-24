import { db } from '../schema'
import { LEARNING_CONTENTS } from '../../content/curriculum'
import { isModuleComplete } from '../../domain/curriculum'
import type { CurriculumProgress, LearningContentType } from '../../types/models'
import * as learningProgressRepo from './learningProgress'

export async function getCurriculumProgress(curriculumId: string): Promise<CurriculumProgress | undefined> {
  return db.curriculumProgress.get(curriculumId)
}

export async function getAllCurriculumProgress(): Promise<CurriculumProgress[]> {
  return db.curriculumProgress.toArray()
}

// curriculumId가 기본키라 put()이 upsert이므로, 과정당 레코드가 항상 하나만
// 존재한다(§5). 처음 과정을 열면 in_progress로 바뀐다(§2 규칙 2).
export async function ensureStarted(curriculumId: string): Promise<CurriculumProgress> {
  const existing = await db.curriculumProgress.get(curriculumId)
  if (existing) {
    await db.curriculumProgress.update(curriculumId, { lastViewedAt: new Date().toISOString() })
    return (await db.curriculumProgress.get(curriculumId)) as CurriculumProgress
  }
  const created: CurriculumProgress = {
    curriculumId,
    status: 'in_progress',
    completedItemIds: [],
    startedAt: new Date().toISOString(),
    lastViewedAt: new Date().toISOString(),
  }
  await db.curriculumProgress.add(created)
  return created
}

// 공통 완료 처리 함수(§13) — 커리큘럼 화면뿐 아니라 기존 개념 카드/계산기 화면에서도
// 이 함수 하나만 호출한다. 1) 범용 learningProgress 테이블에 'read'로 기록하고,
// 2) 이 콘텐츠를 필수 항목으로 쓰는 모든 과정의 진행 레코드에 반영한다.
// 같은 콘텐츠가 여러 과정에서 재사용되어도(예: 개념 카드 공유) 진행 레코드가
// 중복 생성되지 않는다.
export async function completeLearningItem(
  contentId: string,
  contentType: LearningContentType,
): Promise<void> {
  await learningProgressRepo.setReadStatus(contentId, contentType, 'read')

  const matchedItems = LEARNING_CONTENTS.filter((item) => {
    if (item.type === 'concept') return item.linkedConceptId === contentId
    if (item.type === 'calculator') return item.linkedCalculatorId === contentId
    return item.id === contentId // quiz/checklist/example: 커리큘럼 고유 항목 id
  })

  const curriculumIds = new Set(matchedItems.map((item) => item.curriculumId))

  for (const curriculumId of curriculumIds) {
    const progress = await ensureStarted(curriculumId)
    const itemIdsForThisModule = matchedItems
      .filter((item) => item.curriculumId === curriculumId)
      .map((item) => item.id)

    const nextCompletedItemIds = Array.from(
      new Set([...progress.completedItemIds, ...itemIdsForThisModule]),
    )

    const contents = LEARNING_CONTENTS.filter((item) => item.curriculumId === curriculumId)
    const completed = isModuleComplete(contents, nextCompletedItemIds)

    await db.curriculumProgress.update(curriculumId, {
      completedItemIds: nextCompletedItemIds,
      status: completed ? 'completed' : 'in_progress',
      // 재학습해도 최초 완료 시각은 덮어쓰지 않는다(§5).
      completedAt: completed ? (progress.completedAt ?? new Date().toISOString()) : progress.completedAt,
      lastViewedAt: new Date().toISOString(),
    })
  }
}
