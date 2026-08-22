import { MonthPicker } from '../../components/MonthPicker'
import { currentYearMonth, todayDateString } from '../../utils/date'
import type { StatsPeriod } from './period'
import './PeriodSelector.css'

interface PeriodSelectorProps {
  period: StatsPeriod
  onChange: (period: StatsPeriod) => void
}

const PRESETS: { type: StatsPeriod['type']; label: string }[] = [
  { type: 'month', label: '이번 달' },
  { type: 'last3', label: '최근 3개월' },
  { type: 'last6', label: '최근 6개월' },
  { type: 'custom', label: '직접 지정' },
]

export function PeriodSelector({ period, onChange }: PeriodSelectorProps) {
  return (
    <div className="period-selector">
      <div className="period-selector__presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.type}
            type="button"
            className={`period-selector__chip${period.type === preset.type ? ' period-selector__chip--active' : ''}`}
            onClick={() => {
              if (preset.type === 'month')
                onChange({ type: 'month', yearMonth: currentYearMonth() })
              else if (preset.type === 'last3') onChange({ type: 'last3' })
              else if (preset.type === 'last6') onChange({ type: 'last6' })
              else onChange({ type: 'custom', start: todayDateString(), end: todayDateString() })
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {period.type === 'month' && (
        <MonthPicker
          yearMonth={period.yearMonth}
          onChange={(yearMonth) => onChange({ type: 'month', yearMonth })}
        />
      )}

      {period.type === 'custom' && (
        <div className="period-selector__custom">
          <input
            type="date"
            value={period.start}
            onChange={(e) => onChange({ type: 'custom', start: e.target.value, end: period.end })}
          />
          <span>~</span>
          <input
            type="date"
            value={period.end}
            onChange={(e) => onChange({ type: 'custom', start: period.start, end: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}
