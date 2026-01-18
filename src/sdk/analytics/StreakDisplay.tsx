'use client'

/**
 * Streak Display Component
 * Shows current and longest streak with visual appeal
 * 
 * Usage:
 * <StreakDisplay
 *   title="High Productivity Streak"
 *   currentStreak={5}
 *   longestStreak={12}
 *   unit="days"
 *   icon="🔥"
 * />
 */

export interface StreakDisplayProps {
  /** Title for the streak display */
  title: string
  /** Current active streak */
  currentStreak: number
  /** Longest streak achieved */
  longestStreak: number
  /** Unit label (e.g., "days", "sessions") */
  unit?: string
  /** Icon emoji */
  icon?: string
  /** Primary color */
  color?: string
  /** Description of what counts as a streak day */
  description?: string
}

export function StreakDisplay({
  title,
  currentStreak,
  longestStreak,
  unit = 'days',
  icon = '🔥',
  color = '#FF9500',
  description,
}: StreakDisplayProps) {
  const isOnStreak = currentStreak > 0
  const isNewRecord = currentStreak >= longestStreak && currentStreak > 0

  return (
    <div 
      className="glass-panel rounded-xl p-5 border border-white/10 h-full flex flex-col"
      style={{
        background: `linear-gradient(135deg, ${color}15, transparent)`
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${color}30` }}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white/90">{title}</h3>
          {description && (
            <p className="text-xs text-white/50">{description}</p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 flex-1">
        {/* Current Streak */}
        <div 
          className="rounded-lg p-4 text-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            {isOnStreak && <span className="text-2xl animate-pulse">{icon}</span>}
            <span 
              className="text-4xl font-bold"
              style={{ color: isOnStreak ? color : 'rgba(255,255,255,0.4)' }}
            >
              {currentStreak}
            </span>
          </div>
          <div className="text-xs text-white/60">
            Current {unit}
          </div>
          {isNewRecord && (
            <div 
              className="mt-2 text-xs font-medium px-2 py-0.5 rounded-full inline-block"
              style={{ backgroundColor: `${color}40`, color }}
            >
              🏆 New Record!
            </div>
          )}
        </div>

        {/* Longest Streak */}
        <div className="rounded-lg p-4 text-center bg-white/5">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-lg">🏆</span>
            <span className="text-4xl font-bold text-white/70">
              {longestStreak}
            </span>
          </div>
          <div className="text-xs text-white/60">
            Best {unit}
          </div>
        </div>
      </div>

      {/* Streak Status */}
      <div className="mt-4 text-center">
        {isOnStreak ? (
          <p className="text-sm" style={{ color }}>
            Keep going! You&apos;re on a {currentStreak} {unit} streak!
          </p>
        ) : (
          <p className="text-sm text-white/40">
            Start a new streak today!
          </p>
        )}
      </div>
    </div>
  )
}
