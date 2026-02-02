'use client'

import { Card } from '../../ui/Card'
import type { HeaderConfig } from '../../types/year-view-config'
import { ButtonRenderer } from './ButtonRenderer'

interface HeaderRendererProps {
  config: HeaderConfig
  year: number
  onPrevYear: () => void
  onNextYear: () => void
}

export function HeaderRenderer({
  config,
  year,
  onPrevYear,
  onNextYear,
}: HeaderRendererProps) {
  // Safety check: ensure config has required properties
  if (!config || !config.title) {
    return null
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex flex-col gap-3">
        {/* Title and Navigation Row */}
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
              {config.icon && <span className="text-xl">{config.icon}</span>}
              <h2 className="text-xl font-semibold text-white/90">
                {config.title} {year}
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

          {/* Action Buttons on the Right */}
          {config.actions && config.actions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              {config.actions.map((action) => (
                <ButtonRenderer key={action.id} config={action} />
              ))}
            </div>
          )}
        </div>

        {/* Legends Row (if provided) */}
        {config.legends && config.legends.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
            <span className="font-medium">Legend:</span>
            {config.legends.map((legend, index) => (
              <div key={index} className="flex items-center gap-1.5">
                {legend.icon ? (
                  <span>{legend.icon}</span>
                ) : (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: legend.color }}
                  />
                )}
                <span>{legend.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats Row */}
        {config.stats && config.stats.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {config.stats.map((stat, index) => (
              <div
                key={index}
                className="px-3 py-2 rounded-xl border border-white/8 bg-white/3 text-sm text-white/70"
                style={stat.color ? { color: stat.color } : undefined}
              >
                {stat.label}: <span className="font-medium">{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
