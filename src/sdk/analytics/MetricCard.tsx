'use client'

/**
 * Metric Card Component
 * Displays a key metric with optional trend indicator
 * 
 * Usage:
 * <MetricCard
 *   label="Average Score"
 *   value={7.5}
 *   unit="/10"
 *   icon="📊"
 *   trend={{ direction: 'up', value: 5 }}
 * />
 */

export interface MetricCardProps {
  /** Main label for the metric */
  label: string
  /** The value to display */
  value: number | string
  /** Optional unit (e.g., "/10", "hrs", "$") */
  unit?: string
  /** Optional icon emoji */
  icon?: string
  /** Primary color for the card accent */
  color?: string
  /** Trend information */
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: number
  }
  /** Optional subtitle or description */
  subtitle?: string
}

export function MetricCard({
  label,
  value,
  unit,
  icon,
  color = '#007AFF',
  trend,
  subtitle,
}: MetricCardProps) {
  const getTrendColor = () => {
    if (!trend) return 'text-white/40'
    switch (trend.direction) {
      case 'up': return 'text-green-400'
      case 'down': return 'text-red-400'
      default: return 'text-white/40'
    }
  }

  const getTrendIcon = () => {
    if (!trend) return null
    switch (trend.direction) {
      case 'up': return '↑'
      case 'down': return '↓'
      default: return '→'
    }
  }

  return (
    <div 
      className="glass-panel rounded-xl p-4 space-y-3 border border-white/10 h-full"
      style={{
        background: `linear-gradient(135deg, ${color}10, transparent)`
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/60">{label}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1">
        <span 
          className="text-3xl font-bold"
          style={{ color }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-lg text-white/40">{unit}</span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-white/50">{subtitle}</p>
      )}

      {/* Trend */}
      {trend && (
        <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
          <span>{getTrendIcon()}</span>
          <span>
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-white/30 ml-1">vs last period</span>
        </div>
      )}
    </div>
  )
}
