'use client'

/**
 * Heat Map Component
 * Calendar-style intensity visualization
 */

interface HeatMapProps {
  title?: string
  data: Record<string, number> // date -> value
  startDate: string
  endDate: string
  colorScale?: {
    low: string
    medium: string
    high: string
  }
}

const DEFAULT_COLOR_SCALE = {
  low: '#0A2F0A',
  medium: '#1D8348',
  high: '#27AE60'
}

export function HeatMap({ 
  title, 
  data, 
  startDate, 
  endDate,
  colorScale = DEFAULT_COLOR_SCALE 
}: HeatMapProps) {
  // Generate all dates in range
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0])
  }

  // Find max value for scaling
  const values = Object.values(data)
  const maxValue = Math.max(...values, 1)

  const getColor = (date: string) => {
    const value = data[date] || 0
    if (value === 0) return 'rgba(255,255,255,0.05)'
    
    const intensity = value / maxValue
    if (intensity < 0.33) return colorScale.low
    if (intensity < 0.67) return colorScale.medium
    return colorScale.high
  }

  // Group by week
  const weeks: string[][] = []
  let currentWeek: string[] = []
  
  dates.forEach((date, index) => {
    const day = new Date(date).getDay()
    
    if (index === 0 && day !== 0) {
      // Pad first week
      for (let i = 0; i < day; i++) {
        currentWeek.push('')
      }
    }
    
    currentWeek.push(date)
    
    if (day === 6 || index === dates.length - 1) {
      weeks.push([...currentWeek])
      currentWeek = []
    }
  })

  const cellSize = 12
  const gap = 2

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold text-white/90">{title}</h3>}
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Day labels */}
          <div className="flex gap-1 mb-2">
            <div style={{ width: `${cellSize}px` }} />
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div
                key={i}
                style={{ width: `${cellSize}px` }}
                className="text-xs text-white/40 text-center"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Heat map grid */}
          <div className="space-y-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex gap-1">
                <div 
                  style={{ width: `${cellSize}px` }}
                  className="text-xs text-white/40 flex items-center justify-end pr-1"
                >
                  {weekIndex === 0 && 'W'}
                </div>
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const date = week[dayIndex]
                  const value = date ? data[date] || 0 : null
                  
                  return (
                    <div
                      key={dayIndex}
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        backgroundColor: date ? getColor(date) : 'transparent'
                      }}
                      className="rounded-sm hover:ring-2 hover:ring-white/40 transition-all cursor-pointer"
                      title={date ? `${date}: ${value}` : ''}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 text-xs text-white/40">
            <span>Less</span>
            <div className="flex gap-1">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} 
              />
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: colorScale.low }} 
              />
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: colorScale.medium }} 
              />
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: colorScale.high }} 
              />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  )
}
