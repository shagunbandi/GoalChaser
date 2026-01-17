/**
 * Summary Card Component
 * 
 * A beautiful glassmorphic card with header, icon, badge, content, and footer.
 * Used for displaying plugin summaries in detail panels.
 */

'use client'

import React from 'react'

export interface SummaryCardProps {
  /** Title text */
  title: string
  
  /** Optional subtitle */
  subtitle?: string
  
  /** Icon emoji or text */
  icon?: string
  
  /** Badge text (e.g., count, status) */
  badge?: string | number
  
  /** Gradient colors for the icon background */
  gradient?: {
    from: string
    to: string
  }
  
  /** Main color (used if no gradient provided) */
  color?: string
  
  /** Content to render in the card body */
  children?: React.ReactNode
  
  /** Footer content (usually action buttons) */
  footer?: React.ReactNode
  
  /** Whether to show hover effects */
  hoverable?: boolean
  
  /** Additional CSS classes */
  className?: string
}

export function SummaryCard({
  title,
  subtitle,
  icon,
  badge,
  gradient,
  color,
  children,
  footer,
  hoverable = false,
  className = '',
}: SummaryCardProps) {
  return (
    <div
      className={`
        border border-white/10 rounded-xl overflow-hidden
        bg-white/5 backdrop-blur-sm
        ${hoverable ? 'hover:bg-white/[0.07] transition-colors duration-200' : ''}
        ${className}
      `}
      style={
        gradient
          ? {
              background: `linear-gradient(135deg, ${gradient.from}10, ${gradient.to}10)`,
            }
          : undefined
      }
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{
                backgroundColor: gradient
                  ? `${gradient.from}40`
                  : color
                  ? `${color}30`
                  : 'rgba(255,255,255,0.1)',
              }}
            >
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white/90 truncate">
                {title}
              </h3>
              {badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/70 shrink-0">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-white/50 mt-1 truncate">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {children && <div className="px-4 py-4">{children}</div>}

      {/* Footer */}
      {footer && (
        <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02]">
          {footer}
        </div>
      )}
    </div>
  )
}

/**
 * Primary Action Button
 * Styled button component for card footers
 */
export interface ActionButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  className?: string
}

export function ActionButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
}: ActionButtonProps) {
  const variantClasses = {
    primary: 'bg-[#007AFF] hover:bg-[#0066DD] text-white',
    secondary: 'bg-white/10 hover:bg-white/15 text-white/80',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full px-4 py-2.5 rounded-xl font-medium text-sm
        transition-all duration-200
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  )
}

/**
 * Stat Grid
 * Display stats in a 2-column grid
 */
export interface StatGridProps {
  stats: Array<{
    label: string
    value: string | number
    icon?: string
    color?: string
    subtitle?: string
  }>
}

export function StatGrid({ stats }: StatGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="px-3 py-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors"
        >
          {stat.icon && <div className="text-lg mb-1">{stat.icon}</div>}
          <div
            className="text-lg font-bold text-white/90"
            style={stat.color ? { color: stat.color } : undefined}
          >
            {stat.value}
          </div>
          <div className="text-xs text-white/50 mt-1">{stat.label}</div>
          {stat.subtitle && (
            <div className="text-[10px] text-white/40 mt-0.5">{stat.subtitle}</div>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * Item List
 * Display items in a vertical list
 */
export interface ItemListProps {
  items: Array<{
    id: string
    label: string
    value?: string | number
    icon?: string
    color?: string
    subtitle?: string
    onClick?: () => void
  }>
}

export function ItemList({ items }: ItemListProps) {
  return (
    <div className="divide-y divide-white/5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={item.onClick}
          disabled={!item.onClick}
          className={`
            w-full px-4 py-3 flex items-center justify-between gap-3
            transition-colors
            ${item.onClick ? 'hover:bg-white/[0.05] cursor-pointer' : 'cursor-default'}
          `}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {item.icon && <span className="text-lg shrink-0">{item.icon}</span>}
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm text-white/80 truncate">{item.label}</span>
              {item.subtitle && (
                <span className="text-xs text-white/40 mt-0.5 truncate">
                  {item.subtitle}
                </span>
              )}
            </div>
          </div>
          {item.value && (
            <span
              className="text-sm font-semibold text-white/70 shrink-0"
              style={item.color ? { color: item.color } : undefined}
            >
              {item.value}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
