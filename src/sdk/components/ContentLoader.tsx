/**
 * Inline content loading indicator for plugin pages
 * Used when switching years/months to show loading state without unmounting header
 */

interface ContentLoaderProps {
  /** Optional accent color for the spinner (default: #007AFF) */
  color?: string
}

export function ContentLoader({ color = '#007AFF' }: ContentLoaderProps) {
  return (
    <div className="flex items-center justify-center py-20">
      <div 
        className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: `${color} transparent transparent transparent` }}
      />
    </div>
  )
}
