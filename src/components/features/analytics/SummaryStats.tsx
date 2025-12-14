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

  // Calculate rotation offsets
  const highOffset = 0
  const mediumOffset = highDash
  const lowOffset = highDash + mediumDash

  if (summary.daysWithData === 0) {
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="10"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-slate-500 text-sm">No data</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="10"
          />

          {/* High productivity (green) */}
          {summary.highProductivityDays > 0 && (
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#10b981"
              strokeWidth="10"
              strokeDasharray={`${highDash} ${circumference - highDash}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          )}

          {/* Medium productivity (amber) */}
          {summary.mediumProductivityDays > 0 && (
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="10"
              strokeDasharray={`${mediumDash} ${circumference - mediumDash}`}
              strokeDashoffset={-highDash}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          )}

          {/* Low productivity (red) */}
          {summary.lowProductivityDays > 0 && (
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#f87171"
              strokeWidth="10"
              strokeDasharray={`${lowDash} ${circumference - lowDash}`}
              strokeDashoffset={-(highDash + mediumDash)}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          )}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {summary.daysWithData}
          </span>
          <span className="text-xs text-slate-400">days</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-400">
            High ({summary.highProductivityDays})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-xs text-slate-400">
            Med ({summary.mediumProductivityDays})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <span className="text-xs text-slate-400">
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
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">
            Avg Score
          </div>
          <div
            className={`text-3xl font-bold ${getScoreTextColor(
              summary.avgScore,
            )}`}
          >
            {summary.avgScore || '—'}
          </div>
          <div className="text-slate-500 text-xs mt-1">out of 10</div>
        </div>

        {/* Days Tracked */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">
            Days Tracked
          </div>
          <div className="text-3xl font-bold text-white">
            {summary.daysWithData}
            <span className="text-slate-500 text-lg">/{summary.totalDays}</span>
          </div>
          <div className="text-slate-500 text-xs mt-1">
            {completionRate}% completion
          </div>
        </div>

        {/* Total Score */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 col-span-2">
          <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">
            Total Points
          </div>
          <div className="text-3xl font-bold text-cyan-400">
            {summary.totalScore}
          </div>
          <div className="text-slate-500 text-xs mt-1">
            productivity points earned
          </div>
        </div>
      </div>

      {/* Right side - Circular Distribution */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10 flex flex-col items-center justify-center">
        <div className="text-slate-400 text-xs uppercase tracking-wide mb-4">
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
