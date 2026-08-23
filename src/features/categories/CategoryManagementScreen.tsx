import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { ColorSwatchPicker } from '../../components/ColorSwatchPicker'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/toast/useToast'
import { categoriesRepo } from '../../db'
import type { AssetType, Category, CategoryGroup } from '../../types/models'
import { CATEGORY_PALETTE } from '../../constants/palette'
import './CategoryManagementScreen.css'

const GROUPS: CategoryGroup[] = ['expense', 'income', 'saving', 'transfer']
const GROUP_LABEL: Record<CategoryGroup, string> = {
  income: '수입',
  expense: '생활비 지출',
  saving: '저축·투자',
  transfer: '계좌 간 이체',
}

// 재무 브리핑(§4) 개인화용 자산 유형. 그룹별로 의미 있는 선택지만 보여준다.
const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  cash_deposit: '현금·예금',
  savings: '적금',
  domestic_stock: '국내 주식',
  foreign_stock: '해외 주식',
  etf: 'ETF',
  bond: '채권',
  pension: '연금',
  real_estate: '부동산',
  foreign_currency: '외화',
  crypto: '가상자산',
  debt: '대출·부채',
  other: '기타',
}
const SAVING_ASSET_TYPES: AssetType[] = [
  'cash_deposit',
  'savings',
  'domestic_stock',
  'foreign_stock',
  'etf',
  'bond',
  'pension',
  'real_estate',
  'foreign_currency',
  'crypto',
  'other',
]
const EXPENSE_ASSET_TYPES: AssetType[] = ['debt']

type EditorState = { mode: 'new' } | { mode: 'edit'; category: Category } | null

function isCategoryGroup(value: string | null): value is CategoryGroup {
  return value !== null && (GROUPS as string[]).includes(value)
}

export function CategoryManagementScreen() {
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const initialGroup = searchParams.get('group')
  const [group, setGroup] = useState<CategoryGroup>(
    isCategoryGroup(initialGroup) ? initialGroup : 'expense',
  )
  const [loaded, setLoaded] = useState(false)
  const [editor, setEditor] = useState<EditorState>(null)
  const [showHidden, setShowHidden] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState<Category | null>(null)
  const [mergeCandidate, setMergeCandidate] = useState<Category | null>(null)
  const [mergeTargetId, setMergeTargetId] = useState('')
  const [merging, setMerging] = useState(false)

  async function refresh() {
    setCategories(await categoriesRepo.getAllCategories())
    setLoaded(true)
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      const list = await categoriesRepo.getAllCategories()
      if (cancelled) return
      setCategories(list)
      setLoaded(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const groupCategories = useMemo(
    () => categories.filter((c) => c.group === group).sort((a, b) => a.order - b.order),
    [categories, group],
  )
  const visible = groupCategories.filter((c) => !c.hidden)
  const hidden = groupCategories.filter((c) => c.hidden)

  async function move(category: Category, direction: -1 | 1) {
    const idx = visible.findIndex((c) => c.id === category.id)
    const swapIdx = idx + direction
    if (swapIdx < 0 || swapIdx >= visible.length) return
    const reordered = [...visible]
    ;[reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]]
    await categoriesRepo.reorderCategories(reordered.map((c) => c.id))
    refresh()
  }

  async function toggleHidden(category: Category) {
    await categoriesRepo.setCategoryHidden(category.id, !category.hidden)
    refresh()
  }

  async function handleSave(input: { name: string; color: string; assetType?: AssetType }) {
    if (editor?.mode === 'edit') {
      await categoriesRepo.updateCategory(editor.category.id, {
        name: input.name,
        color: input.color,
      })
      await categoriesRepo.setCategoryAssetType(editor.category.id, input.assetType)
    } else {
      const created = await categoriesRepo.addCategory({
        group,
        name: input.name,
        color: input.color,
      })
      if (input.assetType) {
        await categoriesRepo.setCategoryAssetType(created.id, input.assetType)
      }
    }
    setEditor(null)
    refresh()
  }

  async function handleDelete() {
    if (!deleteCandidate) return
    const candidate = deleteCandidate
    const deleted = await categoriesRepo.deleteCategoryIfUnused(candidate.id)
    setDeleteCandidate(null)
    if (deleted) {
      showToast({ message: '삭제되었습니다.' })
      refresh()
    } else {
      setMergeTargetId('')
      setMergeCandidate(candidate)
    }
  }

  async function handleMergeConfirm() {
    if (!mergeCandidate || !mergeTargetId) return
    setMerging(true)
    try {
      await categoriesRepo.mergeAndDeleteCategory(mergeCandidate.id, mergeTargetId)
      setMergeCandidate(null)
      showToast({ message: '다른 분류로 합치고 삭제했습니다.' })
      refresh()
    } finally {
      setMerging(false)
    }
  }

  const mergeTargets = mergeCandidate
    ? categories
        .filter((c) => c.group === mergeCandidate.group && c.id !== mergeCandidate.id)
        .sort((a, b) => a.order - b.order)
    : []

  return (
    <div className="category-mgmt">
      <ScreenHeader title="분류 관리" />

      <div className="category-mgmt__tabs">
        {GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            className={`category-mgmt__tab${group === g ? ' category-mgmt__tab--active' : ''}`}
            onClick={() => {
              setGroup(g)
              setEditor(null)
              setShowHidden(false)
            }}
          >
            {GROUP_LABEL[g]}
          </button>
        ))}
      </div>

      <div className="category-mgmt__body">
        {loaded && visible.length === 0 && (
          <p className="category-mgmt__empty">아직 분류가 없습니다. 아래에서 추가해 주세요.</p>
        )}

        <ul className="category-mgmt__list">
          {visible.map((category, index) => (
            <li key={category.id} className="category-mgmt__row">
              {editor?.mode === 'edit' && editor.category.id === category.id ? (
                <CategoryEditorForm
                  group={group}
                  initialName={category.name}
                  initialColor={category.color}
                  initialAssetType={category.assetType}
                  onSave={handleSave}
                  onCancel={() => setEditor(null)}
                />
              ) : (
                <>
                  <span
                    className="category-mgmt__dot"
                    style={{ backgroundColor: category.color }}
                  />
                  <button
                    type="button"
                    className="category-mgmt__name"
                    onClick={() => setEditor({ mode: 'edit', category })}
                  >
                    {category.name}
                  </button>
                  <div className="category-mgmt__row-actions">
                    <button
                      type="button"
                      className="category-mgmt__icon-button"
                      aria-label="위로 이동"
                      disabled={index === 0}
                      onClick={() => move(category, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="category-mgmt__icon-button"
                      aria-label="아래로 이동"
                      disabled={index === visible.length - 1}
                      onClick={() => move(category, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="category-mgmt__icon-button"
                      onClick={() => toggleHidden(category)}
                    >
                      숨기기
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>

        {editor?.mode === 'new' ? (
          <div className="category-mgmt__new-form">
            <CategoryEditorForm
              group={group}
              initialName=""
              initialColor={CATEGORY_PALETTE[visible.length % CATEGORY_PALETTE.length]}
              onSave={handleSave}
              onCancel={() => setEditor(null)}
            />
          </div>
        ) : (
          <button
            type="button"
            className="category-mgmt__add"
            onClick={() => setEditor({ mode: 'new' })}
          >
            + 새 분류 추가
          </button>
        )}

        {hidden.length > 0 && (
          <div className="category-mgmt__hidden-section">
            <button
              type="button"
              className="category-mgmt__hidden-toggle"
              onClick={() => setShowHidden((s) => !s)}
            >
              숨긴 분류 {hidden.length}개 {showHidden ? '접기' : '보기'}
            </button>
            {showHidden && (
              <ul className="category-mgmt__list">
                {hidden.map((category) => (
                  <li key={category.id} className="category-mgmt__row category-mgmt__row--hidden">
                    <span
                      className="category-mgmt__dot"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="category-mgmt__name category-mgmt__name--static">
                      {category.name}
                    </span>
                    <div className="category-mgmt__row-actions">
                      <button
                        type="button"
                        className="category-mgmt__icon-button"
                        onClick={() => toggleHidden(category)}
                      >
                        보이기
                      </button>
                      <button
                        type="button"
                        className="category-mgmt__icon-button category-mgmt__icon-button--danger"
                        onClick={() => setDeleteCandidate(category)}
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteCandidate !== null}
        title="이 분류를 삭제할까요?"
        message="이 분류를 사용한 거래나 예산이 있으면, 다른 분류로 합친 뒤 삭제할 수 있도록 다음 단계로 안내합니다."
        confirmLabel="삭제"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteCandidate(null)}
      />

      {mergeCandidate && (
        <div
          className="confirm-dialog__backdrop"
          role="presentation"
          onClick={() => !merging && setMergeCandidate(null)}
        >
          <div
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-label="다른 분류로 합치고 삭제"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="confirm-dialog__title">"{mergeCandidate.name}"은 사용 중이에요</h2>
            <p className="confirm-dialog__message">
              이미 사용된 분류라 바로 삭제할 수 없어요. 대신 이 분류를 쓴 거래·예산을 다른 분류로
              옮기고 나서 삭제할 수 있어요.
            </p>
            {mergeTargets.length === 0 ? (
              <p className="confirm-dialog__message">
                합칠 수 있는 다른 {GROUP_LABEL[mergeCandidate.group]} 분류가 없어요.
              </p>
            ) : (
              <select
                className="category-merge__select"
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value)}
              >
                <option value="">합칠 분류 선택</option>
                {mergeTargets.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.hidden ? ' (숨김)' : ''}
                  </option>
                ))}
              </select>
            )}
            <div className="confirm-dialog__actions">
              <button
                type="button"
                className="confirm-dialog__button"
                disabled={merging}
                onClick={() => setMergeCandidate(null)}
              >
                취소
              </button>
              <button
                type="button"
                className="confirm-dialog__button confirm-dialog__button--danger"
                disabled={!mergeTargetId || merging}
                onClick={handleMergeConfirm}
              >
                {merging ? '합치는 중…' : '합치고 삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryEditorForm({
  group,
  initialName,
  initialColor,
  initialAssetType,
  onSave,
  onCancel,
}: {
  group: CategoryGroup
  initialName: string
  initialColor: string
  initialAssetType?: AssetType
  onSave: (input: { name: string; color: string; assetType?: AssetType }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState(initialColor)
  const [assetType, setAssetType] = useState<AssetType | ''>(initialAssetType ?? '')

  const assetTypeOptions =
    group === 'saving' ? SAVING_ASSET_TYPES : group === 'expense' ? EXPENSE_ASSET_TYPES : []

  return (
    <div className="category-editor">
      <input
        className="category-editor__name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="분류 이름"
        autoFocus
      />
      <ColorSwatchPicker value={color} onChange={setColor} />
      {assetTypeOptions.length > 0 && (
        <label className="category-editor__asset-type">
          <span>재무 브리핑 자산 유형 (선택)</span>
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value as AssetType | '')}
          >
            <option value="">지정 안 함</option>
            {assetTypeOptions.map((type) => (
              <option key={type} value={type}>
                {ASSET_TYPE_LABEL[type]}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="category-editor__actions">
        <button type="button" className="category-editor__cancel" onClick={onCancel}>
          취소
        </button>
        <button
          type="button"
          className="category-editor__save"
          disabled={!name.trim()}
          onClick={() =>
            onSave({ name: name.trim(), color, assetType: assetType === '' ? undefined : assetType })
          }
        >
          저장
        </button>
      </div>
    </div>
  )
}
