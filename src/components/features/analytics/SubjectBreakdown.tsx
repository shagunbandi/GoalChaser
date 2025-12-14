'use client'

import {
  type SubjectStats,
  getScoreTextColor,
} from '@/lib/analyticsUtils'

interface SubjectBreakdownProps {
  data: SubjectStats[]
}

export function SubjectBreakdown({ data }: SubjectBreakdownProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-white/40">
        No subject data available for this period
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.map((subject) => (
        <div
          key={subject.name}
          className="
            bg-white/[0.02] backdrop-blur-sm
            rounded-2xl p-4 
            border border-white/[0.06]
            hover:bg-white/[0.04] hover:border-white/[0.1]
            transition-all duration-200
          "
        >
          <div className="flex items-center gap-4">
            {/* Subject Name */}
            <div className="flex-1 min-w-0">
              <h4 className="text-white/90 font-medium truncate">
                {subject.name}
              </h4>
            </div>

            {/* Hours */}
            {subject.totalHours > 0 && (
              <div className="text-right">
                <div className="text-lg font-semibold text-[#FF9500]">
                  {subject.totalHours}h
                </div>
                <div className="text-xs text-white/30">hours</div>
              </div>
            )}

            {/* Days */}
            <div className="text-right">
              <div className="text-lg font-semibold text-white/80">
                {subject.totalDays}
              </div>
              <div className="text-xs text-white/30">
                day{subject.totalDays !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Avg Productivity */}
            <div className="text-right">
              <div
                className={`text-lg font-semibold ${getScoreTextColor(subject.avgScore)}`}
              >
                {subject.avgScore}
              </div>
              <div className="text-xs text-white/30">avg</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Simple summary card showing subject distribution
export function SubjectSummaryCard({ data }: SubjectBreakdownProps) {
  if (data.length === 0) return null

  const totalHours = data.reduce((sum, s) => sum + s.totalHours, 0)
  const totalDays = data.reduce((sum, s) => sum + s.totalDays, 0)
  // Use hours if available, otherwise fall back to days
  const useHours = totalHours > 0

  // Apple-inspired color palette with glow
  const colors = [
    { bg: 'from-[#007AFF] to-[#007AFF]', glow: 'rgba(0,122,255,0.5)' },
    { bg: 'from-[#AF52DE] to-[#AF52DE]', glow: 'rgba(175,82,222,0.5)' },
    { bg: 'from-[#32D4DE] to-[#32D4DE]', glow: 'rgba(50,212,222,0.5)' },
    { bg: 'from-[#FF2D92] to-[#FF2D92]', glow: 'rgba(255,45,146,0.5)' },
    { bg: 'from-[#FF9500] to-[#FF9500]', glow: 'rgba(255,149,0,0.5)' },
    { bg: 'from-[#30D158] to-[#30D158]', glow: 'rgba(48,209,88,0.5)' },
    { bg: 'from-[#5856D6] to-[#5856D6]', glow: 'rgba(88,86,214,0.5)' },
    { bg: 'from-[#FF453A] to-[#FF453A]', glow: 'rgba(255,69,58,0.5)' },
  ]

  return (
    <div className="space-y-4">
      {/* Horizontal Stacked Bar */}
      <div className="h-3 bg-white/[0.05] rounded-full overflow-hidden flex">
        {data.map((subject, index) => {
          const value = useHours ? subject.totalHours : subject.totalDays
          const total = useHours ? totalHours : totalDays
          const width = total > 0 ? (value / total) * 100 : 0
          if (width < 1) return null
          return (
            <div
              key={subject.name}
              className={`h-full bg-gradient-to-r ${colors[index % colors.length].bg} transition-all duration-500`}
              style={{ 
                width: `${width}%`,
                boxShadow: `0 0 10px ${colors[index % colors.length].glow}`
              }}
              title={`${subject.name}: ${useHours ? `${subject.totalHours}h` : `${subject.totalDays} days`}`}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {data.map((subject, index) => {
          const value = useHours ? subject.totalHours : subject.totalDays
          const total = useHours ? totalHours : totalDays
          const percentage = total > 0 ? Math.round((value / total) * 100) : 0
          return (
            <div key={subject.name} className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded bg-gradient-to-r ${colors[index % colors.length].bg}`}
                style={{ boxShadow: `0 0 6px ${colors[index % colors.length].glow}` }}
              />
              <span className="text-xs text-white/50">
                {subject.name} ({percentage}%{useHours ? ` • ${subject.totalHours}h` : ''})
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
