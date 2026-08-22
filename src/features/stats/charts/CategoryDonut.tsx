import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatWon } from '../../../utils/date'
import { formatPercent } from '../../../utils/format'
import { CHART_TOOLTIP_STYLE } from './chartTheme'
import './CategoryDonut.css'

export interface DonutSlice {
  label: string
  amount: number
  color: string
  percentageOfTotal: number | null
}

interface CategoryDonutProps {
  slices: DonutSlice[]
}

// 비중을 보여줄 때만 제한적으로 쓰는 도넛 차트 (§9). 색만으로 식별하지 않도록
// 옆에 이름·금액·비율을 항상 함께 표시한다.
export function CategoryDonut({ slices }: CategoryDonutProps) {
  return (
    <div className="category-donut">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="amount"
            nameKey="label"
            innerRadius={40}
            outerRadius={65}
            paddingAngle={2}
            stroke="#fbf7ec"
            strokeWidth={2}
          >
            {slices.map((slice) => (
              <Cell key={slice.label} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => formatWon(Number(value))}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="category-donut__legend">
        {slices.map((slice) => (
          <li key={slice.label} className="category-donut__legend-item">
            <span className="category-donut__dot" style={{ backgroundColor: slice.color }} />
            <span className="category-donut__legend-label">{slice.label}</span>
            <span className="category-donut__legend-value">
              {formatWon(slice.amount)} ({formatPercent(slice.percentageOfTotal)})
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
