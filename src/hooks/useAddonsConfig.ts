import { useState, useEffect } from 'react'
import { loadGoalAddonsConfig, saveGoalAddonsConfig } from '@/lib/api/addon-config-api'
import type { AddonId } from '@/types/addon-config'

export function useAddonsConfig(userId: string | undefined, goalId: string) {
  const [enabledAddons, setEnabledAddons] = useState<AddonId[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadGoalAddonsConfig(userId, goalId).then((config) => {
        // Always ensure calendar is included
        const addonsWithCalendar: AddonId[] = config.enabled.includes('calendar')
          ? config.enabled
          : (['calendar', ...config.enabled] as AddonId[])
        setEnabledAddons(addonsWithCalendar)
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [userId, goalId])

  const saveAddons = async (enabled: AddonId[]) => {
    if (!userId) return
    try {
      // Always ensure calendar is included when saving
      const addonsWithCalendar: AddonId[] = enabled.includes('calendar')
        ? enabled
        : (['calendar', ...enabled] as AddonId[])
      await saveGoalAddonsConfig(userId, goalId, { enabled: addonsWithCalendar })
      setEnabledAddons(addonsWithCalendar)
    } catch (error) {
      console.error('Error saving addons config:', error)
      throw error
    }
  }

  return { enabledAddons, isLoading, saveAddons }
}
