'use client'

import { useState, useMemo, useEffect } from 'react'
import { PluginMetricsAggregator } from './PluginMetricsAggregator'
import { usePluginRegistry } from '@/core/plugin-registry/hooks'
import { useGoalData } from '@/hooks/useGoalData'
import { useAuth } from '@/hooks/useAuth'
import { useAddonsConfig } from '@/hooks/useAddonsConfig'
import { useAnalyticsConfig } from '@/hooks/useAnalyticsConfig'
import { DateRangeSelector, PluginFilter } from '@/sdk/analytics'
import type { DateRange, PluginFilterItem } from '@/sdk/analytics'

interface AnalyticsDashboardProps {
  goalId: string
}

export function AnalyticsDashboard({ goalId }: AnalyticsDashboardProps) {
  const { user } = useAuth()
  const { registry } = usePluginRegistry()
  const { goal, pluginData: rawPluginData, isLoading: loading } = useGoalData(goalId)
  const { enabledAddons } = useAddonsConfig(user?.uid, goalId)
  const { visiblePlugins: savedVisiblePlugins, isLoading: configLoading, saveVisiblePlugins } = useAnalyticsConfig(user?.uid, goalId)
  
  // Get all plugins from registry
  const plugins = registry.getAllPlugins()

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30) // Default: last 30 days
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  })

  // Plugin visibility state (which plugins are shown in analytics)
  const [visiblePlugins, setVisiblePlugins] = useState<Set<string>>(() => new Set())
  const [initialized, setInitialized] = useState(false)

  // Initialize visible plugins from Firebase config or enabled addons
  useEffect(() => {
    if (initialized || configLoading) return
    
    if (savedVisiblePlugins && savedVisiblePlugins.length > 0) {
      // Only include plugins that are still enabled
      const validPlugins = savedVisiblePlugins.filter(id => enabledAddons?.includes(id as any))
      if (validPlugins.length > 0) {
        setVisiblePlugins(new Set(validPlugins))
        setInitialized(true)
        return
      }
    }
    
    // Fallback: show all enabled addons
    if (enabledAddons && enabledAddons.length > 0 && !configLoading) {
      setVisiblePlugins(new Set(enabledAddons))
      setInitialized(true)
    }
  }, [savedVisiblePlugins, enabledAddons, configLoading, initialized])

  // Filter plugin data by date range
  const pluginData = useMemo(() => {
    const data: Record<string, Record<string, any>> = {}

    if (!loading && rawPluginData) {
      // rawPluginData is already organized by pluginId -> date -> data
      // Filter by date range
      enabledAddons.forEach(pluginId => {
        const pluginDates = rawPluginData[pluginId] || {}
        const filteredDates: Record<string, any> = {}
        
        Object.keys(pluginDates).forEach(date => {
          if (date >= dateRange.start && date <= dateRange.end) {
            filteredDates[date] = pluginDates[date]
          }
        })
        
        data[pluginId] = filteredDates
      })
    }

    return data
  }, [rawPluginData, dateRange, loading, enabledAddons])

  // Get list of enabled plugin IDs
  const enabledPluginIds = useMemo(() => {
    return enabledAddons || []
  }, [enabledAddons])

  // Get visible plugin IDs (after filter)
  const visiblePluginIds = useMemo(() => {
    return Array.from(visiblePlugins)
  }, [visiblePlugins])

  // Build plugin filter items
  const pluginFilterItems: PluginFilterItem[] = useMemo(() => {
    return enabledPluginIds
      .map(pluginId => {
        const plugin = plugins.find(p => p.id === pluginId)
        if (!plugin) return null
        return {
          id: plugin.id,
          name: plugin.metadata.name,
          icon: plugin.metadata.icon,
          enabled: visiblePlugins.has(plugin.id)
        }
      })
      .filter((item): item is PluginFilterItem => item !== null)
  }, [enabledPluginIds, plugins, visiblePlugins])

  // Handler for toggling plugin visibility
  const handlePluginToggle = (pluginId: string) => {
    setVisiblePlugins(prev => {
      const next = new Set(prev)
      if (next.has(pluginId)) {
        next.delete(pluginId)
      } else {
        next.add(pluginId)
      }
      // Save to Firebase
      saveVisiblePlugins(Array.from(next))
      return next
    })
  }

  // Handler for toggling all plugins
  const handleToggleAll = (enabled: boolean) => {
    const next = enabled ? new Set(enabledPluginIds) : new Set<string>()
    setVisiblePlugins(next)
    // Save to Firebase
    saveVisiblePlugins(Array.from(next))
  }

  if (loading || configLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/60">Loading analytics...</div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white/90">Analytics</h1>
        
        {/* Date Range Selector */}
        <DateRangeSelector
          value={dateRange}
          onChange={setDateRange}
          showCustomInputs={true}
        />

        {/* Plugin Filter */}
        {pluginFilterItems.length > 1 && (
          <PluginFilter
            plugins={pluginFilterItems}
            onToggle={handlePluginToggle}
            onToggleAll={handleToggleAll}
          />
        )}
      </div>

      {/* Analytics Content */}
      <PluginMetricsAggregator
        plugins={plugins}
        enabledPluginIds={enabledPluginIds}
        visiblePluginIds={visiblePluginIds}
        startDate={dateRange.start}
        endDate={dateRange.end}
        pluginData={pluginData}
      />
    </div>
  )
}
