import Dexie, { type EntityTable } from 'dexie'
import type {
  AssetValuation,
  Category,
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
  }
}

export const db = new BudgetDB()
