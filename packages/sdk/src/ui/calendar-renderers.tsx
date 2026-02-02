'use client'

import React from 'react'
import Link from 'next/link'
import type {
  CalendarSummaryConfig,
  CalendarSummaryAction,
  StatItem,
  ListItem,
} from '../interfaces/plugin.interface'

/**
 * Props for summary renderer components
 */
interface SummaryRendererProps {
  config: CalendarSummaryConfig
  onActionClick?: (action: CalendarSummaryAction) => void
}

/**
 * Action button component that handles both URL and onClick actions
 */
function ActionButton({
  action,
  onClick,
  className,
}: {
  action: CalendarSummaryAction
  onClick?: () => void
  className: string
}) {
  const content = (
    <>
      {action.icon && <span className="mr-1">{action.icon}</span>}
      {action.label}
    </>
  )

  if (action.url) {
    return (
      <Link href={action.url} className={className} onClick={onClick}>
        {content}
      </Link>
    )
  }

  return (
    <button
      onClick={() => {
        action.onClick?.()
        onClick?.()
      }}
      className={className}
    >
      {content}
    </button>
  )
}

/**
 * Helper to render a row of stats
 */
function StatsRow({ stats }: { stats: StatItem[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08]"
        >
          {stat.icon && <span className="text-sm">{stat.icon}</span>}
          <span
            className="text-sm font-semibold"
            style={stat.color ? { color: stat.color } : undefined}
          >
            {stat.value}
          </span>
          <span className="text-xs text-white/50">{stat.label}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Helper to render list items
 */
function ListItems({ items }: { items: ListItem[] }) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={item.onClick}
          disabled={!item.onClick}
          className={`
            w-full px-3 py-2.5 flex items-center justify-between gap-3 rounded-lg
            transition-colors bg-white/[0.02] border border-white/[0.05]
            ${
              item.onClick
                ? 'hover:bg-white/[0.06] cursor-pointer'
                : 'cursor-default'
            }
          `}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {item.icon && (
              <span className="text-base shrink-0">{item.icon}</span>
            )}
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm text-white/80 truncate">
                {item.label}
              </span>
              {item.subtitle && (
                <span className="text-xs text-white/40">{item.subtitle}</span>
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

/**
 * Unified Summary Card - Chip with optional Accordion
 *
 * Design:
 * - Always shows chip-like header with icon, title, badge, subtitle
 * - Actions (like "View Details") always visible in header
 * - If has content (stats or items), shows accordion arrow
 * - Clicking expands to show stats grid or list items
 * - If no content, no accordion arrow
 */
export function UnifiedSummaryCard({
  config,
  onActionClick,
}: SummaryRendererProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const {
    icon,
    title,
    subtitle,
    stats,
    sections,
    items,
    content,
    color,
    gradient,
    actions,
    badge,
  } = config

  // Convert content object to stats format (for backwards compatibility with card type)
  const contentAsStats: StatItem[] | undefined = React.useMemo(() => {
    if (content && typeof content === 'object' && !Array.isArray(content)) {
      return Object.entries(content as Record<string, any>).map(
        ([label, value]) => ({
          label,
          value: String(value),
        }),
      )
    }
    return undefined
  }, [content])

  // Determine if we have expandable content
  const effectiveStats = stats || contentAsStats
  const hasStats =
    (effectiveStats && effectiveStats.length > 0) ||
    (sections && sections.length > 0)
  const hasItems = items && items.length > 0
  const hasExpandableContent = hasStats || hasItems

  return (
    <div
      className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.03] hover:bg-white/[0.05] transition-all duration-200"
      style={
        gradient
          ? {
              background: `linear-gradient(135deg, ${gradient.from}12, ${gradient.to}08)`,
              borderColor: `${gradient.from}25`,
            }
          : undefined
      }
    >
      {/* Header - Always visible, chip-like */}
      <div
        className={`px-4 py-3 flex items-center gap-3 ${
          hasExpandableContent ? 'cursor-pointer' : ''
        }`}
        onClick={() => hasExpandableContent && setIsOpen(!isOpen)}
      >
        {/* Icon */}
        {icon && (
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform duration-200"
            style={{
              backgroundColor: gradient
                ? `${gradient.from}30`
                : color
                ? `${color}25`
                : 'rgba(255,255,255,0.08)',
            }}
          >
            {icon}
          </div>
        )}

        {/* Title & Subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white/90 truncate">
              {title}
            </h3>
            {badge && (
              <span
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide shrink-0"
                style={{
                  backgroundColor: gradient
                    ? `${gradient.from}25`
                    : color
                    ? `${color}20`
                    : 'rgba(255,255,255,0.1)',
                  color: gradient?.from || color || 'rgba(255,255,255,0.7)',
                }}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-white/50 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div
            className="flex items-center gap-2 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {actions.map((action, idx) => (
              <ActionButton
                key={idx}
                action={action}
                onClick={() => onActionClick?.(action)}
                className={`
                  text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200
                  ${
                    action.variant === 'primary'
                      ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : ''
                  }
                  ${
                    action.variant === 'danger'
                      ? 'bg-red-500/15 hover:bg-red-500/25 text-red-400'
                      : ''
                  }
                  ${
                    !action.variant || action.variant === 'secondary'
                      ? 'bg-white/10 hover:bg-white/15 text-white/80'
                      : ''
                  }
                `}
              />
            ))}
          </div>
        )}

        {/* Accordion Arrow */}
        {hasExpandableContent && (
          <div className="shrink-0 ml-1">
            <svg
              className={`w-4 h-4 text-white/40 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Expandable Content */}
      {hasExpandableContent && isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-white/[0.06] animate-in slide-in-from-top-2 duration-200">
          {/* Stats */}
          {hasStats && (
            <div className="space-y-3">
              {sections && sections.length > 0
                ? sections.map((section, sectionIdx) => (
                    <div key={sectionIdx}>
                      <div className="text-[10px] font-medium text-white/40 uppercase tracking-wide mb-2">
                        {section.title}
                      </div>
                      <StatsRow stats={section.stats} />
                    </div>
                  ))
                : effectiveStats && <StatsRow stats={effectiveStats} />}
            </div>
          )}

          {/* List Items */}
          {hasItems && !hasStats && <ListItems items={items!} />}

          {/* Both stats and items */}
          {hasStats && hasItems && (
            <div className="mt-3">
              <ListItems items={items!} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Main renderer component - uses unified design for all types
 */
export function CalendarSummaryRenderer({
  config,
  onActionClick,
}: SummaryRendererProps) {
  // Custom render still supported
  if (config.type === 'custom' && config.customRender) {
    return <>{config.customRender()}</>
  }

  // All types use the unified card
  return <UnifiedSummaryCard config={config} onActionClick={onActionClick} />
}
