import { useEffect, useState } from 'react'
import { budgetsRepo, categoriesRepo, monthlyMetaRepo, transactionsRepo, briefingStateRepo } from '../../db'
import { computeMonthlySummary, type MonthlySummary } from '../../domain'
import './MonthlyPersonalRecap.css'

interface MonthlyPersonalRecapProps {
  yearMonth: string
}

// §8D 월간 재무 결산 중 "개인 재무" 부분 — 기존 통계 화면이 쓰는
// domain/monthlySummary.ts(computeMonthlySummary)를 그대로 재사용한다. 외부로는
// 아무것도 전송하지 않고 기기 안 데이터만으로 계산한다.
export function MonthlyPersonalRecap({ yearMonth }: MonthlyPersonalRecapProps) {
  const [summary, setSummary] = useState<MonthlySummary | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setSummary(null)
      const [categories, transactions, budgets, meta] = await Promise.all([
        categoriesRepo.getAllCategories(),
        transactionsRepo.getTransactionsByMonth(yearMonth),
        budgetsRepo.getBudgetsForMonth(yearMonth),
        monthlyMetaRepo.getMonthlyMeta(yearMonth),
      ])
      if (cancelled) return
      const computed = computeMonthlySummary(yearMonth, meta?.openingBalance ?? 0, transactions, budgets, categories)
      setSummary(computed)

      const state = await briefingStateRepo.getBriefingState()
      if (state?.monthly?.monthId !== yearMonth) {
        await briefingStateRepo.markMonthlyGenerated(yearMonth)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [yearMonth])

  if (!summary) return null

  return (
    <section className="monthly-recap">
      <h2 className="monthly-recap__title">내 재무 결산</h2>
      <div className="monthly-recap__grid">
        <div className="monthly-recap__row">
          <span>실제 수입</span>
          <span>{summary.actualIncome.toLocaleString('ko-KR')}원</span>
        </div>
        <div className="monthly-recap__row">
          <span>실제 지출</span>
          <span>{summary.actualExpense.toLocaleString('ko-KR')}원</span>
        </div>
        <div className="monthly-recap__row">
          <span>저축·투자</span>
          <span>{summary.actualSaving.toLocaleString('ko-KR')}원</span>
        </div>
        {summary.budgetRemaining !== null && (
          <div className="monthly-recap__row">
            <span>예산 대비 잔여</span>
            <span>{summary.budgetRemaining.toLocaleString('ko-KR')}원</span>
          </div>
        )}
        {summary.savingsRate !== null && (
          <div className="monthly-recap__row">
            <span>저축률</span>
            <span>{summary.savingsRate.toFixed(1)}%</span>
          </div>
        )}
        <div className="monthly-recap__row">
          <span>월말 잔액</span>
          <span>{summary.currentBalance.toLocaleString('ko-KR')}원</span>
        </div>
      </div>
    </section>
  )
}
