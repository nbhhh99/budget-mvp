import { useState, type FormEvent } from 'react'
import { MAX_HOUSEHOLD_NAME_LENGTH } from '../domain'
import './HouseholdNameSheet.css'

interface HouseholdNameSheetProps {
  open: boolean
  initialValue: string
  onSave: (value: string) => void
  onCancel: () => void
}

// 모바일에서는 바텀시트, 화면이 넓으면(데스크톱) 같은 마크업이 중앙 카드처럼 보이도록
// CSS에서만 위치를 바꾼다. open이 false면 언마운트되므로, 다시 열릴 때마다 initialValue로
// 새로 시작한다(별도 useEffect 동기화 없이).
export function HouseholdNameSheet({ open, initialValue, onSave, onCancel }: HouseholdNameSheetProps) {
  const [value, setValue] = useState(initialValue)

  if (!open) return null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave(value)
  }

  return (
    <div className="household-name-sheet__backdrop" role="presentation" onClick={onCancel}>
      <form
        className="household-name-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="가계부 이름 설정"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <span className="household-name-sheet__grip" aria-hidden="true" />
        <h2 className="household-name-sheet__title">가계부 이름</h2>
        <label className="household-name-sheet__field">
          <span className="household-name-sheet__label">가계부 이름</span>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, MAX_HOUSEHOLD_NAME_LENGTH))}
            placeholder="민지의 가계부"
            maxLength={MAX_HOUSEHOLD_NAME_LENGTH}
            autoFocus
            aria-label="가계부 이름"
          />
        </label>
        <p className="household-name-sheet__hint">최대 {MAX_HOUSEHOLD_NAME_LENGTH}자까지 입력할 수 있어요.</p>
        <div className="household-name-sheet__actions">
          <button type="button" className="household-name-sheet__cancel" onClick={onCancel}>
            취소
          </button>
          <button type="submit" className="household-name-sheet__save">
            저장
          </button>
        </div>
      </form>
    </div>
  )
}
