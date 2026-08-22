import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompactWon } from '../../../utils/format'
import { formatWon } from '../../../utils/date'
import { CHART_GRID_STROKE, CHART_TICK_STYLE, CHART_TOOLTIP_STYLE } from './chartTheme'

export interface RankedBarDatum {
  label: string
  amount: number
}

interface RankedBarChartProps {
  data: RankedBarDatum[]
  color: string
  height?: number
}

// 카테고리 이름을 막대 옆에 직접 표기하므로(길이=값), 색은 단일 색상 하나만 사용한다.
export function RankedBarChart({ data, color, height }: RankedBarChartProps) {
  const chartHeight = height ?? Math.max(120, data.length * 36)

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke={CHART_GRID_STROKE} />
        <XAxis
          type="number"
          tickFormatter={formatCompactWon}
          tick={CHART_TICK_STYLE}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={76}
          tick={CHART_TICK_STYLE}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          formatter={(value) => formatWon(Number(value))}
          labelFormatter={(label) => label}
        />
        <Bar dataKey="amount" fill={color} radius={[0, 4, 4, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  )
}
