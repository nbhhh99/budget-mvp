import type { CSSProperties } from 'react'

// Recharts에 공통으로 쓰는 스타일 값. dataviz 스킬 가이드의 mark spec(얇은 막대/선, 은은한 격자선)을 따른다.
export const CHART_GRID_STROKE = '#eee3cb'
export const CHART_AXIS_STROKE = '#c9c2af'
export const CHART_TICK_STYLE = { fontSize: 11, fill: '#7a7468' }
export const CHART_TOOLTIP_STYLE: CSSProperties = {
  fontSize: '0.8rem',
  borderRadius: 10,
  border: '1px solid #eee3cb',
  backgroundColor: '#ffffff',
  boxShadow: '0 2px 8px rgba(51,48,42,0.12)',
}
export const BAR_SIZE = 20
export const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0]
