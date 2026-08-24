import { TRANSACTION_TYPE_LABEL, type TransactionType } from '../types/models'
import './TransactionTypeSelector.css'

// 계좌 간 이체는 새 거래 입력 화면에서는 더 이상 선택지로 제공하지 않는다.
// 과거에 기록된 이체 거래는 카테고리 관리·월별 내역·통계에서는 그대로 유지된다.
const TYPES: TransactionType[] = ['expense', 'income', 'saving']

interface TransactionTypeSelectorProps {
  value: TransactionType
  onChange: (type: TransactionType) => void
}

export function TransactionTypeSelector({ value, onChange }: TransactionTypeSelectorProps) {
  return (
    <div className="type-selector">
      {TYPES.map((type) => (
        <button
          key={type}
          type="button"
          className={`type-selector__button type-selector__button--${type}${
            value === type ? ' type-selector__button--active' : ''
          }`}
          onClick={() => onChange(type)}
        >
          {TRANSACTION_TYPE_LABEL[type]}
        </button>
      ))}
    </div>
  )
}
