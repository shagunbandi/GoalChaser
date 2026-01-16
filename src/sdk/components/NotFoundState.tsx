/**
 * Standard not found state component for plugin pages
 */

interface NotFoundStateProps {
  message?: string
  fullScreen?: boolean
}

export function NotFoundState({ 
  message = 'Goal not found', 
  fullScreen = true 
}: NotFoundStateProps) {
  const containerClass = fullScreen 
    ? 'min-h-screen flex items-center justify-center'
    : 'flex items-center justify-center p-8'
  
  return (
    <div className={containerClass}>
      <div className="text-white/60">{message}</div>
    </div>
  )
}
