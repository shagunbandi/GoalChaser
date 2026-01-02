import { logger } from '@/utils/logger'

export function getStorageKey(userId: string, goalId: string, key: string): string {
  return `nitya_${userId}_${goalId}_${key}`
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue
  }
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      logger.info(`Loaded from localStorage`)
      return JSON.parse(stored)
    } else {
      return defaultValue
    }
  } catch (error) {
    logger.error('Error loading from localStorage', error)
    return defaultValue
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    localStorage.setItem(key, JSON.stringify(value))
    logger.info('Saved to localStorage')
  } catch (error) {
    logger.error('Error saving to localStorage', error)
  }
}

