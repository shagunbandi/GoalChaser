'use client'

import { useState, useRef, useEffect } from 'react'

interface PluginInfo {
  id: string
  name: string
  icon: string
}

interface CalendarFiltersProps {
  availablePlugins: PluginInfo[]
  visibleIndicators: Set<string>
  backgroundSource: string | null
  onToggleIndicator: (pluginId: string) => void
  onChangeBackground: (pluginId: string | null) => void
  compact?: boolean
}

export function CalendarFilters({
  availablePlugins,
  visibleIndicators,
  backgroundSource,
  onToggleIndicator,
  onChangeBackground,
  compact = false,
}: CalendarFiltersProps) {
  const [showIndicatorsMenu, setShowIndicatorsMenu] = useState(false)
  const [showBackgroundMenu, setShowBackgroundMenu] = useState(false)
  const indicatorsRef = useRef<HTMLDivElement>(null)
  const backgroundRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        indicatorsRef.current &&
        !indicatorsRef.current.contains(event.target as Node)
      ) {
        setShowIndicatorsMenu(false)
      }
      if (
        backgroundRef.current &&
        !backgroundRef.current.contains(event.target as Node)
      ) {
        setShowBackgroundMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get visible count
  const visibleCount = visibleIndicators.size

  // Get background name
  const backgroundName = backgroundSource
    ? availablePlugins.find((p) => p.id === backgroundSource)?.name || 'Unknown'
    : 'None'

  return (
    <div className={compact ? 'flex items-center gap-2' : 'bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3'}>
      <div className={compact ? 'flex items-center gap-2' : 'flex flex-wrap items-center gap-3'}>
        {/* Indicators Dropdown */}
        <div className="relative" ref={indicatorsRef}>
          <button
            onClick={() => {
              setShowIndicatorsMenu(!showIndicatorsMenu)
              setShowBackgroundMenu(false)
            }}
            className={`
              flex items-center gap-1.5 rounded-lg
              bg-white/[0.05] hover:bg-white/[0.08]
              border border-white/10 hover:border-white/20
              text-white transition-all duration-200
              ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}
            `}
          >
            <span className={compact ? 'text-sm' : 'text-base'}>👁️</span>
            <span className="font-medium">
              {visibleCount} selected
            </span>
            <span className="text-white/40 text-[10px]">▼</span>
          </button>

          {showIndicatorsMenu && (
            <div
              className="
                absolute top-full left-0 mt-2 z-50
                min-w-[180px]
                bg-[#1c1c1e] backdrop-blur-xl
                border border-white/20
                rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)]
                overflow-hidden
              "
            >
              <div className="p-2 space-y-1">
                {availablePlugins.map((plugin) => (
                  <button
                    key={plugin.id}
                    onClick={() => onToggleIndicator(plugin.id)}
                    className="
                      w-full flex items-center gap-2 px-2 py-1.5 rounded-lg
                      hover:bg-white/[0.08] text-white transition-all duration-200
                      text-xs
                    "
                  >
                    <span className="text-sm">{plugin.icon}</span>
                    <span className="flex-1 text-left font-medium">{plugin.name}</span>
                    {visibleIndicators.has(plugin.id) && (
                      <span className="text-[#007AFF] text-base">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Background Dropdown */}
        <div className="relative" ref={backgroundRef}>
          <button
            onClick={() => {
              setShowBackgroundMenu(!showBackgroundMenu)
              setShowIndicatorsMenu(false)
            }}
            className={`
              flex items-center gap-1.5 rounded-lg
              bg-white/[0.05] hover:bg-white/[0.08]
              border border-white/10 hover:border-white/20
              text-white transition-all duration-200
              ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}
            `}
          >
            <span className={compact ? 'text-sm' : 'text-base'}>🎨</span>
            <span className="font-medium">
              {backgroundName}
            </span>
            <span className="text-white/40 text-[10px]">▼</span>
          </button>

          {showBackgroundMenu && (
            <div
              className="
                absolute top-full left-0 mt-2 z-50
                min-w-[180px]
                bg-[#1c1c1e] backdrop-blur-xl
                border border-white/20
                rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)]
                overflow-hidden
              "
            >
              <div className="p-2 space-y-1">
                {/* None option */}
                <button
                  onClick={() => {
                    onChangeBackground(null)
                    setShowBackgroundMenu(false)
                  }}
                  className="
                    w-full flex items-center gap-2 px-2 py-1.5 rounded-lg
                    hover:bg-white/[0.08] text-white transition-all duration-200
                    text-xs
                  "
                >
                  <span className="text-sm">○</span>
                  <span className="flex-1 text-left font-medium">None</span>
                  {backgroundSource === null && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]" />
                  )}
                </button>

                {/* Plugin options */}
                {availablePlugins.map((plugin) => (
                  <button
                    key={plugin.id}
                    onClick={() => {
                      onChangeBackground(plugin.id)
                      setShowBackgroundMenu(false)
                    }}
                    className="
                      w-full flex items-center gap-2 px-2 py-1.5 rounded-lg
                      hover:bg-white/[0.08] text-white transition-all duration-200
                      text-xs
                    "
                  >
                    <span className="text-sm">{plugin.icon}</span>
                    <span className="flex-1 text-left font-medium">{plugin.name}</span>
                    {backgroundSource === plugin.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
