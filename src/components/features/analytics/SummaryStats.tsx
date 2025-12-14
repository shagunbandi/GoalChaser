'use client'

import { type AnalyticsSummary, getScoreTextColor } from '@/lib/analyticsUtils'

interface SummaryStatsProps {
  summary: AnalyticsSummary
}

// Circular progress component for distribution
function CircularDistribution({ summary }: SummaryStatsProps) {
  const total = summary.daysWithData || 1
  const highPercent = (summary.highProductivityDays / total) * 100
  const mediumPercent = (summary.mediumProductivityDays / total) * 100
  const lowPercent = (summary.lowProductivityDays / total) * 100

  // Calculate stroke dash values for the donut chart
  const circumference = 2 * Math.PI * 45 // radius = 45
  const highDash = (highPercent / 100) * circumference
  const mediumDash = (mediumPercent / 100) * circumference
  const lowDash = (lowPercent / 100) * circumference

  if (summary.daysWithData === 0) {
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="8"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/30 text-sm">No data</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
          />

          {/* High productivity (green) */}
          {summary.highProductivityDays > 0 && (
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#30D158"
              strokeWidth="8"
              strokeDasharray={`${highDash} ${circumference - highDash}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              className="transition-all duration-700 drop-shadow-[0_0_8px_rgba(48,209,88,0.5)]"
            />
          )}

          {/* Medium productivity (amber) */}
          {summary.mediumProductivityDays > 0 && (
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#FF9500"
              strokeWidth="8"
              strokeDasharray={`${mediumDash} ${circumference - mediumDash}`}
              strokeDashoffset={-highDash}
              strokeLinecap="round"
              className="transition-all duration-700 drop-shadow-[0_0_8px_rgba(255,149,0,0.5)]"
            />
          )}

          {/* Low productivity (red) */}
          {summary.lowProductivityDays > 0 && (
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#FF453A"
              strokeWidth="8"
              strokeDasharray={`${lowDash} ${circumference - lowDash}`}
              strokeDashoffset={-(highDash + mediumDash)}
              strokeLinecap="round"
              className="transition-all duration-700 drop-shadow-[0_0_8px_rgba(255,69,58,0.5)]"
            />
          )}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white/90">
            {summary.daysWithData}
          </span>
          <span className="text-xs text-white/40">days</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-5 mt-5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#30D158] shadow-[0_0_8px_rgba(48,209,88,0.5)]" />
          <span className="text-xs text-white/50">
            High ({summary.highProductivityDays})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF9500] shadow-[0_0_8px_rgba(255,149,0,0.5)]" />
          <span className="text-xs text-white/50">
            Med ({summary.mediumProductivityDays})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF453A] shadow-[0_0_8px_rgba(255,69,58,0.5)]" />
          <span className="text-xs text-white/50">
            Low ({summary.lowProductivityDays})
          </span>
        </div>
      </div>
    </div>
  )
}

export function SummaryStats({ summary }: SummaryStatsProps) {
  const completionRate =
    summary.totalDays > 0
      ? Math.round((summary.daysWithData / summary.totalDays) * 100)
      : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left side - Key metrics */}
      <div className="grid grid-cols-2 gap-4">
        {/* Average Score */}
        <div className="
          bg-white/[0.02] backdrop-blur-sm
          rounded-2xl p-5 
          border border-white/[0.06]
          transition-all duration-200
          hover:bg-white/[0.04]
        ">
          <div className="text-white/40 text-xs uppercase tracking-wider mb-2">
            Avg Score
          </div>
          <div
            className={`text-3xl font-bold ${getScoreTextColor(summary.avgScore)}`}
          >
            {summary.avgScore || '—'}
          </div>
          <div className="text-white/30 text-xs mt-1">out of 10</div>
        </div>

        {/* Days Tracked */}
        <div className="
          bg-white/[0.02] backdrop-blur-sm
          rounded-2xl p-5 
          border border-white/[0.06]
          transition-all duration-200
          hover:bg-white/[0.04]
        ">
          <div className="text-white/40 text-xs uppercase tracking-wider mb-2">
            Days Tracked
          </div>
          <div className="text-3xl font-bold text-white/90">
            {summary.daysWithData}
            <span className="text-white/30 text-lg">/{summary.totalDays}</span>
          </div>
          <div className="text-white/30 text-xs mt-1">
            {completionRate}% completion
          </div>
        </div>

        {/* Total Score */}
        <div className="
          bg-white/[0.02] backdrop-blur-sm
          rounded-2xl p-5 col-span-2
          border border-white/[0.06]
          transition-all duration-200
          hover:bg-white/[0.04]
        ">
          <div className="text-white/40 text-xs uppercase tracking-wider mb-2">
            Total Points
          </div>
          <div className="text-3xl font-bold text-[#32D4DE]">
            {summary.totalScore}
          </div>
          <div className="text-white/30 text-xs mt-1">
            productivity points earned
          </div>
        </div>
      </div>

      {/* Right side - Circular Distribution */}
      <div className="
        bg-white/[0.02] backdrop-blur-sm
        rounded-2xl p-6 
        border border-white/[0.06]
        flex flex-col items-center justify-center
        transition-all duration-200
        hover:bg-white/[0.04]
      ">
        <div className="text-white/40 text-xs uppercase tracking-wider mb-4">
          Productivity Distribution
        </div>
        <CircularDistribution summary={summary} />
      </div>
    </div>
  )
}

// Simple export that just uses SummaryStats (no more best/worst days)
export function ExtendedSummary({ summary }: SummaryStatsProps) {
  return <SummaryStats summary={summary} />
}
