'use client'

import { ReactNode } from 'react'
import type { AddonId } from '@/types'

interface ColorTheme {
  bg: string
  border: string
  text: string
}

interface AddonSummaryCardProps {
  addon: AddonId
  icon: string
  title: string
  primaryMetric?: string
  expanded: boolean
  onToggle: () => void
  onNavigate?: () => void
  children: ReactNode
  color: ColorTheme
  collapsible?: boolean
}

export function AddonSummaryCard({
  icon,
  title,
  primaryMetric,
  expanded,
  onToggle,
  onNavigate,
  children,
  color,
  collapsible = true,
}: AddonSummaryCardProps) {
  return (
    <div
      className={`rounded-xl border p-3 ${color.bg} ${color.border} transition-all duration-200 hover:shadow-lg hover:shadow-white/5`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity active:scale-[0.98]"
          disabled={!collapsible}
        >
          <span className="text-sm shrink-0">{icon}</span>
          <span className="text-sm font-medium text-white/80 truncate">{title}</span>
        </button>
        
        <div className="flex items-center gap-2 shrink-0">
          {onNavigate && (
            <button
              onClick={onNavigate}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title={`View in ${title} page`}
            >
              <svg
                className="w-3.5 h-3.5 text-white/60 hover:text-white/90"
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
          {primaryMetric && (
            <span className={`text-xs md:text-sm font-semibold ${color.text}`}>
              {primaryMetric}
            </span>
          )}
          {collapsible && (
            <button
              onClick={onToggle}
              className="text-white/40 text-xs transition-transform duration-300 p-1"
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              disabled={!collapsible}
            >
              ▼
            </button>
          )}
        </div>
      </div>

      {/* Content with smooth animation */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={`mt-3 pt-3 border-t ${color.border} space-y-2`}>
          {children}
        </div>
      </div>
    </div>
  )
}
