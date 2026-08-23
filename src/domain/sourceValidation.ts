// 브리핑·공부하기 콘텐츠가 공통으로 쓰는 출처(LearningSource/BriefingSource) 검증.
// §10/§9: 모든 카드는 최소 한 개의 공식 출처(기관명·제목·URL·확인일)를 가져야 한다.

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
export const YEAR_MONTH_RE = /^\d{4}-\d{2}$/

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function validateSource(source: unknown, path: string, errors: string[]): void {
  if (!isPlainObject(source)) {
    errors.push(`${path}: 출처 형식이 올바르지 않습니다.`)
    return
  }
  if (typeof source.organization !== 'string' || !source.organization.trim()) {
    errors.push(`${path}: 출처 기관명(organization)이 없습니다.`)
  }
  if (typeof source.title !== 'string' || !source.title.trim()) {
    errors.push(`${path}: 출처 제목(title)이 없습니다.`)
  }
  if (typeof source.url !== 'string' || !/^https?:\/\//.test(source.url)) {
    errors.push(`${path}: 출처 URL이 올바르지 않습니다.`)
  }
  if (typeof source.accessedAt !== 'string' || !DATE_RE.test(source.accessedAt)) {
    errors.push(`${path}: 확인일(accessedAt)이 올바르지 않습니다 (YYYY-MM-DD).`)
  }
  if (source.publishedAt !== undefined) {
    if (typeof source.publishedAt !== 'string' || !DATE_RE.test(source.publishedAt)) {
      errors.push(`${path}: 발표일(publishedAt) 형식이 올바르지 않습니다 (YYYY-MM-DD).`)
    }
  }
}
