'use client'

/**
 * Plugin Filter Component
 * Toggle visibility of plugins in analytics views
 */

export interface PluginFilterItem {
  id: string
  name: string
  icon: string
  enabled: boolean
}

export interface PluginFilterProps {
  /** List of plugins with their visibility state */
  plugins: PluginFilterItem[]
  /** Callback when a plugin is toggled */
  onToggle: (pluginId: string) => void
  /** Callback to toggle all plugins */
  onToggleAll?: (enabled: boolean) => void
  /** Compact horizontal layout */
  compact?: boolean
}

export function PluginFilter({
  plugins,
  onToggle,
  onToggleAll,
  compact = false,
}: PluginFilterProps) {
  const allEnabled = plugins.every(p => p.enabled)
  const someEnabled = plugins.some(p => p.enabled)

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {onToggleAll && (
          <button
            onClick={() => onToggleAll(!allEnabled)}
            className={`
              px-3 py-1.5 text-sm rounded-lg transition-colors
              ${allEnabled
                ? 'bg-[#007AFF] text-white'
                : 'bg-white/5 hover:bg-white/10 text-white/70'
              }
            `}
          >
            All
          </button>
        )}
        {plugins.map((plugin) => (
          <button
            key={plugin.id}
            onClick={() => onToggle(plugin.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors
              ${plugin.enabled
                ? 'bg-white/10 text-white/90'
                : 'bg-white/5 text-white/40 hover:bg-white/8'
              }
            `}
          >
            <span>{plugin.icon}</span>
            <span>{plugin.name}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="glass-panel rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/70">Show Plugins</h3>
        {onToggleAll && (
          <button
            onClick={() => onToggleAll(!allEnabled)}
            className="text-xs text-[#007AFF] hover:text-[#0066DD] transition-colors"
          >
            {allEnabled ? 'Hide All' : someEnabled ? 'Show All' : 'Show All'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {plugins.map((plugin) => (
          <button
            key={plugin.id}
            onClick={() => onToggle(plugin.id)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-all
              border
              ${plugin.enabled
                ? 'bg-white/10 border-white/20 text-white/90'
                : 'bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/5'
              }
            `}
          >
            <span className="text-lg">{plugin.icon}</span>
            <span className="text-sm">{plugin.name}</span>
            <div 
              className={`
                w-2 h-2 rounded-full transition-colors
                ${plugin.enabled ? 'bg-green-400' : 'bg-white/20'}
              `}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
