import { monthlyMetaRepo, transactionsRepo } from '../../db'
import { computeLifeBalance } from '../../domain'

// 특정 월의 월말(또는 현재까지의) 생활 잔액을 계산한다. 이월 제안 배너 등에서 재사용된다.
export async function getMonthClosingBalance(yearMonth: string): Promise<number> {
  const [meta, transactions] = await Promise.all([
    monthlyMetaRepo.getMonthlyMeta(yearMonth),
    transactionsRepo.getTransactionsByMonth(yearMonth),
  ])
  return computeLifeBalance(meta?.openingBalance ?? 0, transactions)
}
