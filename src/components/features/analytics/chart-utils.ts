import type { ChartSize } from '@/sdk/interfaces/plugin.interface'

/**
 * Get default size based on chart type
 */
export function getDefaultSize(chartType: string): ChartSize {
  switch (chartType) {
    case 'metric':
      return 'small'
    case 'streak':
    case 'pie':
      return 'medium'
    case 'line':
    case 'bar':
    case 'heatmap':
    default:
      return 'large'
  }
}

/**
 * Get grid class based on size
 */
export function getSizeClass(size: ChartSize): string {
  switch (size) {
    case 'small':
      return 'col-span-1'
    case 'medium':
      return 'col-span-1 md:col-span-2'
    case 'large':
      return 'col-span-1 md:col-span-2 lg:col-span-4'
  }
}
