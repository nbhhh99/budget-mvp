import { useEffect, useMemo, useState } from 'react'
import { ScreenHeader } from '../../components/ScreenHeader'
import { MonthPicker } from '../../components/MonthPicker'
import { InlineAmountField } from '../../components/InlineAmountField'
import { useToast } from '../../components/toast/useToast'
import { budgetsRepo, categoriesRepo } from '../../db'
import type { Category, CategoryGroup, MonthlyBudget } from '../../types/models'
import { currentYearMonth } from '../../utils/date'
import './BudgetScreen.css'

const SECTIONS: { group: CategoryGroup; label: string }[] = [
  { group: 'expense', label: '생활비 지출 계획' },
  { group: 'income', label: '수입 계획' },
  { group: 'saving', label: '저축·투자 계획' },
]

export function BudgetScreen() {
  const { showToast } = useToast()
  const [yearMonth, setYearMonth] = useState(currentYearMonth())
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([])
  const [loaded, setLoaded] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoaded(false)
      const [allCategories, monthBudgets] = await Promise.all([
        categoriesRepo.getAllCategories(),
        budgetsRepo.getBudgetsForMonth(yearMonth),
      ])
      if (cancelled) return
      setCategories(allCategories.filter((c) => !c.hidden))
      setBudgets(monthBudgets)
      setLoaded(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [yearMonth, refreshKey])

  const planByCategory = useMemo(
    () => new Map(budgets.map((b) => [b.categoryId, b.planAmount])),
    [budgets],
  )

  async function handleCommit(categoryId: string, amount: number) {
    if (amount > 0) {
      await budgetsRepo.upsertBudget(yearMonth, categoryId, amount)
    } else {
      await budgetsRepo.removeBudget(yearMonth, categoryId)
    }
    setRefreshKey((k) => k + 1)
  }

  async function handleCopyPrevious() {
    const count = await budgetsRepo.copyBudgetsFromPreviousMonth(yearMonth)
    showToast({
      message: count > 0 ? `${count}개 항목을 복사했습니다.` : '복사할 지난달 예산이 없습니다.',
    })
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="budget-screen">
      <ScreenHeader title="예산 설정" />
      <MonthPicker yearMonth={yearMonth} onChange={setYearMonth} />

      <div className="budget-screen__body">
        {loaded && budgets.length === 0 && (
          <div className="budget-screen__banner">
            <span>이번 달 예산이 아직 없어요.</span>
            <button type="button" onClick={handleCopyPrevious}>
              지난달 예산 복사
            </button>
          </div>
        )}

        {SECTIONS.map((section) => {
          const sectionCategories = categories
            .filter((c) => c.group === section.group)
            .sort((a, b) => a.order - b.order)
          if (sectionCategories.length === 0) return null

          return (
            <section key={section.group} className="budget-screen__section">
              <h2 className="budget-screen__section-title">{section.label}</h2>
              <ul className="budget-screen__list">
                {sectionCategories.map((category) => (
                  <li key={category.id} className="budget-screen__row">
                    <span
                      className="budget-screen__dot"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="budget-screen__name">{category.name}</span>
                    <InlineAmountField
                      key={`${yearMonth}-${refreshKey}`}
                      value={planByCategory.get(category.id) ?? 0}
                      onCommit={(amount) => handleCommit(category.id, amount)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
