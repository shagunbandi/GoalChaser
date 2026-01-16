'use client'

import { useState, useMemo } from 'react'
import { PluginMetricsAggregator } from './PluginMetricsAggregator'
import { usePluginRegistry } from '@/core/plugin-registry/hooks'
import { useGoalData } from '@/hooks/useGoalData'
import { useAuth } from '@/hooks/useAuth'
import { useAddonsConfig } from '@/hooks/useAddonsConfig'
import type { Plugin } from '@/sdk/interfaces/plugin.interface'

interface AnalyticsDashboardProps {
  goalId: string
}

export function AnalyticsDashboard({ goalId }: AnalyticsDashboardProps) {
  const { user } = useAuth()
  const { registry } = usePluginRegistry()
  const { goal, pluginData: rawPluginData, isLoading: loading } = useGoalData(goalId)
  const { enabledAddons } = useAddonsConfig(user?.uid, goalId)
  
  // Get all plugins from registry
  const plugins = registry.getAllPlugins()

  // Date range state
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30) // Default: last 30 days
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  })

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
    return Object.keys(enabledAddons || {})
  }, [enabledAddons])

  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [type]: value }))
  }

  const setPresetRange = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    })
  }

  if (loading) {
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
        <div className="glass-panel rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-white/60">From:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white/90 text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-white/60">To:</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white/90 text-sm"
              />
            </div>
          </div>

          {/* Preset ranges */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Last 7 days', days: 7 },
              { label: 'Last 30 days', days: 30 },
              { label: 'Last 90 days', days: 90 },
              { label: 'Last 6 months', days: 180 },
              { label: 'Last year', days: 365 }
            ].map((preset) => (
              <button
                key={preset.days}
                onClick={() => setPresetRange(preset.days)}
                className="px-3 py-1.5 text-sm rounded bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Content */}
      <PluginMetricsAggregator
        plugins={plugins}
        enabledPluginIds={enabledPluginIds}
        startDate={dateRange.start}
        endDate={dateRange.end}
        pluginData={pluginData}
      />
    </div>
  )
}
