/**
 * Quick Stats Section
 * 
 * Displays time-agnostic insights (streaks, all-time metrics)
 */

'use client'

import { useState } from 'react'
import type { PluginQuickStats } from '@goal-chaser/sdk'

interface QuickStatsSectionProps {
  /** Quick stats data from plugin */
  stats: PluginQuickStats
  
  /** Plugin color theme */
  color?: string
}

const INITIAL_VISIBLE_STREAKS = 9

export function QuickStatsSection({ stats, color = '#007AFF' }: QuickStatsSectionProps) {
  const { streaks, metrics } = stats
  const [showAllStreaks, setShowAllStreaks] = useState(false)

  const visibleStreaks = showAllStreaks 
    ? streaks 
    : streaks?.slice(0, INITIAL_VISIBLE_STREAKS)
  
  const hasMoreStreaks = (streaks?.length || 0) > INITIAL_VISIBLE_STREAKS

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white/90">Quick Stats (All-Time)</h2>

      {/* Streaks Section */}
      {streaks && streaks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white/70">Area Streaks</h3>
          
          {/* Compact Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {visibleStreaks?.map((streak, index) => {
              const isActive = streak.current > 0
              const unitLabel = streak.unit || 'day'
              const pluralUnit = (count: number) => 
                count === 1 ? unitLabel : `${unitLabel}s`
              
              return (
                <div
                  key={`${streak.label}-${index}`}
                  className={`
                    glass-panel rounded-lg p-4 
                    border transition-all duration-200
                    ${isActive 
                      ? 'border-green-500/30 bg-green-500/5' 
                      : 'border-white/5 hover:border-white/10'
                    }
                  `}
                >
                  {/* Area Name & Goal */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium text-white/90 truncate text-sm">
                      {streak.label}
                    </div>
                    <div className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 shrink-0 ml-2">
                      {streak.goal === 'daily' ? 'Daily streaks' : 
                       streak.goal?.includes('/wk') ? `Weekly: ${streak.goal}` :
                       streak.goal?.includes('/mo') ? `Monthly: ${streak.goal}` :
                       streak.goal || 'Daily streaks'}
                    </div>
                  </div>
                  
                  {/* Streak Numbers + Avg */}
                  <div className="space-y-2">
                    {/* Current & Best Streak with clear goal context */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-base">🔥</span>
                        <span className={`text-lg font-bold ${isActive ? 'text-green-400' : 'text-white/40'}`}>
                          {streak.current}
                        </span>
                        <span className="text-xs text-white/50">
                          {pluralUnit(streak.current)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-base">🏆</span>
                        <span className="text-lg font-bold text-yellow-400/80">
                          {streak.longest}
                        </span>
                        <span className="text-xs text-white/50">
                          best
                        </span>
                      </div>
                    </div>
                    
                    {/* Average per week - very explicit */}
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5">
                      <span className="text-xs text-white/50">Avg per week:</span>
                      <span className="text-sm font-bold text-blue-400">
                        {streak.weeklyAvg !== undefined 
                          ? streak.weeklyAvg.toFixed(1)
                          : '0.0'
                        }
                      </span>
                      <span className="text-xs text-white/50">times</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Show More Button */}
          {hasMoreStreaks && (
            <div className="text-center">
              <button
                onClick={() => setShowAllStreaks(!showAllStreaks)}
                className="px-4 py-2 text-sm text-white/70 hover:text-white/90 hover:bg-white/5 rounded-lg transition-colors"
              >
                {showAllStreaks 
                  ? `Show less` 
                  : `Show ${streaks.length - INITIAL_VISIBLE_STREAKS} more areas`
                }
              </button>
            </div>
          )}
        </div>
      )}

      {/* Metrics Section */}
      {metrics && metrics.length > 0 && (
        <div className="grid grid-cols-6 gap-4">
          {metrics.map((metric, index) => {
            // Check if this is the averages card with structured data
            const isAverages = typeof metric.value === 'object' && 
                              'daily' in metric.value && 
                              'weekly' in metric.value && 
                              'monthly' in metric.value
            const colSpan = isAverages ? 'col-span-3' : 'col-span-1'
            
            return (
              <div
                key={`${metric.label}-${index}`}
                className={`glass-panel rounded-xl p-4 ${colSpan}`}
                style={{
                  background: `linear-gradient(135deg, ${metric.color || color}10, transparent)`,
                }}
              >
                {/* Regular metric display */}
                {!isAverages && (
                  <>
                    {metric.icon && (
                      <div className="text-2xl mb-2">{metric.icon}</div>
                    )}
                    <div className="text-3xl font-bold text-white/90 mb-1">
                      {typeof metric.value === 'object' ? String(metric.value) : metric.value}
                    </div>
                    <div className="text-sm font-medium text-white/70 mb-1">
                      {metric.label}
                    </div>
                    {metric.subtitle && (
                      <div className="text-xs text-white/50">
                        {metric.subtitle}
                      </div>
                    )}
                  </>
                )}

                {/* Averages card with 3 subparts */}
                {isAverages && typeof metric.value === 'object' && 'daily' in metric.value && (
                  <>
                    <div className="text-sm font-medium text-white/70 mb-4">
                      {metric.label}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {/* Daily */}
                      <div className="text-center">
                        <div className="text-2xl mb-1">☀️</div>
                        <div className="text-2xl font-bold text-white/90 mb-1">
                          {metric.value.daily}
                        </div>
                        <div className="text-xs text-white/60">
                          Per Day
                        </div>
                      </div>
                      
                      {/* Weekly */}
                      <div className="text-center">
                        <div className="text-2xl mb-1">📅</div>
                        <div className="text-2xl font-bold text-white/90 mb-1">
                          {metric.value.weekly}
                        </div>
                        <div className="text-xs text-white/60">
                          Per Week
                        </div>
                      </div>
                      
                      {/* Monthly */}
                      <div className="text-center">
                        <div className="text-2xl mb-1">📊</div>
                        <div className="text-2xl font-bold text-white/90 mb-1">
                          {metric.value.monthly}
                        </div>
                        <div className="text-xs text-white/60">
                          Per Month
                        </div>
                      </div>
                    </div>
                    {metric.subtitle && (
                      <div className="text-xs text-white/50 mt-3 text-center">
                        {metric.subtitle}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {(!streaks || streaks.length === 0) && (!metrics || metrics.length === 0) && (
        <div className="text-center py-12 text-white/40">
          <p>No quick stats available</p>
          <p className="text-sm mt-2">Start tracking to see insights here</p>
        </div>
      )}
    </div>
  )
}
