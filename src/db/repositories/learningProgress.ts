import { db } from '../schema'
import type { LearningContentType, LearningProgress } from '../../types/models'

export async function getLearningProgress(contentId: string): Promise<LearningProgress | undefined> {
  return db.learningProgress.get(contentId)
}

export async function getAllLearningProgress(): Promise<LearningProgress[]> {
  return db.learningProgress.toArray()
}

async function ensureProgress(
  contentId: string,
  contentType: LearningContentType,
): Promise<LearningProgress> {
  const existing = await db.learningProgress.get(contentId)
  if (existing) return existing
  const created: LearningProgress = { contentId, contentType, status: 'unread', saved: false }
  await db.learningProgress.add(created)
  return created
}

export async function setReadStatus(
  contentId: string,
  contentType: LearningContentType,
  status: LearningProgress['status'],
): Promise<void> {
  await ensureProgress(contentId, contentType)
  await db.learningProgress.update(contentId, {
    status,
    lastOpenedAt: new Date().toISOString(),
    completedAt: status === 'read' ? new Date().toISOString() : undefined,
  })
}

export async function setSaved(
  contentId: string,
  contentType: LearningContentType,
  saved: boolean,
): Promise<void> {
  await ensureProgress(contentId, contentType)
  await db.learningProgress.update(contentId, { saved })
}
