import type { Transaction } from '../types/models'
import { filterByType, sumAmount } from './aggregate'

export function sumByType(transactions: Transaction[], type: Transaction['type']): number {
  return sumAmount(filterByType(transactions, type))
}

// 생활 잔액 = 월초 생활 잔액 + 실제 수입 − 생활비 지출 − 저축·투자 이동액 (§13)
// 계좌 간 이체는 이 계산식에 등장하지 않는다 (영향 없음).
export function computeLifeBalance(openingBalance: number, transactions: Transaction[]): number {
  const income = sumByType(transactions, 'income')
  const expense = sumByType(transactions, 'expense')
  const saving = sumByType(transactions, 'saving')
  return openingBalance + income - expense - saving
}
