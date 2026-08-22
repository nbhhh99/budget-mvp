import { useEffect, useMemo, useState } from 'react'
import { ScreenHeader } from '../../components/ScreenHeader'
import { ColorSwatchPicker } from '../../components/ColorSwatchPicker'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/toast/useToast'
import { categoriesRepo } from '../../db'
import type { Category, CategoryGroup } from '../../types/models'
import { CATEGORY_PALETTE } from '../../constants/palette'
import './CategoryManagementScreen.css'

const GROUPS: CategoryGroup[] = ['expense', 'income', 'saving', 'transfer']
const GROUP_LABEL: Record<CategoryGroup, string> = {
  income: '수입',
  expense: '생활비 지출',
  saving: '저축·투자',
  transfer: '계좌 간 이체',
}

type EditorState = { mode: 'new' } | { mode: 'edit'; category: Category } | null

export function CategoryManagementScreen() {
  const { showToast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [group, setGroup] = useState<CategoryGroup>('expense')
  const [loaded, setLoaded] = useState(false)
  const [editor, setEditor] = useState<EditorState>(null)
  const [showHidden, setShowHidden] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState<Category | null>(null)

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

  async function handleSave(input: { name: string; color: string }) {
    if (editor?.mode === 'edit') {
      await categoriesRepo.updateCategory(editor.category.id, {
        name: input.name,
        color: input.color,
      })
    } else {
      await categoriesRepo.addCategory({ group, name: input.name, color: input.color })
    }
    setEditor(null)
    refresh()
  }

  async function handleDelete() {
    if (!deleteCandidate) return
    const deleted = await categoriesRepo.deleteCategoryIfUnused(deleteCandidate.id)
    setDeleteCandidate(null)
    if (deleted) {
      showToast({ message: '삭제되었습니다.' })
      refresh()
    } else {
      showToast({ message: '이미 사용된 분류라 삭제할 수 없어요. 숨김 상태로 유지됩니다.' })
    }
  }

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
                  initialName={category.name}
                  initialColor={category.color}
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
        message="이 분류를 사용한 거래나 예산이 있으면 삭제할 수 없습니다."
        confirmLabel="삭제"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteCandidate(null)}
      />
    </div>
  )
}

function CategoryEditorForm({
  initialName,
  initialColor,
  onSave,
  onCancel,
}: {
  initialName: string
  initialColor: string
  onSave: (input: { name: string; color: string }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState(initialColor)

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
      <div className="category-editor__actions">
        <button type="button" className="category-editor__cancel" onClick={onCancel}>
          취소
        </button>
        <button
          type="button"
          className="category-editor__save"
          disabled={!name.trim()}
          onClick={() => onSave({ name: name.trim(), color })}
        >
          저장
        </button>
      </div>
    </div>
  )
}
