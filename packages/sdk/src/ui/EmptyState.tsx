/**
 * Empty State Component
 * 
 * Beautiful empty state for when there's no data to display
 */

'use client'

export interface EmptyStateProps {
  /** Icon emoji or text to display */
  icon?: string
  
  /** Title text */
  title?: string
  
  /** Description text */
  description?: string
  
  /** Optional action button */
  action?: {
    label: string
    onClick: () => void
  }
  
  /** Additional CSS classes */
  className?: string
}

export function EmptyState({
  icon = '📭',
  title = 'No data yet',
  description = 'Start tracking to see your data here',
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        py-12 px-6 text-center
        ${className}
      `}
    >
      {/* Icon */}
      <div className="text-6xl mb-4 opacity-40">{icon}</div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-white/70 mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-white/40 max-w-xs mb-6">{description}</p>
      )}

      {/* Action */}
      {action && (
        <button
          onClick={action.onClick}
          className="
            px-6 py-2.5 rounded-xl
            bg-white/10 hover:bg-white/15
            text-white/80 hover:text-white
            font-medium text-sm
            transition-all duration-200
            border border-white/10
          "
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

/**
 * Loading State Component
 * 
 * Shows while data is loading
 */
export interface LoadingStateProps {
  /** Loading message */
  message?: string
  
  /** Additional CSS classes */
  className?: string
}

export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
        <div
          className="absolute inset-0 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin"
          style={{
            animationDuration: '0.8s',
          }}
        />
      </div>
    </div>
  )
}

export function DataLoadingState({
  message = 'Loading...',
  className = '',
}: LoadingStateProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        py-12 px-6 text-center
        ${className}
      `}
    >
      <LoadingSpinner className="mb-4" />
      <p className="text-sm text-white/50">{message}</p>
    </div>
  )
}
