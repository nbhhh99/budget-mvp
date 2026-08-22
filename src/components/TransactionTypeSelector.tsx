import { TRANSACTION_TYPE_LABEL, type TransactionType } from '../types/models'
import './TransactionTypeSelector.css'

const TYPES: TransactionType[] = ['expense', 'income', 'saving', 'transfer']

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
