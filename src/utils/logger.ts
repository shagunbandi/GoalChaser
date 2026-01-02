type LogLevel = 'info' | 'success' | 'error' | 'progress'

const statusSubscribers = new Set<(message: string, level: LogLevel) => void>()

export function subscribeToStatus(callback: (message: string, level: LogLevel) => void) {
  statusSubscribers.add(callback)
  return () => {
    statusSubscribers.delete(callback)
  }
}

function notifyStatusSubscribers(message: string, level: LogLevel) {
  queueMicrotask(() => {
    statusSubscribers.forEach(callback => callback(message, level))
  })
}

export const logger = {
  info: (message: string) => {
    notifyStatusSubscribers(message, 'info')
  },
  
  success: (message: string) => {
    notifyStatusSubscribers(message, 'success')
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
  }
}

