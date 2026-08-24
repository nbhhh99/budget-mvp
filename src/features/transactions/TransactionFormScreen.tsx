import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { TransactionTypeSelector } from '../../components/TransactionTypeSelector'
import { AmountInput } from '../../components/AmountInput'
import { CategoryPicker } from '../../components/CategoryPicker'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/toast/useToast'
import { categoriesRepo, settingsRepo, transactionsRepo } from '../../db'
import type { Category, TransactionType } from '../../types/models'
import { TRANSACTION_TYPE_TO_GROUP } from '../../types/models'
import { todayDateString, nowTimeString } from '../../utils/date'
import { useDeleteTransactionWithUndo } from './useDeleteTransactionWithUndo'
import './TransactionFormScreen.css'

interface NavPreset {
  presetType?: TransactionType
  presetCategoryId?: string
}

export function TransactionFormScreen() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const preset = (location.state as NavPreset | null) ?? null
  const isEditMode = Boolean(id)
  const { showToast } = useToast()
  const deleteWithUndo = useDeleteTransactionWithUndo()

  const [loaded, setLoaded] = useState(false)
  const [type, setType] = useState<TransactionType>(preset?.presetType ?? 'expense')
  const [amount, setAmount] = useState(0)
  const [categoryId, setCategoryId] = useState<string | null>(preset?.presetCategoryId ?? null)
  const [date, setDate] = useState(todayDateString())
  const [time, setTime] = useState(nowTimeString())
  const [memo, setMemo] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')

  const [categories, setCategories] = useState<Category[]>([])
  const [largeAmountThreshold, setLargeAmountThreshold] = useState(1_000_000)
  const [errors, setErrors] = useState<{ amount?: string; category?: string }>({})
  const [confirmLargeAmount, setConfirmLargeAmount] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  const group = useMemo(() => TRANSACTION_TYPE_TO_GROUP[type], [type])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const settings = await settingsRepo.getSettings()
      if (cancelled) return
      setLargeAmountThreshold(settings.largeAmountThreshold)

      if (isEditMode && id) {
        const existing = await transactionsRepo.getTransaction(id)
        if (existing && !cancelled) {
          setType(existing.type)
          setAmount(existing.amount)
          setCategoryId(existing.categoryId)
          setDate(existing.date)
          setTime(existing.time)
          setMemo(existing.memo ?? '')
          setPaymentMethod(existing.paymentMethod ?? '')
        }
      } else if (
        !preset?.presetType &&
        settings.lastUsedTransactionType &&
        settings.lastUsedTransactionType !== 'transfer'
      ) {
        setType(settings.lastUsedTransactionType)
      }
      if (!cancelled) setLoaded(true)
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    let cancelled = false
    async function loadCategories() {
      // 숨김 카테고리도 함께 불러온다 — 수정 중인 거래에 이미 연결된 분류가
      // 그 사이 숨김 처리되었더라도 선택값이 사라지지 않도록 하기 위함 (아래에서 화면에는 필터링해 보여준다).
      const list = await categoriesRepo.getCategoriesByGroup(group, { includeHidden: true })
      if (cancelled) return
      setCategories(list)
      setCategoryId((current) => (current && list.some((c) => c.id === current) ? current : null))
    }
    loadCategories()
    return () => {
      cancelled = true
    }
  }, [group])

  const visibleCategories = useMemo(
    () => categories.filter((c) => !c.hidden || c.id === categoryId),
    [categories, categoryId],
  )

  function validate(): boolean {
    const nextErrors: typeof errors = {}
    if (amount <= 0) nextErrors.amount = '금액을 입력해 주세요.'
    if (!categoryId) nextErrors.category = '분류를 선택해 주세요.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function persist() {
    if (!categoryId) return
    setSaving(true)
    try {
      if (isEditMode && id) {
        await transactionsRepo.updateTransaction(id, {
          type,
          amount,
          categoryId,
          date,
          time,
          memo: memo || undefined,
          paymentMethod: paymentMethod || undefined,
        })
        await settingsRepo.updateSettings({ lastUsedTransactionType: type })
        showToast({ message: '수정되었습니다.' })
        navigate('/transactions')
      } else {
        await transactionsRepo.createTransaction({
          type,
          amount,
          categoryId,
          date,
          time,
          memo: memo || undefined,
          paymentMethod: paymentMethod || undefined,
        })
        await settingsRepo.updateSettings({ lastUsedTransactionType: type })
        showToast({
          message: '저장되었습니다.',
          actionLabel: '계속 입력',
          onAction: () => {
            navigate('/transactions/new', {
              state: { presetType: type, presetCategoryId: categoryId },
            })
          },
          durationMs: 4000,
        })
        navigate('/')
      }
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit() {
    if (!validate()) return
    if (amount > largeAmountThreshold) {
      setConfirmLargeAmount(true)
      return
    }
    persist()
  }

  async function handleDelete() {
    if (!id) return
    setConfirmDelete(false)
    await deleteWithUndo(id)
    navigate('/transactions')
  }

  if (!loaded) {
    return (
      <div>
        <ScreenHeader title={isEditMode ? '거래 수정' : '수입·지출 입력'} />
      </div>
    )
  }

  return (
    <div className="transaction-form">
      <ScreenHeader title={isEditMode ? '거래 수정' : '수입·지출 입력'} />

      <div className="transaction-form__body">
        <TransactionTypeSelector value={type} onChange={setType} />

        <AmountInput
          value={amount}
          onChange={setAmount}
          autoFocus={!isEditMode}
          error={errors.amount}
        />

        <section className="transaction-form__section">
          <h2 className="transaction-form__label">분류</h2>
          <CategoryPicker
            categories={visibleCategories}
            selectedId={categoryId}
            onSelect={setCategoryId}
          />
          {errors.category && <p className="transaction-form__error">{errors.category}</p>}
        </section>

        <section className="transaction-form__section transaction-form__datetime">
          <label className="transaction-form__field">
            <span className="transaction-form__label">날짜</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="transaction-form__field">
            <span className="transaction-form__label">시간</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </section>

        <label className="transaction-form__field">
          <span className="transaction-form__label">메모 (선택)</span>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="예: 점심 식사"
          />
        </label>

        <label className="transaction-form__field">
          <span className="transaction-form__label">결제수단 (선택)</span>
          <input
            type="text"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            placeholder="예: 카드, 현금"
          />
        </label>
      </div>

      <div className="transaction-form__footer">
        {isEditMode && (
          <button
            type="button"
            className="transaction-form__delete"
            onClick={() => setConfirmDelete(true)}
          >
            삭제
          </button>
        )}
        <button
          type="button"
          className="transaction-form__submit"
          onClick={handleSubmit}
          disabled={saving}
        >
          저장
        </button>
      </div>

      <ConfirmDialog
        open={confirmLargeAmount}
        title="큰 금액이에요"
        message={`${amount.toLocaleString('ko-KR')}원을 저장할까요?`}
        confirmLabel="저장"
        onConfirm={() => {
          setConfirmLargeAmount(false)
          persist()
        }}
        onCancel={() => setConfirmLargeAmount(false)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="이 거래를 삭제할까요?"
        message="삭제 후에는 잠시 동안 실행취소할 수 있습니다."
        confirmLabel="삭제"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
