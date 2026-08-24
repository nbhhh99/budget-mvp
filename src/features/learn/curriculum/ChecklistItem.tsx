import { useState } from 'react'
import './ChecklistItem.css'

interface ChecklistItemProps {
  items: string[]
  completed: boolean
  onComplete: () => void
}

// §6: 필수 체크 항목을 모두 확인했을 때 완료로 인정한다. 체크 상태 자체는
// 화면을 벗어나면 초기화되고, "완료했다"는 사실만 learningProgress에 저장된다.
export function ChecklistItem({ items, completed, onComplete }: ChecklistItemProps) {
  const [checked, setChecked] = useState<Set<number>>(() => (completed ? new Set(items.map((_, i) => i)) : new Set()))

  function toggle(index: number) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      if (next.size === items.length && !completed) {
        onComplete()
      }
      return next
    })
  }

  return (
    <div className="checklist-item">
      <ul className="checklist-item__list">
        {items.map((item, i) => {
          const isChecked = checked.has(i)
          return (
            <li key={i}>
              <button
                type="button"
                className={`checklist-item__row${isChecked ? ' checklist-item__row--checked' : ''}`}
                onClick={() => toggle(i)}
                aria-pressed={isChecked}
              >
                <span className="checklist-item__box" aria-hidden="true">
                  {isChecked ? '✓' : ''}
                </span>
                <span>{item}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {(completed || checked.size === items.length) && (
        <p className="checklist-item__done">✓ 모든 항목을 확인했어요</p>
      )}
    </div>
  )
}
