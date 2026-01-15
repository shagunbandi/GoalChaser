'use client'

import type { ActivityCardConfig } from '@/types/activity-card-config'

interface ActivityCardProps {
  config: ActivityCardConfig
}

export function ActivityCard({ config }: ActivityCardProps) {
  const {
    type,
    icon,
    title,
    items,
    totalAmount,
    color,
    expanded,
    onToggle,
    onViewClick,
    collapsible = true,
  } = config

  if (items.length === 0) return null

  const formatAmount = (amount: number) => {
    const prefix = type === 'expense' ? '-' : type === 'income' ? '+' : ''
    return `${prefix}₹${amount.toLocaleString('en-IN')}`
  }

  return (
    <div
      className={`rounded-lg border p-3 ${color.bg} ${color.border}`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
        disabled={!collapsible}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/70 font-medium">
            {icon} {title}
          </span>
          {onViewClick && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onViewClick()
              }}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title={`View in ${type === 'travel' ? 'Travel' : 'Budget'} view`}
            >
              <svg
                className="w-3 h-3 text-white/60 hover:text-white/90"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {totalAmount !== undefined && (
            <span className={`text-xs font-semibold ${color.text}`}>
              {formatAmount(totalAmount)}
            </span>
          )}
          {collapsible && (
            <span className="text-white/40 text-xs">
              {expanded ? '▲' : '▼'}
            </span>
          )}
        </div>
      </button>

      {expanded && items.length > 0 && (
        <div className={`space-y-1.5 mt-2 pt-2 border-t ${color.border}`}>
          {items.map((item) => (
            <div key={item.id}>
              <div className="flex justify-between text-[11px]">
                <span className="text-white/60 flex-1 truncate">
                  {item.label}
                </span>
                {item.amount !== undefined && (
                  <span className="text-white/80 ml-2">
                    {formatAmount(item.amount)}
                  </span>
                )}
              </div>
              {item.subtitle && (
                <div className="text-[10px] text-white/40 mt-0.5">
                  {item.subtitle}
                </div>
              )}
              {item.note && (
                <div className="text-[11px] text-white/50 mt-1">
                  {item.note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
