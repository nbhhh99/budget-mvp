import { formatKoreanYearMonth, shiftYearMonth } from '../utils/date'
import './MonthPicker.css'

interface MonthPickerProps {
  yearMonth: string
  onChange: (yearMonth: string) => void
}

export function MonthPicker({ yearMonth, onChange }: MonthPickerProps) {
  return (
    <div className="month-picker">
      <button
        type="button"
        className="month-picker__nav"
        aria-label="이전 달"
        onClick={() => onChange(shiftYearMonth(yearMonth, -1))}
      >
        ◀
      </button>
      <label className="month-picker__label">
        {formatKoreanYearMonth(yearMonth)}
        <input
          type="month"
          className="month-picker__input"
          value={yearMonth}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          aria-label="연월 선택"
        />
      </label>
      <button
        type="button"
        className="month-picker__nav"
        aria-label="다음 달"
        onClick={() => onChange(shiftYearMonth(yearMonth, 1))}
      >
        ▶
      </button>
    </div>
  )
}
