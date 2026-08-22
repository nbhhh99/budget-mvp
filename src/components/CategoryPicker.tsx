import type { Category } from '../types/models'
import './CategoryPicker.css'

interface CategoryPickerProps {
  categories: Category[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function CategoryPicker({ categories, selectedId, onSelect }: CategoryPickerProps) {
  if (categories.length === 0) {
    return (
      <p className="category-picker__empty">사용 가능한 분류가 없습니다. 설정에서 추가해 주세요.</p>
    )
  }

  return (
    <div className="category-picker">
      {categories.map((category) => {
        const selected = category.id === selectedId
        return (
          <button
            key={category.id}
            type="button"
            className={`category-picker__chip${selected ? ' category-picker__chip--selected' : ''}`}
            style={{
              backgroundColor: selected ? category.color : 'var(--color-surface-alt)',
              borderColor: category.color,
            }}
            onClick={() => onSelect(category.id)}
          >
            {category.name}
          </button>
        )
      })}
    </div>
  )
}
