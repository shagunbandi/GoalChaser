'use client'

import { type AnalyticsSummary, type Streak, getScoreTextColor, getShortDate } from '@/lib/analyticsUtils'
import { getVibgyorColors } from '@/lib/scoreUtils'

interface SummaryStatsProps {
  summary: AnalyticsSummary
  isHoursBased?: boolean
  maxHours?: number
}

// Compact horizontal bar chart for productivity distribution
function ProductivityDistributionBars({ summary }: { summary: AnalyticsSummary }) {
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

// Streaks display component
function StreaksDisplay({ summary }: { summary: AnalyticsSummary }) {
  const { longestStreak, secondLongestStreak, currentStreak } = summary

  if (!longestStreak) {
    return (
      <div className="flex flex-col justify-center h-full">
        <div className="text-white/30 text-sm text-center">No streaks yet</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Longest Streak */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏆</span>
          <span className="text-xs text-white/50">Best</span>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold text-[#FFD60A]">{longestStreak.length}</span>
          <span className="text-xs text-white/40 ml-1">days</span>
        </div>
      </div>

      {/* Second Longest Streak */}
      {secondLongestStreak && secondLongestStreak.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🥈</span>
            <span className="text-xs text-white/50">2nd</span>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-[#C0C0C0]">{secondLongestStreak.length}</span>
            <span className="text-xs text-white/40 ml-1">days</span>
          </div>
        </div>
      )}

      {/* Current Streak */}
      {currentStreak > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <span className="text-xs text-white/50">Now</span>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-[#FF9500]">{currentStreak}</span>
            <span className="text-xs text-white/40 ml-1">days</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Get hours color based on VIBGYOR
function getHoursTextColor(avgHours: number, maxHours: number): string {
  if (avgHours === 0) return 'text-white/40'
  const vibgyorColors = getVibgyorColors()
  const ratio = avgHours / maxHours
  const index = Math.min(Math.floor(ratio * vibgyorColors.length), vibgyorColors.length - 1)
  return '' // Return empty, we'll use inline style
}

function getHoursColorValue(avgHours: number, maxHours: number): string {
  if (avgHours === 0) return '#666'
  const vibgyorColors = getVibgyorColors()
  const ratio = avgHours / maxHours
  const index = Math.min(Math.floor(ratio * vibgyorColors.length), vibgyorColors.length - 1)
  return vibgyorColors[index].color
}

export function SummaryStats({ summary, isHoursBased = false, maxHours = 8 }: SummaryStatsProps) {
  const completionRate =
    summary.totalDays > 0
      ? Math.round((summary.daysWithData / summary.totalDays) * 100)
      : 0

  const avgHoursColor = getHoursColorValue(summary.avgHoursPerDay, maxHours)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Main metric - Avg Score or Avg Hours based on mode */}
      {isHoursBased ? (
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
            Avg Hours/Day
          </div>
          <div
            className="text-3xl font-bold"
            style={{ color: avgHoursColor }}
          >
            {summary.avgHoursPerDay || '—'}
          </div>
          <div className="text-white/30 text-xs mt-1">out of {maxHours}h</div>
        </div>
      ) : (
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
      )}

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

      {/* Total Hours */}
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
          Total Hours
        </div>
        <div className="text-3xl font-bold text-[#FF9500]">
          {summary.totalHours || 0}
        </div>
        <div className="text-white/30 text-xs mt-1">
          hours tracked
        </div>
      </div>

      {/* Total Score or Total Points - only show for productivity mode */}
      {!isHoursBased && (
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
            productivity points
          </div>
        </div>
      )}

      {/* Best Day Hours - only for hours mode */}
      {isHoursBased && summary.bestDay && (
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
            Best Day
          </div>
          <div className="text-3xl font-bold text-[#30D158]">
            {summary.bestDay.totalHours}h
          </div>
          <div className="text-white/30 text-xs mt-1">
            {summary.bestDay.dayName}
          </div>
        </div>
      )}

      {/* Streaks for hours-based, Distribution for productivity */}
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
          {isHoursBased ? 'Streaks' : 'Distribution'}
        </div>
        {isHoursBased ? (
          <StreaksDisplay summary={summary} />
        ) : (
          <ProductivityDistributionBars summary={summary} />
        )}
      </div>
    </div>
  )
}

// Simple export that just uses SummaryStats (no more best/worst days)
export function ExtendedSummary({ summary, isHoursBased, maxHours }: SummaryStatsProps) {
  return <SummaryStats summary={summary} isHoursBased={isHoursBased} maxHours={maxHours} />
}
