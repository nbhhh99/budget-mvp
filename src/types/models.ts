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

export interface Category {
  id: string
  group: CategoryGroup
  name: string
  order: number
  color: string
  icon?: string
  hidden: boolean
  isFixed?: boolean // 지출 카테고리의 고정/변동 구분 (§15 통계용, expense 그룹에서만 사용)
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
}
