import { v4 as uuidv4 } from 'uuid'
import { db } from '../schema'
import type { Transaction } from '../../types/models'

export type NewTransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
export type TransactionPatch = Partial<Omit<Transaction, 'id' | 'createdAt'>>

export async function createTransaction(input: NewTransactionInput): Promise<Transaction> {
  const now = new Date().toISOString()
  const transaction: Transaction = {
    ...input,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  }
  await db.transactions.add(transaction)
  return transaction
}

// 삭제 실행취소(undo) 용도로, 이전에 존재하던 레코드를 동일 id로 복원한다.
export async function restoreTransaction(transaction: Transaction): Promise<void> {
  await db.transactions.add(transaction)
}

export async function updateTransaction(id: string, patch: TransactionPatch): Promise<void> {
  await db.transactions.update(id, { ...patch, updatedAt: new Date().toISOString() })
}

export async function deleteTransaction(id: string): Promise<Transaction | undefined> {
  const existing = await db.transactions.get(id)
  if (existing) {
    await db.transactions.delete(id)
  }
  return existing
}

export async function getTransaction(id: string): Promise<Transaction | undefined> {
  return db.transactions.get(id)
}

export async function getTransactionsByMonth(yearMonth: string): Promise<Transaction[]> {
  return db.transactions
    .where('date')
    .between(`${yearMonth}-01`, `${yearMonth}-31`, true, true)
    .sortBy('date')
}

export async function getTransactionsByRange(
  startDate: string,
  endDate: string,
): Promise<Transaction[]> {
  return db.transactions.where('date').between(startDate, endDate, true, true).sortBy('date')
}

export async function getAllTransactions(): Promise<Transaction[]> {
  return db.transactions.orderBy('date').toArray()
}

export async function countTransactionsForCategory(categoryId: string): Promise<number> {
  return db.transactions.where('categoryId').equals(categoryId).count()
}
