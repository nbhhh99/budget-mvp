import { useEffect, useMemo, useState } from 'react'
import { ScreenHeader } from '../../components/ScreenHeader'
import { MonthPicker } from '../../components/MonthPicker'
import { InlineAmountField } from '../../components/InlineAmountField'
import { useToast } from '../../components/toast/useToast'
import { budgetsRepo, categoriesRepo, monthlyMetaRepo, transactionsRepo } from '../../db'
import type { Category, MonthlyBudget, MonthlyMeta, Transaction } from '../../types/models'
import { computeMonthlySummary, type MonthlySummary } from '../../domain'
import { currentYearMonth, formatWon, shiftYearMonth } from '../../utils/date'
import { formatPercent } from '../../utils/format'
import { getMonthClosingBalance } from './monthlyBalanceService'
import './MonthlySummaryScreen.css'

export function MonthlySummaryScreen() {
  const { showToast } = useToast()
  const [yearMonth, setYearMonth] = useState(currentYearMonth())
  const [loaded, setLoaded] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const [meta, setMeta] = useState<MonthlyMeta | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [closingNote, setClosingNote] = useState('')

  const [carryOverSuggestion, setCarryOverSuggestion] = useState<number | null>(null)
  const [carryOverStale, setCarryOverStale] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoaded(false)
      const previousYearMonth = shiftYearMonth(yearMonth, -1)
      const [
        currentMeta,
        monthTransactions,
        monthBudgets,
        allCategories,
        previousMeta,
        previousTransactions,
      ] = await Promise.all([
        monthlyMetaRepo.getMonthlyMeta(yearMonth),
        transactionsRepo.getTransactionsByMonth(yearMonth),
        budgetsRepo.getBudgetsForMonth(yearMonth),
        categoriesRepo.getAllCategories(),
        monthlyMetaRepo.getMonthlyMeta(previousYearMonth),
        transactionsRepo.getTransactionsByMonth(previousYearMonth),
      ])
      if (cancelled) return

      setMeta(currentMeta ?? null)
      setTransactions(monthTransactions)
      setBudgets(monthBudgets)
      setCategories(allCategories)
      setClosingNote(currentMeta?.closingNote ?? '')

      const hasPreviousData = Boolean(previousMeta) || previousTransactions.length > 0
      if (hasPreviousData) {
        const previousClosing = await getMonthClosingBalance(previousYearMonth)
        if (cancelled) return
        if (!currentMeta) {
          setCarryOverSuggestion(previousClosing)
          setCarryOverStale(null)
        } else if (
          currentMeta.openingBalanceSource === 'carried_over' &&
          currentMeta.openingBalance !== previousClosing
        ) {
          setCarryOverStale(previousClosing)
          setCarryOverSuggestion(null)
        } else {
          setCarryOverSuggestion(null)
          setCarryOverStale(null)
        }
      } else {
        setCarryOverSuggestion(null)
        setCarryOverStale(null)
      }

      setLoaded(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [yearMonth, refreshKey])

  const summary: MonthlySummary = useMemo(
    () =>
      computeMonthlySummary(
        yearMonth,
        meta?.openingBalance ?? 0,
        transactions,
        budgets,
        categories,
      ),
    [yearMonth, meta, transactions, budgets, categories],
  )

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  async function applyCarryOver(amount: number) {
    await monthlyMetaRepo.setOpeningBalance(yearMonth, amount, 'carried_over')
    showToast({ message: '월초 잔고를 이월했습니다.' })
    setRefreshKey((k) => k + 1)
  }

  async function handleOpeningBalanceCommit(amount: number) {
    await monthlyMetaRepo.setOpeningBalance(yearMonth, amount, 'manual')
    setRefreshKey((k) => k + 1)
  }

  async function handleClosingNoteBlur() {
    await monthlyMetaRepo.setClosingNote(yearMonth, closingNote)
  }

  const overBudgetCategories = summary.overBudgetCategoryIds
    .map((id) => categoryMap.get(id))
    .filter((c): c is Category => Boolean(c))

  return (
    <div className="monthly-summary">
      <ScreenHeader title="월간 요약 · 월말 결산" />
      <MonthPicker yearMonth={yearMonth} onChange={setYearMonth} />

      {loaded && carryOverSuggestion !== null && (
        <div className="monthly-summary__banner">
          <span>
            지난달 말 잔고 {formatWon(carryOverSuggestion)}을 이번 달 월초 잔고로 가져올까요?
          </span>
          <button type="button" onClick={() => applyCarryOver(carryOverSuggestion)}>
            이월하기
          </button>
        </div>
      )}

      {loaded && carryOverStale !== null && (
        <div className="monthly-summary__banner monthly-summary__banner--stale">
          <span>
            지난달 내역이 수정되어 이월 잔고가 {formatWon(carryOverStale)}로 달라졌습니다.
          </span>
          <button type="button" onClick={() => applyCarryOver(carryOverStale)}>
            업데이트
          </button>
        </div>
      )}

      <div className="monthly-summary__body">
        <section className="monthly-summary__card">
          <div className="monthly-summary__field-row">
            <span className="monthly-summary__label">월초 잔고</span>
            <InlineAmountField
              key={`${yearMonth}-${refreshKey}`}
              value={meta?.openingBalance ?? 0}
              onCommit={handleOpeningBalanceCommit}
              placeholder="0"
            />
          </div>
          <div className="monthly-summary__balance">
            <span className="monthly-summary__label">현재 잔고</span>
            <strong>{formatWon(summary.currentBalance)}</strong>
          </div>
        </section>

        <section className="monthly-summary__card">
          <h2 className="monthly-summary__card-title">수입</h2>
          <SummaryLine label="계획" value={formatWon(summary.planIncome)} />
          <SummaryLine label="실제" value={formatWon(summary.actualIncome)} emphasize />
          <SummaryLine label="달성률" value={formatPercent(summary.incomeAchievementRate)} />
        </section>

        <section className="monthly-summary__card">
          <h2 className="monthly-summary__card-title">생활비 지출</h2>
          <SummaryLine label="계획" value={formatWon(summary.planExpense)} />
          <SummaryLine label="실제" value={formatWon(summary.actualExpense)} emphasize />
          <SummaryLine
            label="예산 잔여액"
            value={summary.budgetRemaining === null ? '—' : formatWon(summary.budgetRemaining)}
          />
          <SummaryLine
            label="예산 소진율"
            value={formatPercent(summary.overallExpenseUsageRatio)}
          />
          {overBudgetCategories.length > 0 && (
            <div className="monthly-summary__over-badges">
              {overBudgetCategories.map((c) => (
                <span key={c.id} className="monthly-summary__badge">
                  {c.name} 초과
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="monthly-summary__card">
          <h2 className="monthly-summary__card-title">저축·투자</h2>
          <SummaryLine label="계획" value={formatWon(summary.planSaving)} />
          <SummaryLine label="실제" value={formatWon(summary.actualSaving)} emphasize />
          <SummaryLine label="달성률" value={formatPercent(summary.savingAchievementRate)} />
          <SummaryLine label="저축률" value={formatPercent(summary.savingsRate)} />
        </section>

        <section className="monthly-summary__card">
          <h2 className="monthly-summary__card-title">결산 메모 (선택)</h2>
          <textarea
            className="monthly-summary__note"
            value={closingNote}
            onChange={(e) => setClosingNote(e.target.value)}
            onBlur={handleClosingNoteBlur}
            placeholder="이번 달을 돌아보며 메모를 남겨보세요."
            rows={3}
          />
        </section>
      </div>
    </div>
  )
}

function SummaryLine({
  label,
  value,
  emphasize,
}: {
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <div className="monthly-summary__line">
      <span className="monthly-summary__label">{label}</span>
      <span className={emphasize ? 'monthly-summary__value--emphasize' : undefined}>{value}</span>
    </div>
  )
}
