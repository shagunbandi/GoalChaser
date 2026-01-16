'use client'

import type { ProductivitySummaryData } from '@/types'

interface ProductivitySummaryProps {
  data: ProductivitySummaryData
}

export function ProductivitySummary({ data }: ProductivitySummaryProps) {
  const { score, areas = [] } = data

  // Helper to get score color and label
  const getScoreInfo = (score: number) => {
    if (score >= 7) return { label: 'High', color: 'text-green-400' }
    if (score >= 4) return { label: 'OK', color: 'text-yellow-400' }
    return { label: 'Low', color: 'text-red-400' }
  }

  if (!data.hasData) {
    return (
      <div className="text-xs text-white/40 italic">
        No productivity data recorded
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Score Display */}
      {score !== null && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">Score:</span>
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-bold ${getScoreInfo(score).color}`}>
              {score}/10
            </span>
            <span className={`text-xs ${getScoreInfo(score).color}`}>
              ({getScoreInfo(score).label})
            </span>
          </div>
        </div>
      )}

      {/* Areas and Topics */}
      {areas.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-white/60">Areas Covered:</div>
          {areas.map((areaEntry, idx) => (
            <div key={idx} className="text-xs">
              <div className="text-white/80 font-medium">
                📌 {areaEntry.area}
              </div>
              {areaEntry.topics.length > 0 && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {areaEntry.topics.map((topic, topicIdx) => (
                    <div key={topicIdx} className="text-white/50 text-[11px]">
                      • {topic}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
