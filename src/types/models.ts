export type TransactionType = 'income' | 'expense' | 'saving' | 'transfer'
export type CategoryGroup = 'income' | 'expense' | 'saving' | 'transfer'

export const TRANSACTION_TYPE_TO_GROUP: Record<TransactionType, CategoryGroup> = {
  income: 'income',
  expense: 'expense',
  saving: 'saving',
  transfer: 'transfer',
}

export const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  income: '수입',
  expense: '생활비 지출',
  saving: '저축·투자',
  transfer: '계좌 간 이체',
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  categoryId: string
  date: string // 'YYYY-MM-DD', KST 로컬 문자열
  time: string // 'HH:mm'
  memo?: string
  paymentMethod?: string
  createdAt: string
  updatedAt: string
  importSourceId?: string
}

// 재무 브리핑 개인화에 쓰는 자산 유형. saving 그룹 카테고리뿐 아니라, expense 그룹의
// "이자"처럼 대출 신호를 나타내는 카테고리에도 'debt'를 붙일 수 있다.
export type AssetType =
  | 'cash_deposit'
  | 'savings'
  | 'domestic_stock'
  | 'foreign_stock'
  | 'etf'
  | 'bond'
  | 'pension'
  | 'real_estate'
  | 'foreign_currency'
  | 'crypto'
  | 'debt'
  | 'other'

export interface Category {
  id: string
  group: CategoryGroup
  name: string
  order: number
  color: string
  icon?: string
  hidden: boolean
  isFixed?: boolean // 지출 카테고리의 고정/변동 구분 (§15 통계용, expense 그룹에서만 사용)
  assetType?: AssetType // 재무 브리핑 개인화용 (선택, 미설정이면 일반 브리핑만 적용)
  createdAt: string
}

export interface MonthlyBudget {
  id: string // `${yearMonth}_${categoryId}`
  yearMonth: string // 'YYYY-MM'
  categoryId: string
  planAmount: number
}

export interface MonthlyMeta {
  yearMonth: string // PK
  openingBalance: number
  openingBalanceSource: 'manual' | 'carried_over'
  locked: boolean
  closingNote?: string
}

export interface AssetValuation {
  categoryId: string // PK, saving 그룹 카테고리 참조
  currentValue: number
  updatedAt: string
}

export interface Settings {
  id: 'settings' // 단일 행 고정 키
  largeAmountThreshold: number
  lastUsedTransactionType?: TransactionType
  onboardingCompleted: boolean
  lastBackupAt?: string
  lockPinHash: string // 빈 문자열이면 잠금 미설정. 평문이 아닌 SHA-256 해시만 저장한다.
  lockPinLength: number // 자릿수를 알면 그만큼 입력됐을 때 자동으로 확인할 수 있다. 0이면 알 수 없음(과거 데이터).
  assetTypeMigrationApplied: boolean // 카테고리 이름 기반 자산유형 1회성 제안을 이미 적용했는지
  householdName: string // 홈 화면 상단 가계부 이름. 빈 문자열이면 기본 제목("나의 가계부")을 쓴다.
  householdSubtitle: string // 가계부 이름 아래 보조 문구. 빈 문자열이면 기본 문구를 쓴다.
}

// ── 이번 달 재무 브리핑 ──────────────────────────────────────────
// 공식 기관 자료를 정리한 일반 정보. 투자 추천이 아니며, 매수·매도 시점을 제시하지 않는다.

export type BriefingRegion = 'korea' | 'global'

export type BriefingCategory =
  | 'interest_rate'
  | 'inflation'
  | 'exchange_rate'
  | 'growth'
  | 'employment'
  | 'household_debt'
  | 'deposit_protection'
  | 'pension'
  | 'tax'
  | 'financial_policy'
  | 'other'

export type BriefingPolicyStatus = 'active' | 'scheduled' | 'under_review' | 'ending'

export interface BriefingSource {
  organization: string
  title: string
  url: string
  publishedAt?: string // 'YYYY-MM-DD'
  accessedAt: string // 'YYYY-MM-DD', 이 자료를 확인한 날짜
}

export interface AssetImplication {
  assetTypes: AssetType[]
  explanation: string
}

export interface BriefingItem {
  id: string
  region: BriefingRegion
  category: BriefingCategory
  title: string
  factSummary: string // "무슨 일이 있었나"
  value?: number
  unit?: string
  previousValue?: number
  comparisonBasis?: 'month_over_month' | 'year_over_year' | 'none' // 전월비/전년동월비 구분
  referenceDate: string // 'YYYY-MM-DD', 기준일
  significance: string // "왜 중요한가"
  assetImplications: AssetImplication[] // "내 자산과의 관련성"
  checklist: string[] // "확인할 사항"
  policyStatus?: BriefingPolicyStatus
  effectiveDate?: string // 'YYYY-MM-DD'
  sources: BriefingSource[]
  tags: string[]
}

export interface FinancialBriefing {
  yearMonth: string // 'YYYY-MM'
  generatedAt: string // ISO datetime
  reviewedAt?: string // ISO datetime, reviewed 상태로 바뀐 시각
  status: 'draft' | 'reviewed'
  summary: string
  items: BriefingItem[]
}

export interface BriefingIndexEntry {
  yearMonth: string
  status: 'draft' | 'reviewed'
  updatedAt: string
}

export interface BriefingIndex {
  latestReviewed: string | null // 'YYYY-MM', reviewed 상태 중 최신. 없으면 null
  entries: BriefingIndexEntry[]
}

// ── 공부하기 (개념 카드 · 계산기 · 이번 달 돈 공부) ──────────────────
// 자산 형성에 필요한 개념을 정리한 일반 정보. 금융상품 추천이나 투자 방향을
// 단정하지 않는다. BriefingSource와 동일한 구조를 쓴다.

export type LearningSource = BriefingSource

export interface ConceptCard {
  id: string
  title: string
  oneLineSummary: string
  definition: string
  example: string
  whyItMatters: string
  relatedAssetTypes: AssetType[]
  checklist: string[]
  sources: LearningSource[]
  reviewedAt: string // 'YYYY-MM-DD'
  estimatedMinutes: number
  difficulty: 'basic' | 'intermediate'
  relatedConceptIds?: string[] // "관련 개념" 섹션에서 이동할 다른 개념 카드
}

export interface LessonSection {
  heading: string
  body: string
}

export interface MonthlyMoneyLesson {
  id: string
  yearMonth: string
  title: string
  subtitle: string
  relatedBriefingItemIds: string[]
  learningGoals: string[]
  sections: LessonSection[]
  reflectionQuestion: string
  relatedConceptIds: string[]
  relatedCalculatorIds: string[]
  sources: LearningSource[]
  status: 'draft' | 'reviewed'
  reviewedAt?: string
}

export interface MonthlyLessonIndexEntry {
  yearMonth: string
  status: 'draft' | 'reviewed'
  updatedAt: string
}

export interface MonthlyLessonIndex {
  latestReviewed: string | null
  entries: MonthlyLessonIndexEntry[]
}

export type CalculatorId = 'compound_interest' | 'inflation_adjusted' | 'goal_savings' | 'savings_rate'

export type LearningContentType = 'concept' | 'monthly_lesson'

export interface LearningProgress {
  contentId: string // PK (concept id 또는 monthly lesson id)
  contentType: LearningContentType
  status: 'unread' | 'reading' | 'read'
  saved: boolean
  lastOpenedAt?: string
  completedAt?: string
}
