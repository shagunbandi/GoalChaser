import { useState, useEffect } from 'react'
import { loadGoalAddonsConfig, saveGoalAddonsConfig } from '@/lib/api/addon-config-api'
import type { AddonId } from '@/types/addon-config'

export function useAddonsConfig(userId: string | undefined, goalId: string) {
  const [enabledAddons, setEnabledAddons] = useState<AddonId[]>([
    'calendar',
    'finance',
    'travel',
    'analytics',
  ])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadGoalAddonsConfig(userId, goalId).then((config) => {
        setEnabledAddons(config.enabled)
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [userId, goalId])

  const saveAddons = async (enabled: AddonId[]) => {
    if (!userId) return
    try {
      await saveGoalAddonsConfig(userId, goalId, { enabled })
      setEnabledAddons(enabled)
    } catch (error) {
      console.error('Error saving addons config:', error)
      throw error
    }
  }

  return { enabledAddons, isLoading, saveAddons }
}
