'use client'

import { type TopicStats, getScoreTextColor } from '@/lib/analyticsUtils'

interface TopicBreakdownProps {
  data: TopicStats[]
  isHoursBased?: boolean
}

export function TopicBreakdown({ data, isHoursBased = false }: TopicBreakdownProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-white/40">
        No topic data available for this period
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.map((topic) => (
        <div
          key={`${topic.subject}-${topic.name}`}
          className="
            bg-white/[0.02] backdrop-blur-sm
            rounded-2xl p-4 
            border border-white/[0.06]
            hover:bg-white/[0.04] hover:border-white/[0.1]
            transition-all duration-200
          "
        >
          <div className="flex items-center gap-4">
            {/* Topic Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-white/90 font-medium truncate">
                {topic.name}
              </h4>
              {topic.subject && (
                <p className="text-xs text-white/30 truncate">
                  {topic.subject}
                </p>
              )}
            </div>

            {/* Hours */}
            {topic.totalHours > 0 && (
              <div className="text-right">
                <div className="text-lg font-semibold text-[#FF9500]">
                  {topic.totalHours}h
                </div>
                <div className="text-xs text-white/30">hours</div>
              </div>
            )}

            {/* Days */}
            <div className="text-right">
              <div className="text-lg font-semibold text-white/80">
                {topic.totalDays}
              </div>
              <div className="text-xs text-white/30">
                day{topic.totalDays !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Avg Productivity - only show for productivity mode */}
            {!isHoursBased && (
              <div className="text-right">
                <div
                  className={`text-lg font-semibold ${getScoreTextColor(topic.avgScore)}`}
                >
                  {topic.avgScore}
                </div>
                <div className="text-xs text-white/30">avg</div>
              </div>
            )}
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
      <div className="text-center py-10 text-white/40">
        No topic data available
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {data.slice(0, 10).map((topic, index) => (
        <div
          key={`${topic.subject}-${topic.name}`}
          className="
            flex items-center gap-3 p-3.5 
            rounded-xl 
            bg-white/[0.02] hover:bg-white/[0.04]
            border border-white/[0.04] hover:border-white/[0.08]
            transition-all duration-200
          "
        >
          {/* Rank */}
          <span className="text-white/30 text-sm w-5 shrink-0">
            {index + 1}.
          </span>

          {/* Topic Name */}
          <div className="flex-1 min-w-0">
            <span className="text-white/80 text-sm truncate block">
              {topic.name}
            </span>
            {topic.subject && (
              <span className="text-white/30 text-xs">{topic.subject}</span>
            )}
          </div>

          {/* Hours */}
          {topic.totalHours > 0 && (
            <div className="text-right shrink-0">
              <span className="text-[#FF9500] font-medium">{topic.totalHours}</span>
              <span className="text-white/30 text-xs ml-1">h</span>
            </div>
          )}

          {/* Days */}
          <div className="text-right shrink-0">
            <span className="text-white/80 font-medium">{topic.totalDays}</span>
            <span className="text-white/30 text-xs ml-1">d</span>
          </div>

          {/* Avg */}
          <div
            className={`text-right shrink-0 font-medium ${getScoreTextColor(topic.avgScore)}`}
          >
            {topic.avgScore}
          </div>
        </div>
      ))}

      {data.length > 10 && (
        <p className="text-center text-white/30 text-xs pt-2">
          +{data.length - 10} more topics
        </p>
      )}
    </div>
  )
}
