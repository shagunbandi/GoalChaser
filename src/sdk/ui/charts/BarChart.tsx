'use client'

/**
 * Bar Chart Component
 * For comparisons and categorical data
 */

interface BarChartProps {
  title?: string
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    color?: string
  }>
  height?: number
  horizontal?: boolean
}

export function BarChart({ 
  title, 
  labels, 
  datasets, 
  height = 300,
  horizontal = false 
}: BarChartProps) {
  const maxValue = Math.max(...datasets.flatMap(d => d.data))
  const barWidth = 100 / (labels.length * datasets.length + labels.length + 1)

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold text-white/90">{title}</h3>}
      
      <div className="relative" style={{ height: `${height}px` }}>
        <svg width="100%" height={height}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((percent, i) => {
            const y = height - percent * (height - 40) - 20
            return (
              <g key={i}>
                <line
                  x1="40"
                  y1={y}
                  x2="100%"
                  y2={y}
                  stroke="rgba(255,255,255,0.1)"
                  strokeDasharray="2,2"
                />
                <text x="5" y={y + 4} className="text-xs fill-white/40">
                  {Math.round(maxValue * percent)}
                </text>
              </g>
            )
          })}

          {/* Bars */}
          {labels.map((label, labelIndex) => {
            return datasets.map((dataset, datasetIndex) => {
              const value = dataset.data[labelIndex] || 0
              const barHeight = (value / maxValue) * (height - 60)
              const x = `${50 + (labelIndex * (datasets.length + 1) + datasetIndex + 1) * barWidth}%`
              const y = height - barHeight - 20

              return (
                <g key={`${labelIndex}-${datasetIndex}`}>
                  <rect
                    x={x}
                    y={y}
                    width={`${barWidth * 0.8}%`}
                    height={barHeight}
                    fill={dataset.color || '#007AFF'}
                    className="hover:opacity-80 transition-opacity"
                    rx="4"
                  >
                    <title>{`${dataset.label} - ${label}: ${value}`}</title>
                  </rect>
                </g>
              )
            })
          })}

          {/* X-axis labels */}
          {labels.map((label, index) => {
            const x = `${50 + (index * (datasets.length + 1) + datasets.length / 2 + 0.5) * barWidth}%`
            return (
              <text
                key={index}
                x={x}
                y={height - 5}
                textAnchor="middle"
                className="text-xs fill-white/40"
              >
                {label}
              </text>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        {datasets.map((dataset, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: dataset.color || '#007AFF' }}
            />
            <span className="text-sm text-white/60">{dataset.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
