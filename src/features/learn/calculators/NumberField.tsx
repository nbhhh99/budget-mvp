import { parseDecimalInput } from '../../../utils/numberInput'
import './NumberField.css'

interface NumberFieldProps {
  label: string
  unit: string
  value: number
  onChange: (value: number) => void
  hint?: string
}

// §12: 입력 필드에 단위와 오류 메시지를 제공한다. 계산기는 값이 잘못돼도 예외를
// 던지지 않고(domain 함수가 안전하게 처리) 항상 결과를 보여주므로, 여기서는
// 참고용 hint만 표시하고 별도의 유효성 오류 상태는 두지 않는다.
export function NumberField({ label, unit, value, onChange, hint }: NumberFieldProps) {
  return (
    <label className="number-field">
      <span className="number-field__label">{label}</span>
      <div className="number-field__input-row">
        <input
          type="text"
          inputMode="decimal"
          value={value === 0 ? '' : String(value)}
          onChange={(e) => onChange(parseDecimalInput(e.target.value))}
          placeholder="0"
          aria-label={`${label} (${unit})`}
        />
        <span className="number-field__unit">{unit}</span>
      </div>
      {hint && <span className="number-field__hint">{hint}</span>}
    </label>
  )
}
