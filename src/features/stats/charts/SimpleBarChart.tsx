import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCompactWon } from '../../../utils/format'
import { formatWon } from '../../../utils/date'
import { CHART_GRID_STROKE, CHART_TICK_STYLE, CHART_TOOLTIP_STYLE } from './chartTheme'

export interface BarSeries {
  key: string
  label: string
  color: string
}

interface SimpleBarChartProps {
  data: Record<string, string | number>[]
  series: BarSeries[]
  height?: number
}

export function SimpleBarChart({ data, series, height = 200 }: SimpleBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={CHART_GRID_STROKE} />
        <XAxis dataKey="x" tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={formatCompactWon}
          tick={CHART_TICK_STYLE}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          formatter={(value) => formatWon(Number(value))}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.color}
            radius={[4, 4, 0, 0]}
            barSize={18}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
