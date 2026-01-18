import { useState, useEffect, useCallback } from 'react'
import { loadAnalyticsConfig, saveAnalyticsConfig } from '@/lib/api/analytics-config-api'

export function useAnalyticsConfig(userId: string | undefined, goalId: string) {
  const [visiblePlugins, setVisiblePlugins] = useState<string[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadAnalyticsConfig(userId, goalId).then((config) => {
        if (config) {
          setVisiblePlugins(config.visiblePlugins)
        }
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [userId, goalId])

  const saveVisiblePlugins = useCallback(async (plugins: string[]) => {
    if (!userId) return
    try {
      await saveAnalyticsConfig(userId, goalId, { visiblePlugins: plugins })
      setVisiblePlugins(plugins)
    } catch (error) {
      console.error('Error saving analytics config:', error)
      throw error
    }
  }, [userId, goalId])

  return { visiblePlugins, isLoading, saveVisiblePlugins }
}
