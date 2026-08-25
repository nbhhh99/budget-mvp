import Dexie, { type EntityTable } from 'dexie'
import type {
  AssetValuation,
  BriefingState,
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
  briefingState!: EntityTable<BriefingState, 'id'>

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
  }
}

export const db = new BudgetDB()
