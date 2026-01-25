/**
 * Insights Tab Bar
 * 
 * Tab navigation for switching between plugin insights
 */

'use client'

import { useMemo } from 'react'
import type { Plugin } from '@/sdk/interfaces/plugin.interface'

interface InsightsTabBarProps {
  /** Available plugins with insights */
  plugins: Plugin[]
  
  /** Currently active plugin ID */
  activePluginId: string
  
  /** Callback when tab is clicked */
  onTabChange: (pluginId: string) => void
}

export function InsightsTabBar({
  plugins,
  activePluginId,
  onTabChange,
}: InsightsTabBarProps) {
  // Filter plugins that have insights interface
  const insightPlugins = useMemo(() => {
    return plugins.filter(p => p.insights)
  }, [plugins])

  if (insightPlugins.length === 0) {
    return null
  }

  return (
    <div className="border-b border-white/10">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {insightPlugins.map((plugin) => {
          const isActive = plugin.id === activePluginId
          
          return (
            <button
              key={plugin.id}
              onClick={() => onTabChange(plugin.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium
                border-b-2 transition-all duration-150 whitespace-nowrap
                ${
                  isActive
                    ? 'border-[#007AFF] text-white'
                    : 'border-transparent text-white/60 hover:text-white/80 hover:border-white/20'
                }
              `}
            >
              <span className="text-lg">{plugin.metadata.icon}</span>
              <span>{plugin.metadata.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
