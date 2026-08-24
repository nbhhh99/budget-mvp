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

// ── 공부하기: 돈 개념 사전 · 차근차근 경제사 · 계산기 · 재무 브리핑 ───
// 자산 형성에 필요한 개념을 정리한 일반 정보. 금융상품 추천이나 투자 방향을
// 단정하지 않는다.

// 돈 개념 사전과 차근차근 경제사가 공통으로 쓰는 출처 카탈로그 항목.
// 개별 카드/모듈은 이 카탈로그의 id만 참조하고(sourceIds), 출처 내용을 복제하지 않는다.
export interface LearningSource {
  id: string
  name: string
  publisher: string
  url: string
  effectiveDate?: string // 'YYYY-MM-DD', 수치·제도의 기준일(있는 경우)
  reviewedAt: string // 'YYYY-MM-DD', 이 출처를 확인한 날짜
  sourceType: 'official' | 'academic' | 'book' | 'institutional'
}

export type ConceptCategory =
  | 'daily-finance' // 생활경제
  | 'money-interest' // 금리·물가·통화
  | 'debt-credit' // 부채·신용
  | 'investing' // 투자
  | 'financial-products' // 금융상품
  | 'insurance-pension-tax' // 보험·연금·세금·절세계좌
  | 'economy-market' // 시장과 경제지표

// 검증된 상세 내용이 아직 없는 개념은 'in_review'로 두고 body를 비워, 사실이나
// 수치를 임의로 채우지 않는다("돈 개념 사전" §5/§19).
export type ContentReviewStatus = 'reviewed' | 'in_review'

export interface ConceptCard {
  id: string
  title: string
  shortDefinition: string
  body: string // in_review면 빈 문자열
  keyPoints: string[]
  caution?: string
  relatedConceptIds: string[]
  category: ConceptCategory
  sourceIds: string[] // LearningSource.id 참조
  reviewedAt: string // 'YYYY-MM-DD', in_review면 빈 문자열
  effectiveDate?: string
  version: number
  status: ContentReviewStatus
  aliases?: string[] // 검색용 별칭(약어·영문 표기 등). 선택 필드라 기존 카드는 그대로 둬도 된다.
}

export type CalculatorId = 'compound_interest' | 'inflation_adjusted' | 'goal_savings' | 'savings_rate'

// 'monthly_lesson'은 더 이상 새로 생성되지 않지만(§13, 차근차근 돈 공부로 대체),
// 기기에 이미 저장된 과거 레코드의 타입 호환을 위해 유니온에는 남겨둔다.
export type LearningContentType =
  | 'concept'
  | 'monthly_lesson'
  | 'calculator'
  | 'quiz'
  | 'checklist'
  | 'example'

export interface LearningProgress {
  contentId: string // PK (concept id / calculator id / quiz id / checklist id 등)
  contentType: LearningContentType
  status: 'unread' | 'reading' | 'read'
  saved: boolean
  lastOpenedAt?: string
  completedAt?: string
}

// ── 순차 잠금해제형 커리큘럼 엔진 (현재는 "차근차근 경제사"가 사용) ──
// 날짜·경과 기간을 잠금 해제 조건으로 쓰지 않는다. 이전 과정을 완료해야
// 다음 과정이 열린다. 실제 검증된 콘텐츠가 없는 과정은 itemIds를 비워두고
// "검토 중"으로 표시한다(수치·사실을 임의로 만들지 않는다). 이 타입들은
// 콘텐츠와 무관한 제네릭 엔진이라, 콘텐츠 성격이 다른 커리큘럼이 새로 생기면
// curriculumVersion으로 진행 기록을 구분해 재사용한다(§11).

export type LearningItemType = 'concept' | 'example' | 'calculator' | 'quiz' | 'checklist'

export interface QuizContent {
  question: string
  choices: string[]
  correctIndex: number
  explanation: string
}

export interface LearningContent {
  id: string
  curriculumId: string
  type: LearningItemType
  title: string
  body: string
  required: boolean
  order: number
  version: number
  reviewedAt: string // 'YYYY-MM-DD'
  effectiveDate?: string
  sourceName?: string
  sourceUrl?: string
  riskNotice?: string
  linkedConceptId?: string // type: 'concept' — 기존 ConceptCard.id 참조(콘텐츠 복제 없음)
  linkedCalculatorId?: CalculatorId // type: 'calculator' — 기존 계산기 화면 참조
  quiz?: QuizContent // type: 'quiz'
  checklistItems?: string[] // type: 'checklist'
}

export interface CurriculumModule {
  id: string
  order: number
  title: string
  description: string
  estimatedMinutes?: number
  itemIds: string[]
  relatedAssetTypes?: AssetType[]
  sourceIds?: string[]
  curriculumVersion?: string // 예: 'economic-history-v1'
  periodLabel?: string // 예: "선사~고대" — 경제사에서 시대 배지로 사용
  conceptIds?: string[] // 돈 개념 사전 연결(§17 — 본문에 정의를 복제하지 않고 id로만 참조)
}

export type CurriculumStatus = 'not_started' | 'in_progress' | 'completed'

// contentId/contentType 기준 범용 LearningProgress와 이름이 겹치지 않도록,
// 과정 단위 진행 레코드는 CurriculumProgress로 별도 명명한다.
export interface CurriculumProgress {
  curriculumId: string // PK
  status: CurriculumStatus
  completedItemIds: string[]
  startedAt?: string
  completedAt?: string
  lastViewedAt?: string
  curriculumVersion?: string // 없으면 과거(차근차근 돈 공부) 레코드 — 새 커리큘럼 계산에서 자동 제외된다.
}
