'use client'

/**
 * Pie Chart Component
 * For distributions and proportions
 */

export interface PieChartProps {
  title?: string
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  size?: number
}

const DEFAULT_COLORS = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', 
  '#5856D6', '#00C7BE', '#FF2D55', '#5AC8FA', '#FFCC00'
]

export function PieChart({ title, data, size = 200 }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const radius = size / 2
  const centerX = size / 2
  const centerY = size / 2

  let currentAngle = -90 // Start from top

  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100
    const angle = (item.value / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle

    // Calculate path
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = centerX + radius * Math.cos(startRad)
    const y1 = centerY + radius * Math.sin(startRad)
    const x2 = centerX + radius * Math.cos(endRad)
    const y2 = centerY + radius * Math.sin(endRad)

    const largeArc = angle > 180 ? 1 : 0

    const path = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ')

    currentAngle = endAngle

    return {
      path,
      color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      label: item.label,
      value: item.value,
      percentage: percentage.toFixed(1)
    }
  })

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold text-white/90">{title}</h3>}
      
      <div className="flex flex-col md:flex-row items-center justify-center gap-8">
        {/* Pie Chart */}
        <svg width={size} height={size} className="flex-shrink-0">
          {slices.map((slice, index) => (
            <path
              key={index}
              d={slice.path}
              fill={slice.color}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <title>{`${slice.label}: ${slice.value} (${slice.percentage}%)`}</title>
            </path>
          ))}
        </svg>

        {/* Legend */}
        <div className="space-y-2">
          {slices.map((slice, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: slice.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white/80 truncate">{slice.label}</div>
                <div className="text-xs text-white/40">
                  {slice.value} ({slice.percentage}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
