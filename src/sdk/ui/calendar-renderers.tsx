'use client'

import React from 'react'
import Link from 'next/link'
import type {
  CalendarSummaryConfig,
  CalendarSummaryAction,
  StatItem,
  StatSection,
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
 * Chip renderer - compact single-line summary
 */
export function SummaryChip({ config, onActionClick }: SummaryRendererProps) {
  const { icon, title, subtitle, content, color, badge, actions, gradient } =
    config

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.07] transition-all duration-200 group"
      style={
        gradient
          ? {
              background: `linear-gradient(135deg, ${gradient.from}15, ${gradient.to}15)`,
            }
          : undefined
      }
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110"
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
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white/90">{title}</span>
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/70">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <span className="text-xs text-white/50 mt-0.5">{subtitle}</span>
          )}
          {content && (
            <span
              className="text-sm text-white/70 mt-1"
              style={color ? { color } : undefined}
            >
              {typeof content === 'object' ? JSON.stringify(content) : content}
            </span>
          )}
        </div>
      </div>

      {actions && actions.length > 0 && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions.map((action, idx) => (
            <ActionButton
              key={idx}
              action={action}
              onClick={() => onActionClick?.(action)}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200 font-medium"
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Accordion renderer - expandable summary with details
 */
export function SummaryAccordion({
  config,
  onActionClick,
}: SummaryRendererProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const { icon, title, subtitle, content, color, actions, badge, gradient } =
    config

  return (
    <div
      className="border border-white/10 rounded-xl overflow-hidden bg-white/5"
      style={
        gradient
          ? {
              background: `linear-gradient(135deg, ${gradient.from}10, ${gradient.to}10)`,
            }
          : undefined
      }
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.05] transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
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
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white/90">
                {title}
              </span>
              {badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/70">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-white/60 transition-transform ${
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
      </button>

      {/* Content */}
      {isOpen && content && (
        <div className="px-4 py-3 border-t border-white/10">
          <div
            className="text-sm text-white/70 mb-3"
            style={color ? { color } : undefined}
          >
            {typeof content === 'object' ? (
              <div className="space-y-2">
                {Object.entries(content).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-white/50">{key}:</span>
                    <span className="text-white/80 font-medium">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              content
            )}
          </div>

          {actions && actions.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              {actions.map((action, idx) => (
                <ActionButton
                  key={idx}
                  action={action}
                  onClick={() => onActionClick?.(action)}
                  className={`
                    text-xs px-3 py-1.5 rounded font-medium transition-colors
                    ${
                      action.variant === 'primary'
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : ''
                    }
                    ${
                      action.variant === 'danger'
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : ''
                    }
                    ${
                      !action.variant || action.variant === 'secondary'
                        ? 'bg-white/10 hover:bg-white/20 text-white/80'
                        : ''
                    }
                  `}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Card renderer - full-featured summary card
 */
export function SummaryCard({ config, onActionClick }: SummaryRendererProps) {
  const { icon, title, subtitle, content, color, actions, badge, gradient } =
    config

  return (
    <div
      className="border border-white/10 rounded-xl overflow-hidden bg-white/5 hover:bg-white/[0.07] transition-colors"
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
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
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
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white/90">{title}</h3>
              {badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/70">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-white/50 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {content && (
        <div className="px-4 py-4">
          <div
            className="text-sm text-white/70"
            style={color ? { color } : undefined}
          >
            {typeof content === 'object' ? (
              <div className="space-y-2">
                {Object.entries(content).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-white/50">{key}:</span>
                    <span className="text-white/80 font-medium">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-lg font-medium">{content}</div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2">
          {actions.map((action, idx) => (
            <ActionButton
              key={idx}
              action={action}
              onClick={() => onActionClick?.(action)}
              className={`
                flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors
                ${
                  action.variant === 'primary'
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : ''
                }
                ${
                  action.variant === 'danger'
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
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
    </div>
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
          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] border border-white/5"
        >
          {stat.icon && <span className="text-sm">{stat.icon}</span>}
          <span
            className="text-sm font-semibold"
            style={stat.color ? { color: stat.color } : undefined}
          >
            {stat.value}
          </span>
          <span className="text-[10px] text-white/50">{stat.label}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Stats renderer - display multiple stat items in a compact grid
 * Supports both flat stats and sectioned stats
 */
export function SummaryStats({ config, onActionClick }: SummaryRendererProps) {
  const {
    icon,
    title,
    subtitle,
    stats,
    sections,
    color,
    gradient,
    actions,
    badge,
  } = config

  const hasStats =
    (stats && stats.length > 0) || (sections && sections.length > 0)

  if (!hasStats) {
    return null
  }

  return (
    <div
      className="border border-white/10 rounded-xl overflow-hidden bg-white/5"
      style={
        gradient
          ? {
              background: `linear-gradient(135deg, ${gradient.from}10, ${gradient.to}10)`,
            }
          : undefined
      }
    >
      {/* Header - consistent with other summary types */}
      <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
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
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white/90">{title}</h3>
              {badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/70">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Content */}
      <div className="px-4 py-3 space-y-3">
        {/* Render sections if provided */}
        {sections && sections.length > 0
          ? sections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <div className="text-[10px] font-medium text-white/40 uppercase tracking-wide mb-1.5">
                  {section.title}
                </div>
                <StatsRow stats={section.stats} />
              </div>
            ))
          : /* Render flat stats */
            stats && <StatsRow stats={stats} />}
      </div>

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2">
          {actions.map((action, idx) => (
            <ActionButton
              key={idx}
              action={action}
              onClick={() => onActionClick?.(action)}
              className={`
                flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors
                ${
                  action.variant === 'primary'
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : ''
                }
                ${
                  action.variant === 'danger'
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
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
    </div>
  )
}

/**
 * List renderer - display items in a vertical list
 */
export function SummaryList({ config, onActionClick }: SummaryRendererProps) {
  const { icon, title, subtitle, items, color, gradient, actions, badge } =
    config

  if (!items || items.length === 0) {
    return null
  }

  return (
    <div
      className="border border-white/10 rounded-xl overflow-hidden bg-white/5"
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
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
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
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white/90">{title}</h3>
              {badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/70">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* List Items */}
      <div className="divide-y divide-white/5">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            disabled={!item.onClick}
            className={`
              w-full px-4 py-3 flex items-center justify-between gap-3
              transition-colors
              ${
                item.onClick
                  ? 'hover:bg-white/[0.05] cursor-pointer'
                  : 'cursor-default'
              }
            `}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {item.icon && (
                <span className="text-lg shrink-0">{item.icon}</span>
              )}
              <div className="flex flex-col items-start min-w-0">
                <span className="text-sm text-white/80 truncate">
                  {item.label}
                </span>
                {item.subtitle && (
                  <span className="text-xs text-white/40 mt-0.5">
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

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2">
          {actions.map((action, idx) => (
            <ActionButton
              key={idx}
              action={action}
              onClick={() => onActionClick?.(action)}
              className={`
                flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors
                ${
                  action.variant === 'primary'
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : ''
                }
                ${
                  action.variant === 'danger'
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
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
    </div>
  )
}

/**
 * Main renderer component that selects the appropriate renderer based on type
 */
export function CalendarSummaryRenderer({
  config,
  onActionClick,
}: SummaryRendererProps) {
  if (config.type === 'custom' && config.customRender) {
    return <>{config.customRender()}</>
  }

  switch (config.type) {
    case 'chip':
      return <SummaryChip config={config} onActionClick={onActionClick} />
    case 'accordion':
      return <SummaryAccordion config={config} onActionClick={onActionClick} />
    case 'card':
      return <SummaryCard config={config} onActionClick={onActionClick} />
    case 'stats':
      return <SummaryStats config={config} onActionClick={onActionClick} />
    case 'list':
      return <SummaryList config={config} onActionClick={onActionClick} />
    default:
      return <SummaryChip config={config} onActionClick={onActionClick} />
  }
}
