'use client'

import type { HoursSummaryData } from '@/types'

interface HoursSummaryProps {
  data: HoursSummaryData
  maxHours?: number
}

export function HoursSummary({ data, maxHours = 8 }: HoursSummaryProps) {
  const { totalHours, subjects = [], directHours = 0 } = data

  if (!data.hasData) {
    return (
      <div className="text-xs text-white/40 italic">
        No hours data recorded
      </div>
    )
  }

  // Calculate progress percentage
  const progressPercentage = Math.min((totalHours / maxHours) * 100, 100)

  return (
    <div className="space-y-3">
      {/* Total Hours with Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60">Total Hours:</span>
          <span className="text-sm font-bold text-blue-400">
            {totalHours.toFixed(1)}h / {maxHours}h
          </span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Subject Breakdown */}
      {subjects.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs text-white/60">Subject Breakdown:</div>
          {subjects.map((subject, idx) => (
            <div key={idx} className="text-xs">
              <div className="flex items-center justify-between">
                <span className="text-white/80 font-medium">
                  📚 {subject.subject}
                </span>
                <span className="text-blue-400 font-semibold">
                  {subject.hours}h
                </span>
              </div>
              {subject.topics.length > 0 && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {subject.topics.map((topic, topicIdx) => (
                    <div key={topicIdx} className="text-white/50 text-[11px]">
                      • {topic}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : directHours > 0 ? (
        <div className="text-xs text-white/60">
          Direct hours logged (no subject breakdown)
        </div>
      ) : null}
    </div>
  )
}
