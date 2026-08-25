import { db } from '../schema'
import { isModuleComplete } from '../../domain/curriculum'
import type { CurriculumProgress, LearningContent, LearningContentType } from '../../types/models'
import * as learningProgressRepo from './learningProgress'

export async function getCurriculumProgress(curriculumId: string): Promise<CurriculumProgress | undefined> {
  return db.curriculumProgress.get(curriculumId)
}

export async function getAllCurriculumProgress(): Promise<CurriculumProgress[]> {
  return db.curriculumProgress.toArray()
}

// 과거(차근차근 돈 공부) 진행 기록에는 curriculumVersion이 없어 이 필터를 거치면
// 자동으로 제외된다 — 물리적으로 지우지 않고도 새 커리큘럼과 완전히 분리된다(§11).
export async function getCurriculumProgressForVersion(version: string): Promise<CurriculumProgress[]> {
  const all = await db.curriculumProgress.toArray()
  return all.filter((p) => p.curriculumVersion === version)
}

// curriculumId가 기본키라 put()이 upsert이므로, 과정당 레코드가 항상 하나만
// 존재한다(§5). 처음 과정을 열면 in_progress로 바뀐다(§2 규칙 2). curriculumVersion은
// 호출하는 화면이 자신의 커리큘럼 버전을 넘긴다 — 이 함수 자체는 콘텐츠와 무관한
// 제네릭 엔진이라, 여러 커리큘럼(차근차근 경제사·생활로 읽는 경제 등)이 함께 쓴다.
export async function ensureStarted(curriculumId: string, curriculumVersion: string): Promise<CurriculumProgress> {
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
    curriculumVersion,
  }
  await db.curriculumProgress.add(created)
  return created
}

// 공통 완료 처리 함수 — 순차 잠금해제형 커리큘럼 화면(본문 읽기/확인 문제)에서 호출한다.
// 콘텐츠 항목의 id를 그대로 contentId로 넘기면, 그 항목이 속한 과정의 진행
// 레코드에 반영된다. 같은 항목을 여러 번 완료해도 중복 저장되지 않는다. allContents/
// curriculumVersion은 호출하는 화면이 자신의 커리큘럼 데이터를 넘긴다.
export async function completeLearningItem(
  contentId: string,
  contentType: LearningContentType,
  allContents: LearningContent[],
  curriculumVersion: string,
): Promise<void> {
  await learningProgressRepo.setReadStatus(contentId, contentType, 'read')

  const matchedItems = allContents.filter((item) => item.id === contentId)
  const curriculumIds = new Set(matchedItems.map((item) => item.curriculumId))

  for (const curriculumId of curriculumIds) {
    const progress = await ensureStarted(curriculumId, curriculumVersion)
    const itemIdsForThisModule = matchedItems
      .filter((item) => item.curriculumId === curriculumId)
      .map((item) => item.id)

    const nextCompletedItemIds = Array.from(
      new Set([...progress.completedItemIds, ...itemIdsForThisModule]),
    )

    const contents = allContents.filter((item) => item.curriculumId === curriculumId)
    const completed = isModuleComplete(contents, nextCompletedItemIds)

    await db.curriculumProgress.update(curriculumId, {
      completedItemIds: nextCompletedItemIds,
      status: completed ? 'completed' : 'in_progress',
      // 재학습해도 최초 완료 시각은 덮어쓰지 않는다(§10).
      completedAt: completed ? (progress.completedAt ?? new Date().toISOString()) : progress.completedAt,
      lastViewedAt: new Date().toISOString(),
    })
  }
}
