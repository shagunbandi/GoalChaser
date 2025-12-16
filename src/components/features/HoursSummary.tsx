'use client'

import { useRef } from 'react'
import { getHoursLabel, getVibgyorColors } from '@/lib/scoreUtils'

interface HoursSummaryProps {
  totalHours: number
  subjectHours: number // Hours from subjects
  directHours: number // Hours set directly
  maxHours: 8 | 14 | 18
  onDirectHoursChange: (hours: number) => void
}

export function HoursSummary({ 
  totalHours, 
  subjectHours,
  directHours,
  maxHours, 
  onDirectHoursChange 
}: HoursSummaryProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const percentage = Math.min((totalHours / maxHours) * 100, 100)
  const vibgyorColors = getVibgyorColors()
  
  // Check if hours are coming from subjects
  const hasSubjectHours = subjectHours > 0
  
  // Get color based on progress
  const getProgressColor = () => {
    if (totalHours <= 0) return '#666'
    const ratio = totalHours / maxHours
    const index = Math.min(Math.floor(ratio * vibgyorColors.length), vibgyorColors.length - 1)
    return vibgyorColors[index].color
  }

  const progressColor = getProgressColor()
  const label = totalHours > 0 ? getHoursLabel(totalHours, maxHours) : 'Not started'

  // Handle click on progress bar to set hours
  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current) return
    
    const rect = barRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const ratio = Math.max(0, Math.min(1, clickX / rect.width))
    const hours = Math.round(ratio * maxHours * 2) / 2 // Round to nearest 0.5
    
    onDirectHoursChange(hours)
  }

  // Handle drag on progress bar
  const handleBarDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return // Only handle left mouse button
    handleBarClick(e)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-white/60">
          Hours Today
        </label>
        <div className="flex items-center gap-2">
          {totalHours > 0 ? (
            <>
              <span
                className="text-2xl font-bold"
                style={{ color: progressColor }}
              >
                {totalHours}h
              </span>
              <span className="text-white/40">/ {maxHours}h</span>
              <span
                className="text-xs px-2.5 py-1 rounded-full backdrop-blur-sm border"
                style={{ 
                  backgroundColor: `${progressColor}20`,
                  color: progressColor,
                  borderColor: `${progressColor}40`
                }}
              >
                {label}
              </span>
            </>
          ) : (
            <span className="text-white/40 text-sm">Click bar to set hours</span>
          )}
        </div>
      </div>

      {/* Interactive Progress bar with VIBGYOR gradient */}
      <div className="space-y-2">
        <div 
          ref={barRef}
          className="relative h-6 bg-white/[0.05] rounded-full overflow-hidden cursor-pointer group"
          onClick={handleBarClick}
          onMouseMove={handleBarDrag}
        >
          {/* Background gradient (shows full spectrum) */}
          <div
            className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
            style={{
              background: `linear-gradient(90deg, ${vibgyorColors.map(c => c.color).join(', ')})`,
            }}
          />
          
          {/* Filled progress */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-200"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${vibgyorColors.map(c => c.color).join(', ')})`,
              boxShadow: totalHours > 0 ? `0 0 15px ${progressColor}60` : 'none',
            }}
          />
          
          {/* Hover indicator */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-white/70 font-medium drop-shadow-lg">
              {hasSubjectHours ? 'Subject hours active (bar ignored)' : 'Drag or click to set'}
            </span>
          </div>
        </div>
        
        {/* Hour markers */}
        <div className="flex justify-between text-xs text-white/30 px-1">
          <span>0h</span>
          <span>{Math.round(maxHours / 4)}h</span>
          <span>{Math.round(maxHours / 2)}h</span>
          <span>{Math.round(maxHours * 3 / 4)}h</span>
          <span>{maxHours}h</span>
        </div>
      </div>

      {/* Source indicator and direct input */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasSubjectHours ? (
            <span className="text-xs text-white/40 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#30D158]" />
              From subjects ({subjectHours}h)
              {directHours > 0 && (
                <span className="text-white/30 line-through">bar: {directHours}h ignored</span>
              )}
            </span>
          ) : directHours > 0 ? (
            <span className="text-xs text-white/40 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#5856D6]" />
              From bar ({directHours}h)
            </span>
          ) : (
            <span className="text-xs text-white/30">
              Track via subjects below or click the bar
            </span>
          )}
        </div>
        
        {/* Clear direct hours button */}
        {directHours > 0 && (
          <button
            onClick={() => onDirectHoursChange(0)}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Clear bar
          </button>
        )}
      </div>

      {/* Color legend */}
      <div className="flex items-center gap-1.5 justify-center">
        <span className="text-xs text-white/40 mr-2">Progress:</span>
        {vibgyorColors.map((c, i) => (
          <div
            key={i}
            className="w-4 h-2 rounded-sm first:rounded-l last:rounded-r"
            style={{ backgroundColor: c.color }}
            title={`${Math.round((i / vibgyorColors.length) * maxHours)}-${Math.round(((i + 1) / vibgyorColors.length) * maxHours)}h`}
          />
        ))}
      </div>
    </div>
  )
}
