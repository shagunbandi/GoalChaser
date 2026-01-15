'use client'

import { Card } from '@/components/ui'

interface YearViewHeaderProps {
  icon: string
  title: string
  year: number
  stats?: Array<{ label: string; value: number | string }>
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }>
  onPrevYear: () => void
  onNextYear: () => void
}

export function YearViewHeader({
  icon,
  title,
  year,
  stats = [],
  actions = [],
  onPrevYear,
  onNextYear,
}: YearViewHeaderProps) {
  return (
    <Card className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onPrevYear}
            className="
              px-3 py-2 rounded-xl text-sm font-medium
              bg-white/5 hover:bg-white/8
              border border-white/8 hover:border-white/12
              text-white/70 hover:text-white
              transition-all duration-150
            "
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h2 className="text-xl font-semibold text-white/90">
              {title} {year}
            </h2>
          </div>
          <button
            onClick={onNextYear}
            className="
              px-3 py-2 rounded-xl text-sm font-medium
              bg-white/5 hover:bg-white/8
              border border-white/8 hover:border-white/12
              text-white/70 hover:text-white
              transition-all duration-150
            "
          >
            →
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="px-3 py-2 rounded-xl border border-white/8 bg-white/3 text-sm text-white/70"
            >
              {stat.label}: <span className="text-white">{stat.value}</span>
            </div>
          ))}
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={
                action.variant === 'secondary'
                  ? `
                    inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                    bg-white/5 hover:bg-white/8
                    border border-white/8 hover:border-white/12
                    text-white/70 hover:text-white
                    transition-all duration-150
                  `
                  : `
                    inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                    bg-linear-to-r from-[#007AFF] to-[#AF52DE]
                    text-white shadow-[0_0_20px_rgba(0,122,255,0.25)]
                    hover:shadow-[0_0_26px_rgba(175,82,222,0.35)]
                    transition-all duration-150
                  `
              }
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}
