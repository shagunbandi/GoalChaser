'use client'

import type { ReactNode } from 'react'

interface SectionProps {
  title?: string
  icon?: string
  children: ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  className?: string
}

export function Section({
  title,
  icon,
  children,
  collapsible = false,
  defaultExpanded = true,
  className = '',
}: SectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <div
          className={`flex items-center justify-between ${collapsible ? 'cursor-pointer' : ''}`}
          onClick={() => collapsible && setIsExpanded(!isExpanded)}
        >
          <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
            {icon && <span>{icon}</span>}
            {title}
          </h3>
          {collapsible && (
            <span className="text-white/30 text-xs">
              {isExpanded ? '▲' : '▼'}
            </span>
          )}
        </div>
      )}
      {(!collapsible || isExpanded) && <div>{children}</div>}
    </div>
  )
}

// Fix: Add React import for useState
import React from 'react'
