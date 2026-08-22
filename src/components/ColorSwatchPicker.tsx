import { CATEGORY_PALETTE } from '../constants/palette'
import './ColorSwatchPicker.css'

interface ColorSwatchPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorSwatchPicker({ value, onChange }: ColorSwatchPickerProps) {
  return (
    <div className="color-swatch-picker" role="group" aria-label="색상 선택">
      {CATEGORY_PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          className={`color-swatch-picker__swatch${color === value ? ' color-swatch-picker__swatch--selected' : ''}`}
          style={{ backgroundColor: color }}
          aria-label={color}
          aria-pressed={color === value}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  )
}
