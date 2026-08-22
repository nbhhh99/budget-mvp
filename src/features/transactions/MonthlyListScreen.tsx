import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { MonthPicker } from '../../components/MonthPicker'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { categoriesRepo, transactionsRepo } from '../../db'
import type { Category, Transaction, TransactionType } from '../../types/models'
import { TRANSACTION_TYPE_LABEL } from '../../types/models'
import { sumByType } from '../../domain'
import { currentYearMonth, formatDateWithWeekday, formatWon } from '../../utils/date'
import { useDeleteTransactionWithUndo } from './useDeleteTransactionWithUndo'
import './MonthlyListScreen.css'

type SortOrder = 'latest' | 'oldest'
type TypeFilter = TransactionType | 'all'

const TYPE_FILTERS: TypeFilter[] = ['all', 'income', 'expense', 'saving', 'transfer']

export function MonthlyListScreen() {
  const navigate = useNavigate()
  const [yearMonth, setYearMonth] = useState(currentYearMonth())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loaded, setLoaded] = useState(false)

  const [sortOrder, setSortOrder] = useState<SortOrder>('latest')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const deleteWithUndo = useDeleteTransactionWithUndo(() => setRefreshKey((k) => k + 1))

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoaded(false)
      const [monthTransactions, allCategories] = await Promise.all([
        transactionsRepo.getTransactionsByMonth(yearMonth),
        categoriesRepo.getAllCategories(),
      ])
      if (cancelled) return
      setTransactions(monthTransactions)
      setCategories(allCategories)
      setLoaded(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [yearMonth, refreshKey])

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const paymentMethods = useMemo(() => {
    const set = new Set<string>()
    for (const t of transactions) {
      if (t.paymentMethod) set.add(t.paymentMethod)
    }
    return [...set].sort()
  }, [transactions])

  const filteredCategories = useMemo(() => {
    if (typeFilter === 'all') return categories
    return categories.filter((c) => c.group === typeFilter)
  }, [categories, typeFilter])

  const visibleTransactions = useMemo(() => {
    const filtered = transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (categoryFilter !== 'all' && t.categoryId !== categoryFilter) return false
      if (paymentMethodFilter !== 'all' && (t.paymentMethod ?? '') !== paymentMethodFilter)
        return false
      if (search && !(t.memo ?? '').toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    const sorted = [...filtered].sort((a, b) => {
      const cmp = `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)
      return sortOrder === 'latest' ? -cmp : cmp
    })
    return sorted
  }, [transactions, typeFilter, categoryFilter, paymentMethodFilter, search, sortOrder])

  const groupedByDate = useMemo(() => {
    const groups: { date: string; items: Transaction[] }[] = []
    for (const t of visibleTransactions) {
      const last = groups[groups.length - 1]
      if (last && last.date === t.date) {
        last.items.push(t)
      } else {
        groups.push({ date: t.date, items: [t] })
      }
    }
    return groups
  }, [visibleTransactions])

  const totals = useMemo(
    () => ({
      income: sumByType(transactions, 'income'),
      expense: sumByType(transactions, 'expense'),
      saving: sumByType(transactions, 'saving'),
    }),
    [transactions],
  )

  function handleTypeFilterChange(next: TypeFilter) {
    setTypeFilter(next)
    setCategoryFilter('all')
  }

  return (
    <div className="monthly-list">
      <ScreenHeader title="월별 내역" />
      <MonthPicker yearMonth={yearMonth} onChange={setYearMonth} />

      <div className="monthly-list__filters">
        <div className="monthly-list__type-filters">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              type="button"
              className={`monthly-list__chip${typeFilter === t ? ' monthly-list__chip--active' : ''}`}
              onClick={() => handleTypeFilterChange(t)}
            >
              {t === 'all' ? '전체' : TRANSACTION_TYPE_LABEL[t]}
            </button>
          ))}
        </div>

        <div className="monthly-list__row">
          <select
            className="monthly-list__select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="분류 필터"
          >
            <option value="all">분류 전체</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="monthly-list__select"
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            aria-label="결제수단 필터"
          >
            <option value="all">결제수단 전체</option>
            {paymentMethods.map((pm) => (
              <option key={pm} value={pm}>
                {pm}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="monthly-list__sort"
            onClick={() => setSortOrder((o) => (o === 'latest' ? 'oldest' : 'latest'))}
          >
            {sortOrder === 'latest' ? '최신순' : '오래된순'}
          </button>
        </div>

        <input
          className="monthly-list__search"
          type="search"
          placeholder="메모 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="monthly-list__body">
        {loaded && groupedByDate.length === 0 && (
          <p className="monthly-list__empty">이 달에는 조건에 맞는 거래 내역이 없습니다.</p>
        )}

        {groupedByDate.map((group) => (
          <section key={group.date} className="monthly-list__date-group">
            <h2 className="monthly-list__date-header">{formatDateWithWeekday(group.date)}</h2>
            {group.items.map((t) => {
              const category = categoryMap.get(t.categoryId)
              const sign = t.type === 'income' ? '+' : t.type === 'transfer' ? '' : '-'
              return (
                <div key={t.id} className="monthly-list__item">
                  <button
                    type="button"
                    className="monthly-list__item-main"
                    onClick={() => navigate(`/transactions/${t.id}/edit`)}
                  >
                    <span
                      className="monthly-list__dot"
                      style={{ backgroundColor: category?.color ?? '#ccc' }}
                    />
                    <span className="monthly-list__item-info">
                      <span className="monthly-list__item-category">
                        {category?.name ?? '미분류'}
                      </span>
                      {(t.memo || t.paymentMethod) && (
                        <span className="monthly-list__item-sub">
                          {[t.paymentMethod, t.memo].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </span>
                    <span
                      className={`monthly-list__item-amount monthly-list__item-amount--${t.type}`}
                    >
                      {sign}
                      {formatWon(t.amount)}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="monthly-list__delete"
                    aria-label="삭제"
                    onClick={() => setPendingDeleteId(t.id)}
                  >
                    삭제
                  </button>
                </div>
              )
            })}
          </section>
        ))}
      </div>

      <div className="monthly-list__totals">
        <span>
          수입 <strong>{formatWon(totals.income)}</strong>
        </span>
        <span>
          지출 <strong>{formatWon(totals.expense)}</strong>
        </span>
        <span>
          저축 <strong>{formatWon(totals.saving)}</strong>
        </span>
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="이 거래를 삭제할까요?"
        message="삭제 후에는 잠시 동안 실행취소할 수 있습니다."
        confirmLabel="삭제"
        danger
        onConfirm={() => {
          if (pendingDeleteId) deleteWithUndo(pendingDeleteId)
          setPendingDeleteId(null)
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
