'use client'

import {
  type SubjectStats,
  getScoreColor,
  getScoreTextColor,
} from '@/lib/analyticsUtils'

interface SubjectBreakdownProps {
  data: SubjectStats[]
}

export function SubjectBreakdown({ data }: SubjectBreakdownProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No subject data available for this period
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.map((subject) => (
        <div
          key={subject.name}
          className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-4">
            {/* Subject Name */}
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold truncate">
                {subject.name}
              </h4>
            </div>

            {/* Days */}
            <div className="text-right">
              <div className="text-lg font-bold text-white">
                {subject.totalDays}
              </div>
              <div className="text-xs text-slate-500">
                day{subject.totalDays !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Avg Productivity */}
            <div className="text-right">
              <div
                className={`text-lg font-bold ${getScoreTextColor(
                  subject.avgScore,
                )}`}
              >
                {subject.avgScore}
              </div>
              <div className="text-xs text-slate-500">avg</div>
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

  const totalDays = data.reduce((sum, s) => sum + s.totalDays, 0)

  // Color palette for subjects
  const colors = [
    'from-cyan-500 to-cyan-400',
    'from-violet-500 to-violet-400',
    'from-fuchsia-500 to-fuchsia-400',
    'from-rose-500 to-rose-400',
    'from-amber-500 to-amber-400',
    'from-emerald-500 to-emerald-400',
    'from-blue-500 to-blue-400',
    'from-pink-500 to-pink-400',
  ]

  return (
    <div className="space-y-4">
      {/* Horizontal Stacked Bar */}
      <div className="h-4 bg-white/10 rounded-full overflow-hidden flex">
        {data.map((subject, index) => {
          const width =
            totalDays > 0 ? (subject.totalDays / totalDays) * 100 : 0
          if (width < 1) return null
          return (
            <div
              key={subject.name}
              className={`h-full bg-gradient-to-r ${
                colors[index % colors.length]
              } transition-all duration-500`}
              style={{ width: `${width}%` }}
              title={`${subject.name}: ${subject.totalDays} days`}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {data.map((subject, index) => {
          const percentage =
            totalDays > 0
              ? Math.round((subject.totalDays / totalDays) * 100)
              : 0
          return (
            <div key={subject.name} className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded bg-gradient-to-r ${
                  colors[index % colors.length]
                }`}
              />
              <span className="text-xs text-slate-400">
                {subject.name} ({percentage}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
