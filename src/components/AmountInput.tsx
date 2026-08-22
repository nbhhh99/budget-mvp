import type { ChangeEvent } from 'react'
import { parseDigitsToNumber } from '../utils/numberInput'
import './AmountInput.css'

interface AmountInputProps {
  value: number
  onChange: (value: number) => void
  autoFocus?: boolean
  error?: string
}

export function AmountInput({ value, onChange, autoFocus, error }: AmountInputProps) {
  const display = value > 0 ? value.toLocaleString('ko-KR') : ''

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(parseDigitsToNumber(e.target.value))
  }

  return (
    <div className="amount-input">
      <div className={`amount-input__field-wrap${error ? ' amount-input__field-wrap--error' : ''}`}>
        <input
          className="amount-input__field"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="0"
          value={display}
          onChange={handleChange}
          autoFocus={autoFocus}
          aria-label="금액"
        />
        <span className="amount-input__suffix">원</span>
      </div>
      {error && <p className="amount-input__error">{error}</p>}
    </div>
  )
}
