import { useState, type ChangeEvent } from 'react'
import { parseDigitsToNumber } from '../utils/numberInput'
import './InlineAmountField.css'

interface InlineAmountFieldProps {
  value: number
  onCommit: (value: number) => void
  placeholder?: string
}

// 매 입력마다 저장하지 않고 blur 시점에만 커밋한다 (예산 항목이 많을 때 잦은 쓰기 방지).
// value가 외부(월 변경, 지난달 복사 등)에서 바뀌면 초안을 다시 맞춰야 하므로,
// 호출부에서 그 시점에 바뀌는 값을 key로 넘겨 컴포넌트를 재마운트시키는 방식을 사용한다.
export function InlineAmountField({
  value,
  onCommit,
  placeholder = '미설정',
}: InlineAmountFieldProps) {
  const [draft, setDraft] = useState(value > 0 ? String(value) : '')

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const parsed = parseDigitsToNumber(e.target.value)
    setDraft(parsed > 0 ? String(parsed) : '')
  }

  function handleBlur() {
    const parsed = parseDigitsToNumber(draft)
    if (parsed !== value) onCommit(parsed)
  }

  return (
    <div className="inline-amount-field">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-label="계획 금액"
      />
      <span className="inline-amount-field__suffix">원</span>
    </div>
  )
}
