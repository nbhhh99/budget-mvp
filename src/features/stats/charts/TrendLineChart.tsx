import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCompactWon } from '../../../utils/format'
import { formatWon } from '../../../utils/date'
import { CHART_GRID_STROKE, CHART_TICK_STYLE, CHART_TOOLTIP_STYLE } from './chartTheme'

export interface LineSeries {
  key: string
  label: string
  color: string
}

interface TrendLineChartProps {
  data: Record<string, string | number>[]
  series: LineSeries[]
  height?: number
}

export function TrendLineChart({ data, series, height = 200 }: TrendLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
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
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={{ r: 3, fill: s.color }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
