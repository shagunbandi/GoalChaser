'use client'

import type { CalendarSummaryConfig, CalendarSummaryAction } from '../interfaces/plugin.interface'

/**
 * Props for summary renderer components
 */
interface SummaryRendererProps {
  config: CalendarSummaryConfig
  onActionClick?: (action: CalendarSummaryAction) => void
}

/**
 * Chip renderer - compact single-line summary
 */
export function SummaryChip({ config, onActionClick }: SummaryRendererProps) {
  const { icon, title, content, color, actions } = config

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {icon && <span className="text-lg flex-shrink-0">{icon}</span>}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-medium text-white/80 truncate">{title}</span>
          <span 
            className="text-sm text-white/60 truncate"
            style={color ? { color } : undefined}
          >
            {typeof content === 'object' ? JSON.stringify(content) : content}
          </span>
        </div>
      </div>
      
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                action.onClick()
                onActionClick?.(action)
              }}
              className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            >
              {action.icon && <span className="mr-1">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Accordion renderer - expandable summary with details
 */
export function SummaryAccordion({ config, onActionClick }: SummaryRendererProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const { icon, title, content, color, actions } = config

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden bg-white/5">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-xl">{icon}</span>}
          <span className="text-sm font-medium text-white/90">{title}</span>
        </div>
        <svg
          className={`w-5 h-5 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-4 py-3 border-t border-white/10">
          <div 
            className="text-sm text-white/70 mb-3"
            style={color ? { color } : undefined}
          >
            {typeof content === 'object' ? (
              <pre className="whitespace-pre-wrap font-mono text-xs">
                {JSON.stringify(content, null, 2)}
              </pre>
            ) : (
              content
            )}
          </div>

          {actions && actions.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    action.onClick()
                    onActionClick?.(action)
                  }}
                  className={`
                    text-xs px-3 py-1.5 rounded font-medium transition-colors
                    ${action.variant === 'primary' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
                    ${action.variant === 'danger' ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
                    ${!action.variant || action.variant === 'secondary' ? 'bg-white/10 hover:bg-white/20 text-white/80' : ''}
                  `}
                >
                  {action.icon && <span className="mr-1">{action.icon}</span>}
                  {action.label}
                </button>
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
  const { icon, title, content, color, actions } = config

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 hover:bg-white/[0.07] transition-colors">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          {icon && (
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: color ? `${color}20` : 'rgba(255,255,255,0.1)' }}
            >
              {icon}
            </div>
          )}
          <h3 className="text-base font-semibold text-white/90">{title}</h3>
        </div>
      </div>

      {/* Content */}
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
                  <span className="text-white/80 font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-lg font-medium">{content}</div>
          )}
        </div>
      </div>

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                action.onClick()
                onActionClick?.(action)
              }}
              className={`
                flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors
                ${action.variant === 'primary' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
                ${action.variant === 'danger' ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' : ''}
                ${!action.variant || action.variant === 'secondary' ? 'bg-white/10 hover:bg-white/15 text-white/80' : ''}
              `}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Main renderer component that selects the appropriate renderer based on type
 */
export function CalendarSummaryRenderer({ config, onActionClick }: SummaryRendererProps) {
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
    default:
      return <SummaryChip config={config} onActionClick={onActionClick} />
  }
}

// Fix React import
import React from 'react'
