export const MAX_HOUSEHOLD_NAME_LENGTH = 20
export const MAX_HOUSEHOLD_SUBTITLE_LENGTH = 30
export const DEFAULT_HOUSEHOLD_TITLE = '나의 가계부'
export const DEFAULT_HOUSEHOLD_SUBTITLE = '오늘도 내 돈을 차곡차곡 기록해요'

// 저장하기 전에 부르는 정리 함수 — 앞뒤 공백 제거, 최대 길이 제한만 한다.
// "의 가계부"를 앞뒤로 강제로 붙이지 않는다 — 사용자가 입력한 문자열을 그대로 쓴다.
export function sanitizeHouseholdName(input: string): string {
  return input.trim().slice(0, MAX_HOUSEHOLD_NAME_LENGTH)
}

export function sanitizeHouseholdSubtitle(input: string): string {
  return input.trim().slice(0, MAX_HOUSEHOLD_SUBTITLE_LENGTH)
}

// 화면에 보여줄 제목을 계산한다. 빈 값(미설정)이면 기본 제목을 쓴다.
export function resolveHouseholdTitle(name: string | undefined): string {
  const trimmed = (name ?? '').trim()
  return trimmed.length > 0 ? trimmed : DEFAULT_HOUSEHOLD_TITLE
}

// 화면에 보여줄 보조 문구를 계산한다. 빈 값(미설정)이면 기본 문구를 쓴다.
export function resolveHouseholdSubtitle(subtitle: string | undefined): string {
  const trimmed = (subtitle ?? '').trim()
  return trimmed.length > 0 ? trimmed : DEFAULT_HOUSEHOLD_SUBTITLE
}
