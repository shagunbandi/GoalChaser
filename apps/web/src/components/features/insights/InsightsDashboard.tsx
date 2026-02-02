/**
 * Insights Dashboard
 * 
 * Main insights interface with tab-based plugin navigation
 */

'use client'

import { useState, useMemo, useEffect } from 'react'
import { usePluginRegistry } from '@/core/plugin-registry/hooks'
import { useGoalData } from '@/hooks/useGoalData'
import { useAuth } from '@/hooks/useAuth'
import { useAddonsConfig } from '@/hooks/useAddonsConfig'
import { InsightsTabBar } from './InsightsTabBar'
import { QuickStatsSection } from './QuickStatsSection'
import { TimeRangeSelector } from './TimeRangeSelector'
import { PeriodAnalysisSection } from './PeriodAnalysisSection'
import { DEFAULT_TIME_RANGES } from '@goal-chaser/sdk'
import type { TimeRangeOption } from '@goal-chaser/sdk'

interface InsightsDashboardProps {
  goalId: string
}

export function InsightsDashboard({ goalId }: InsightsDashboardProps) {
  const { user } = useAuth()
  const { registry } = usePluginRegistry()
  const { goal, pluginData: rawPluginData, pluginConfigs: rawPluginConfigs, isLoading: loading } = useGoalData(goalId)
  const { enabledAddons } = useAddonsConfig(user?.uid, goalId)
  
  // Get all plugins from registry
  const plugins = registry.getAllPlugins()
  
  // Filter to enabled plugins with insights
  const insightPlugins = useMemo(() => {
    if (!enabledAddons) {
      return []
    }
    
    return plugins.filter(p => {
      const isEnabled = enabledAddons.includes(p.id as any)
      const hasInsights = !!p.insights
      return isEnabled && hasInsights
    })
  }, [plugins, enabledAddons])

  // Active plugin tab
  const [activePluginId, setActivePluginId] = useState<string>('')

  // Update active plugin when plugins load
  useEffect(() => {
    if (!activePluginId && insightPlugins.length > 0) {
      setActivePluginId(insightPlugins[0].id)
    }
  }, [activePluginId, insightPlugins])

  // Per-plugin time range selections (stored in component state for now)
  const [timeRanges, setTimeRanges] = useState<Record<string, string>>({})

  // Update active plugin if it becomes unavailable
  useEffect(() => {
    if (activePluginId && !insightPlugins.find(p => p.id === activePluginId)) {
      setActivePluginId(insightPlugins[0]?.id || '')
    }
  }, [activePluginId, insightPlugins])

  // Get current plugin
  const currentPlugin = useMemo(() => {
    return insightPlugins.find(p => p.id === activePluginId)
  }, [insightPlugins, activePluginId])

  // Get time range options for current plugin
  const timeRangeOptions = useMemo(() => {
    if (!currentPlugin?.insights?.defaultTimeRanges) {
      return DEFAULT_TIME_RANGES.slice(0, 3) // Default: show first 3 options
    }
    return currentPlugin.insights.defaultTimeRanges
  }, [currentPlugin])

  // Get selected time range for current plugin
  const selectedTimeRangeId = useMemo(() => {
    if (timeRanges[activePluginId]) {
      return timeRanges[activePluginId]
    }
    // Default to first option (usually "Last 7 days" or "Last 30 days")
    return timeRangeOptions[0]?.id || 'last-30'
  }, [timeRanges, activePluginId, timeRangeOptions])

  // Calculate date range from selected option
  const dateRange = useMemo(() => {
    const option = timeRangeOptions.find(o => o.id === selectedTimeRangeId)
    if (!option) {
      return { start: '', end: '' }
    }
    
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - option.days)
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    }
  }, [selectedTimeRangeId, timeRangeOptions])

  // Get all data for current plugin (for quick stats)
  const allPluginData = useMemo(() => {
    if (!rawPluginData || !activePluginId) return {}
    return rawPluginData[activePluginId] || {}
  }, [rawPluginData, activePluginId])
  
  // Get plugin config for current plugin
  const pluginConfig = useMemo(() => {
    if (!rawPluginConfigs || !activePluginId) return null
    return rawPluginConfigs[activePluginId] || null
  }, [rawPluginConfigs, activePluginId])

  // Get period data for current plugin (filtered by date range)
  const periodPluginData = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return {}
    
    const filtered: Record<string, any> = {}
    Object.entries(allPluginData).forEach(([date, data]) => {
      if (date >= dateRange.start && date <= dateRange.end) {
        filtered[date] = data
      }
    })
    
    return filtered
  }, [allPluginData, dateRange])

  // Calculate quick stats
  const quickStats = useMemo(() => {
    if (!currentPlugin?.insights?.getQuickStats) return null
    return currentPlugin.insights.getQuickStats(allPluginData, pluginConfig)
  }, [currentPlugin, allPluginData, pluginConfig])

  // Calculate period insights
  const periodInsights = useMemo(() => {
    if (!currentPlugin?.insights?.getPeriodInsights) return null
    return currentPlugin.insights.getPeriodInsights(
      dateRange.start,
      dateRange.end,
      periodPluginData,
      pluginConfig
    )
  }, [currentPlugin, dateRange, periodPluginData, pluginConfig])

  // Handle time range change
  const handleTimeRangeChange = (optionId: string) => {
    setTimeRanges(prev => ({
      ...prev,
      [activePluginId]: optionId,
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/60">Loading insights...</div>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/60">Goal not found</div>
      </div>
    )
  }

  if (insightPlugins.length === 0) {
    // Check if any plugins have insights at all
    const pluginsWithInsights = plugins.filter(p => p.insights)
    
    if (pluginsWithInsights.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-white/40">
            <p className="text-lg mb-2">No insights available yet</p>
            <p className="text-sm">Insights are being rolled out to plugins</p>
          </div>
        </div>
      )
    }
    
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-white/40">
          <p className="text-lg mb-2">No insights available</p>
          <p className="text-sm mb-4">
            Enable plugins with insights to see them here
          </p>
          <div className="text-sm text-white/60">
            <p className="mb-1">Plugins with insights:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {pluginsWithInsights.map(p => (
                <span key={p.id} className="px-3 py-1 bg-white/5 rounded-lg">
                  {p.metadata.icon} {p.metadata.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentPlugin) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white/90 mb-2">Insights</h1>
        <p className="text-sm text-white/60">
          Analyze your progress and patterns
        </p>
      </div>

      {/* Tab Navigation */}
      <InsightsTabBar
        plugins={insightPlugins}
        activePluginId={activePluginId}
        onTabChange={setActivePluginId}
      />

      {/* Content */}
      <div className="space-y-8">
        {/* Quick Stats (Time-agnostic) */}
        {quickStats && (
          <QuickStatsSection
            stats={quickStats}
            color={currentPlugin.metadata.icon ? undefined : '#007AFF'}
          />
        )}

        {/* Period Analysis Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-lg font-semibold text-white/90">Period Analysis</h2>
          <TimeRangeSelector
            options={timeRangeOptions}
            selectedId={selectedTimeRangeId}
            onChange={handleTimeRangeChange}
          />
        </div>

        {/* Period Analysis Section */}
        {periodInsights && (
          <PeriodAnalysisSection
            insights={periodInsights}
            startDate={dateRange.start}
            endDate={dateRange.end}
            color={currentPlugin.metadata.icon ? undefined : '#007AFF'}
          />
        )}

        {/* Plugin custom view (e.g. map + dates table for travel) */}
        {(() => {
          const CustomView = currentPlugin.insights?.customView
          if (!CustomView) return null
          return (
            <CustomView
              goalId={goalId}
              pluginData={allPluginData}
              pluginConfig={pluginConfig}
            />
          )
        })()}
      </div>
    </div>
  )
}
