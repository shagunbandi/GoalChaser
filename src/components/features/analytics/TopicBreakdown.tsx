'use client'

import { type TopicStats, getScoreTextColor } from '@/lib/analyticsUtils'

interface TopicBreakdownProps {
  data: TopicStats[]
}

export function TopicBreakdown({ data }: TopicBreakdownProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No topic data available for this period
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.map((topic) => (
        <div
          key={`${topic.subject}-${topic.name}`}
          className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-4">
            {/* Topic Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold truncate">
                {topic.name}
              </h4>
              {topic.subject && (
                <p className="text-xs text-slate-500 truncate">
                  {topic.subject}
                </p>
              )}
            </div>

            {/* Days */}
            <div className="text-right">
              <div className="text-lg font-bold text-white">
                {topic.totalDays}
              </div>
              <div className="text-xs text-slate-500">
                day{topic.totalDays !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Avg Productivity */}
            <div className="text-right">
              <div
                className={`text-lg font-bold ${getScoreTextColor(
                  topic.avgScore,
                )}`}
              >
                {topic.avgScore}
              </div>
              <div className="text-xs text-slate-500">avg</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Compact list view
export function TopicFlatList({ data }: TopicBreakdownProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No topic data available
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {data.slice(0, 10).map((topic, index) => (
        <div
          key={`${topic.subject}-${topic.name}`}
          className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          {/* Rank */}
          <span className="text-slate-500 text-sm w-5 shrink-0">
            {index + 1}.
          </span>

          {/* Topic Name */}
          <div className="flex-1 min-w-0">
            <span className="text-white text-sm truncate block">
              {topic.name}
            </span>
            {topic.subject && (
              <span className="text-slate-500 text-xs">{topic.subject}</span>
            )}
          </div>

          {/* Days */}
          <div className="text-right shrink-0">
            <span className="text-white font-medium">{topic.totalDays}</span>
            <span className="text-slate-500 text-xs ml-1">d</span>
          </div>

          {/* Avg */}
          <div
            className={`text-right shrink-0 font-medium ${getScoreTextColor(
              topic.avgScore,
            )}`}
          >
            {topic.avgScore}
          </div>
        </div>
      ))}

      {data.length > 10 && (
        <p className="text-center text-slate-500 text-xs pt-2">
          +{data.length - 10} more topics
        </p>
      )}
    </div>
  )
}
