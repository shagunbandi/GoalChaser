'use client'

import type { DayConfig } from '@/types/year-view-config'

interface DayRendererProps {
  config: DayConfig
  isToday: boolean
}

export function DayRenderer({ config, isToday }: DayRendererProps) {
  const getIndicatorColor = (type: string, customColor?: string) => {
    if (customColor) return customColor

    switch (type) {
      case 'travel':
        return 'rgba(14,165,233,0.9)'
      case 'expense':
        return 'rgb(239,68,68)'
      case 'income':
        return 'rgb(34,197,94)'
      case 'sip':
        return 'rgb(59,130,246)'
      default:
        return 'rgba(255,255,255,0.6)'
    }
  }

  const getDayClasses = () => {
    const baseClasses =
      'h-8 rounded-lg text-[11px] font-medium border relative flex flex-col items-center justify-center gap-0.5 py-1 transition-all duration-150'

    if (config.highlighted || config.indicators.length > 0) {
      return `${baseClasses} border-white/15 bg-white/8 text-white shadow-[0_0_8px_rgba(255,255,255,0.1)]`
    }

    return `${baseClasses} border-white/[0.07] bg-transparent text-white/70 hover:border-white/12 hover:bg-white/4`
  }

  const todayClasses = isToday
    ? 'ring-2 ring-[#007AFF] ring-offset-1 ring-offset-[#1a1a2e]'
    : ''

  const multipleIndicators = config.indicators.length > 1

  return (
    <button
      onClick={config.onClick}
      className={`${getDayClasses()} ${todayClasses} ${
        multipleIndicators ? 'ring-1 ring-yellow-500/40' : ''
      }`}
      style={
        config.highlighted && config.highlightColor
          ? { backgroundColor: config.highlightColor }
          : undefined
      }
      title={
        config.indicators.length > 0
          ? `${config.indicators.length} item(s)`
          : undefined
      }
    >
      <span>{config.dayOfMonth}</span>

      {/* Indicators below the number */}
      {config.indicators.length > 0 && (
        <div className="flex gap-0.5 items-center">
          {config.indicators.slice(0, 3).map((indicator, idx) => (
            <span
              key={idx}
              className="h-1 w-1 rounded-full ring-1 ring-black/20"
              style={{
                backgroundColor: getIndicatorColor(
                  indicator.type,
                  indicator.color,
                ),
              }}
            />
          ))}
          {config.indicators.length > 3 && (
            <span className="text-[7px] font-bold text-white/80 leading-none ml-0.5">
              +{config.indicators.length - 3}
            </span>
          )}
        </div>
      )}
    </button>
  )
}
