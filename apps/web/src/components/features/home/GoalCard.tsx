'use client'

import { Goal } from '@/hooks/useGoals'
import { GOAL_COLORS } from './constants'

interface GoalCardProps {
  goal: Goal
  onClick: () => void
  index: number
}

export function GoalCard({ goal, onClick, index }: GoalCardProps) {
  const colorConfig =
    GOAL_COLORS.find((c) => c.value === goal.color) || GOAL_COLORS[0]
  const createdDate = new Date(goal.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      onClick={onClick}
      style={{ animationDelay: `${index * 50}ms` }}
      className="
        group relative overflow-hidden
        bg-white/[0.03] backdrop-blur-xl
        rounded-2xl border border-white/[0.08]
        p-5 cursor-pointer
        transition-all duration-300 ease-out
        hover:bg-white/[0.06] hover:border-white/[0.15]
        hover:scale-[1.02] hover:shadow-xl
        animate-fade-in-up
      "
    >
      {/* Gradient accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-80"
        style={{
          background: `linear-gradient(90deg, ${colorConfig.hex}, ${colorConfig.hex}88)`,
        }}
      />

      {/* Content */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: colorConfig.hex }}
            />
            <h3 className="text-base font-semibold text-white/90 truncate">
              {goal.name}
            </h3>
          </div>
          {goal.description && (
            <p className="text-white/40 text-sm line-clamp-1 ml-5 mb-2">
              {goal.description}
            </p>
          )}
          <p className="text-white/25 text-xs ml-5">{createdDate}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center shrink-0">
          <div className="p-1.5 text-white/30 group-hover:text-white/60 transition-colors">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

