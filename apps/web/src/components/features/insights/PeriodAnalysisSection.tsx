/**
 * Period Analysis Section
 * 
 * Displays period-specific insights in a compact 2-column layout
 */

'use client'

import type { PluginPeriodInsights } from '@goal-chaser/sdk'

interface PeriodAnalysisSectionProps {
  /** Period insights data from plugin */
  insights: PluginPeriodInsights
  
  /** Start date for the period */
  startDate: string
  
  /** End date for the period */
  endDate: string
  
  /** Plugin color theme */
  color?: string
}

export function PeriodAnalysisSection({
  insights,
  startDate,
  endDate,
  color = '#007AFF',
}: PeriodAnalysisSectionProps) {
  const { summary, breakdown } = insights

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white/90">Period Analysis</h2>

      {/* 2-Column Layout - natural heights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left Column: Summary Metrics */}
        {summary && summary.length > 0 && (
          <div className="glass-panel rounded-xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-white/90 mb-2">
              Summary
            </h3>
            {summary.map((metric, index) => (
              <div
                key={`${metric.label}-${index}`}
                className="flex items-center justify-between p-4 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${metric.color || color}10, transparent)`,
                }}
              >
                <div className="flex items-center gap-3">
                  {metric.icon && (
                    <div className="text-2xl">{metric.icon}</div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-white/70">
                      {metric.label}
                    </div>
                    {metric.subtitle && (
                      <div className="text-xs text-white/50">
                        {metric.subtitle}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-2xl font-bold text-white/90">
                  {typeof metric.value === 'object' && 'daily' in metric.value
                    ? `${metric.value.daily} / ${metric.value.weekly} / ${metric.value.monthly}`
                    : metric.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Right Column: Activity Breakdown */}
        {breakdown && breakdown.length > 0 && (
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-base font-semibold text-white/90 mb-4">
              Activity Breakdown
            </h3>
            <div className="space-y-3">
              {breakdown.map((item, index) => (
                <div 
                  key={`${item.label}-${index}`} 
                  className={`space-y-2 ${item.isSubItem ? 'ml-8' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.icon && <span>{item.icon}</span>}
                      <span className={`font-medium ${item.isSubItem ? 'text-white/70 text-sm' : 'text-white/90'}`}>
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-white/70">
                        {item.value}
                      </span>
                      {item.details && (
                        <span className="text-xs text-white/50">
                          ({item.details})
                        </span>
                      )}
                    </div>
                  </div>
                  {item.percentage !== undefined && (
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color || color,
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {(!summary || summary.length === 0) &&
       (!breakdown || breakdown.length === 0) && (
        <div className="text-center py-12 text-white/40">
          <p>No data for this period</p>
          <p className="text-sm mt-2">Try selecting a different time range</p>
        </div>
      )}
    </div>
  )
}
