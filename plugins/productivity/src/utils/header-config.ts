import type { HeaderConfig } from '@goal-chaser/sdk'
import type { ProductivityDayData } from '../types'

/**
 * Build header configuration for productivity view
 * Used by both year and month views to ensure consistency
 */
export function buildProductivityHeaderConfig(
  dataToAnalyze: Record<string, ProductivityDayData>,
  viewType: 'year' | 'month',
  onManageAreas: () => void
): HeaderConfig {
  const entries = Object.entries(dataToAnalyze).filter(
    ([, details]) => details.status !== null && details.status !== undefined
  )
  
  const total = entries.length
  const high = entries.filter(([_, d]) => (d.status || 0) >= 7).length
  const average = total > 0
    ? entries.reduce((sum, [_, d]) => sum + (d.status || 0), 0) / total
    : 0
  
  return {
    icon: '📊',
    title: `Productivity ${viewType === 'year' ? 'Year' : 'Month'}:`,
    stats: [
      { label: 'Tracked days', value: total },
      { label: 'High days', value: high, color: '#30D158' },
      { label: 'Average', value: average.toFixed(1), color: '#FF9500' },
    ],
    legends: [
      { label: 'High (7-10)', color: 'rgb(48, 209, 88)' },
      { label: 'OK (4-6)', color: 'rgb(255, 149, 0)' },
      { label: 'Low (1-3)', color: 'rgb(255, 69, 58)' },
    ],
    actions: [
      {
        id: 'manage-areas',
        label: 'Manage Areas',
        icon: '⚙️',
        onClick: onManageAreas,
      },
    ],
  }
}
