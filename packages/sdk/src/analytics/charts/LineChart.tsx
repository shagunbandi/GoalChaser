'use client'

/**
 * Line Chart Component
 * For time series data and trends
 */

export interface LineChartProps {
  title?: string
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    color?: string
  }>
  height?: number
}

export function LineChart({ title, labels, datasets, height = 300 }: LineChartProps) {
  // Calculate scales
  const maxValue = Math.max(...datasets.flatMap(d => d.data))
  const minValue = Math.min(...datasets.flatMap(d => d.data))
  const range = maxValue - minValue || 1
  
  const getY = (value: number) => {
    return height - ((value - minValue) / range) * (height - 40) - 20
  }

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold text-white/90">{title}</h3>}
      
      <div className="relative" style={{ height: `${height}px` }}>
        <svg width="100%" height={height} className="overflow-visible">
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
                <text
                  x="5"
                  y={y + 4}
                  className="text-xs fill-white/40"
                >
                  {Math.round(minValue + range * percent)}
                </text>
              </g>
            )
          })}

          {/* Data lines */}
          {datasets.map((dataset, datasetIndex) => {
            const points = dataset.data.map((value, index) => {
              const x = 60 + (index / (labels.length - 1 || 1)) * (100 - 60)
              const y = getY(value)
              return `${x}%,${y}`
            }).join(' ')

            return (
              <g key={datasetIndex}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={dataset.color || '#007AFF'}
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {dataset.data.map((value, index) => {
                  const x = `${60 + (index / (labels.length - 1 || 1)) * (100 - 60)}%`
                  const y = getY(value)
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={dataset.color || '#007AFF'}
                      className="hover:r-6 transition-all"
                    >
                      <title>{`${dataset.label}: ${value}`}</title>
                    </circle>
                  )
                })}
              </g>
            )
          })}

          {/* X-axis labels */}
          {labels.map((label, index) => {
            const x = `${60 + (index / (labels.length - 1 || 1)) * (100 - 60)}%`
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
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: dataset.color || '#007AFF' }}
            />
            <span className="text-sm text-white/60">{dataset.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
