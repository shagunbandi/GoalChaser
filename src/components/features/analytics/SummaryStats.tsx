'use client'

import { type AnalyticsSummary, getScoreTextColor } from '@/lib/analyticsUtils'

interface SummaryStatsProps {
  summary: AnalyticsSummary
}

// Compact horizontal bar chart for distribution
function DistributionBars({ summary }: SummaryStatsProps) {
  const total = summary.daysWithData || 1
  const highPercent = (summary.highProductivityDays / total) * 100
  const mediumPercent = (summary.mediumProductivityDays / total) * 100
  const lowPercent = (summary.lowProductivityDays / total) * 100

  const bars = [
    {
      label: 'High',
      count: summary.highProductivityDays,
      percent: highPercent,
      color: '#30D158',
      shadow: 'rgba(48,209,88,0.5)',
    },
    {
      label: 'Med',
      count: summary.mediumProductivityDays,
      percent: mediumPercent,
      color: '#FF9500',
      shadow: 'rgba(255,149,0,0.5)',
    },
    {
      label: 'Low',
      count: summary.lowProductivityDays,
      percent: lowPercent,
      color: '#FF453A',
      shadow: 'rgba(255,69,58,0.5)',
    },
  ]

  if (summary.daysWithData === 0) {
    return (
      <div className="flex flex-col justify-center h-full">
        <div className="text-white/30 text-sm text-center">No data</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {bars.map((bar) => (
        <div key={bar.label} className="flex items-center gap-2">
          <span className="text-[10px] text-white/40 w-7 shrink-0">
            {bar.label}
          </span>
          <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${bar.percent}%`,
                backgroundColor: bar.color,
                boxShadow: bar.percent > 0 ? `0 0 8px ${bar.shadow}` : 'none',
              }}
            />
          </div>
          <span className="text-[10px] text-white/50 w-4 text-right shrink-0">
            {bar.count}
          </span>
        </div>
      ))}
    </div>
  )
}

export function SummaryStats({ summary }: SummaryStatsProps) {
  const completionRate =
    summary.totalDays > 0
      ? Math.round((summary.daysWithData / summary.totalDays) * 100)
      : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Average Score */}
      <div
        className="
        bg-white/[0.02] backdrop-blur-sm
        rounded-2xl p-5 
        border border-white/[0.06]
        transition-all duration-200
        hover:bg-white/[0.04]
      "
      >
        <div className="text-white/40 text-xs uppercase tracking-wider mb-2">
          Avg Score
        </div>
        <div
          className={`text-3xl font-bold ${getScoreTextColor(
            summary.avgScore,
          )}`}
        >
          {summary.avgScore || '—'}
        </div>
        <div className="text-white/30 text-xs mt-1">out of 10</div>
      </div>

      {/* Days Tracked */}
      <div
        className="
        bg-white/[0.02] backdrop-blur-sm
        rounded-2xl p-5 
        border border-white/[0.06]
        transition-all duration-200
        hover:bg-white/[0.04]
      "
      >
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
      <div
        className="
        bg-white/[0.02] backdrop-blur-sm
        rounded-2xl p-5
        border border-white/[0.06]
        transition-all duration-200
        hover:bg-white/[0.04]
      "
      >
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

      {/* Distribution */}
      <div
        className="
        bg-white/[0.02] backdrop-blur-sm
        rounded-2xl p-5 
        border border-white/[0.06]
        transition-all duration-200
        hover:bg-white/[0.04]
      "
      >
        <div className="text-white/40 text-xs uppercase tracking-wider mb-2">
          Distribution
        </div>
        <DistributionBars summary={summary} />
      </div>
    </div>
  )
}

// Simple export that just uses SummaryStats (no more best/worst days)
export function ExtendedSummary({ summary }: SummaryStatsProps) {
  return <SummaryStats summary={summary} />
}
