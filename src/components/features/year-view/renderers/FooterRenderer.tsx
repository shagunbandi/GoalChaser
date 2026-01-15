'use client'

import type { MonthFooterItem } from '@/types/year-view-config'

interface FooterRendererProps {
  items: MonthFooterItem[]
}

export function FooterRenderer({ items }: FooterRendererProps) {
  if (items.length === 0) {
    return <div className="text-[11px] text-white/40">No data</div>
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'budget':
        return '💵'
      case 'sip':
        return '📈'
      case 'travel':
        return '✈️'
      default:
        return null
    }
  }

  const getColorForType = (type: string, customColor?: string) => {
    if (customColor) return customColor

    switch (type) {
      case 'budget':
        return 'rgb(34,197,94)'
      case 'sip':
        return 'rgb(59,130,246)'
      case 'travel':
        return 'rgba(14,165,233,0.9)'
      default:
        return 'rgba(255,255,255,0.5)'
    }
  }

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = []
    }
    acc[item.type].push(item)
    return acc
  }, {} as Record<string, MonthFooterItem[]>)

  return (
    <div className="space-y-3">
      {Object.entries(groupedItems).map(([type, typeItems]) => (
        <div key={type}>
          {type !== 'custom' && (
            <div className="text-[10px] text-white/50 mb-1.5 font-medium uppercase tracking-wide">
              {getIconForType(type)} {type}s
            </div>
          )}
          <div className="space-y-1.5">
            {typeItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 text-[11px]"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: getColorForType(item.type, item.color),
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white/80 truncate">{item.title}</div>
                  {item.subtitle && (
                    <div className="text-[10px] text-white/60">
                      {item.subtitle}
                    </div>
                  )}
                </div>
                {item.actionButton && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      item.actionButton!.onClick()
                    }}
                    className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
                  >
                    {item.actionButton.icon}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
