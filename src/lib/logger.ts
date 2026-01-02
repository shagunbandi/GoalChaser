// Global logging system that writes to status bar and console

type LogLevel = 'info' | 'success' | 'error' | 'progress'

// Status bar subscribers
const statusSubscribers = new Set<(message: string, level: LogLevel) => void>()

export function subscribeToStatus(callback: (message: string, level: LogLevel) => void) {
  statusSubscribers.add(callback)
  return () => statusSubscribers.delete(callback)
}

function notifyStatusSubscribers(message: string, level: LogLevel) {
  // Defer to avoid "Cannot update component while rendering" errors
  queueMicrotask(() => {
    statusSubscribers.forEach(callback => callback(message, level))
  })
}

// Logging functions
export const logger = {
  info: (message: string) => {
    notifyStatusSubscribers(message, 'info')
    // Don't log to console for info
  },
  
  success: (message: string) => {
    notifyStatusSubscribers(message, 'success')
    // Don't log to console for success
  },
  
  error: (message: string, error?: unknown) => {
    notifyStatusSubscribers(message, 'error')
    console.error(`🔴 ${message}`, error || '')
    if (error instanceof Error) {
      console.error('🔴 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
  },
  
  progress: (message: string) => {
    notifyStatusSubscribers(message, 'progress')
    // Don't log to console for progress
  }
}

