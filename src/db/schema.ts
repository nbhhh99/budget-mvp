import Dexie, { type EntityTable } from 'dexie'
import type {
  AssetValuation,
  Category,
  CryptoIndicatorCache,
  CurriculumProgress,
  LearningProgress,
  MonthlyBudget,
  MonthlyMeta,
  Settings,
  Transaction,
} from '../types/models'

export class BudgetDB extends Dexie {
  transactions!: EntityTable<Transaction, 'id'>
  categories!: EntityTable<Category, 'id'>
  monthlyBudgets!: EntityTable<MonthlyBudget, 'id'>
  monthlyMeta!: EntityTable<MonthlyMeta, 'yearMonth'>
  settings!: EntityTable<Settings, 'id'>
  assetValuations!: EntityTable<AssetValuation, 'categoryId'>
  learningProgress!: EntityTable<LearningProgress, 'contentId'>
  curriculumProgress!: EntityTable<CurriculumProgress, 'curriculumId'>
  indicatorCryptoCache!: EntityTable<CryptoIndicatorCache, 'market'>

  constructor() {
    super('budget-mvp')

    this.version(1).stores({
      transactions: 'id, date, type, categoryId, [date+type], [categoryId+date]',
      categories: 'id, group, order, hidden',
      monthlyBudgets: 'id, yearMonth, categoryId, [yearMonth+categoryId]',
      monthlyMeta: 'yearMonth',
      settings: 'id',
    })

    this.version(2).stores({
      transactions: 'id, date, type, categoryId, [date+type], [categoryId+date]',
      categories: 'id, group, order, hidden',
      monthlyBudgets: 'id, yearMonth, categoryId, [yearMonth+categoryId]',
      monthlyMeta: 'yearMonth',
      settings: 'id',
      assetValuations: 'categoryId',
    })

    this.version(3).stores({
      transactions: 'id, date, type, categoryId, [date+type], [categoryId+date]',
      categories: 'id, group, order, hidden',
      monthlyBudgets: 'id, yearMonth, categoryId, [yearMonth+categoryId]',
      monthlyMeta: 'yearMonth',
      settings: 'id',
      assetValuations: 'categoryId',
      learningProgress: 'contentId, contentType',
    })

    this.version(4).stores({
      transactions: 'id, date, type, categoryId, [date+type], [categoryId+date]',
      categories: 'id, group, order, hidden',
      monthlyBudgets: 'id, yearMonth, categoryId, [yearMonth+categoryId]',
      monthlyMeta: 'yearMonth',
      settings: 'id',
      assetValuations: 'categoryId',
      learningProgress: 'contentId, contentType',
      curriculumProgress: 'curriculumId',
    })

    this.version(5).stores({
      transactions: 'id, date, type, categoryId, [date+type], [categoryId+date]',
      categories: 'id, group, order, hidden',
      monthlyBudgets: 'id, yearMonth, categoryId, [yearMonth+categoryId]',
      monthlyMeta: 'yearMonth',
      settings: 'id',
      assetValuations: 'categoryId',
      learningProgress: 'contentId, contentType',
      curriculumProgress: 'curriculumId',
      indicatorCryptoCache: 'market',
      briefingState: 'id',
    })

    // briefingState는 개인 재무 브리핑(일간/주간 다이제스트) 생성 시각만 담던
    // 테이블이었는데, 그 기능 자체를 없애면서 더 이상 쓰지 않는다. null로 지정하면
    // Dexie가 이 스토어만 삭제하고 나머지 테이블은 전혀 건드리지 않는다 — 개인 금융
    // 데이터(거래·예산·자산 등)는 이 업그레이드로 영향받지 않는다.
    this.version(6).stores({
      transactions: 'id, date, type, categoryId, [date+type], [categoryId+date]',
      categories: 'id, group, order, hidden',
      monthlyBudgets: 'id, yearMonth, categoryId, [yearMonth+categoryId]',
      monthlyMeta: 'yearMonth',
      settings: 'id',
      assetValuations: 'categoryId',
      learningProgress: 'contentId, contentType',
      curriculumProgress: 'curriculumId',
      indicatorCryptoCache: 'market',
      briefingState: null,
    })
  }
}

export const db = new BudgetDB()
