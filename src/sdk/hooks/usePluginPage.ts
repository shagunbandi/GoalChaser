/**
 * Common hook for plugin pages to reduce boilerplate
 * Handles data loading, routing, and provides wrapper functions
 */

import { useRouter, useSearchParams } from 'next/navigation'
import { useGoalData } from '@/hooks/useGoalData'
import type { PluginPageProps } from '../interfaces/plugin.interface'

interface UsePluginPageOptions {
  pluginId: string
  params: PluginPageProps['params']
  year?: number
}

interface UsePluginPageResult<TDayData = any, TConfig = any> {
  // Core data
  goal: any
  goalId: string
  isLoading: boolean
  todayISO: string
  year: number
  
  // Plugin-specific data
  pluginDayData: Record<string, TDayData>
  pluginConfig: TConfig | null
  
  // Navigation
  router: ReturnType<typeof useRouter>
  initialSelectedDay: string | null
  
  // Data operations
  updateDayData: (iso: string, updates: Partial<TDayData>) => Promise<void>
  updateConfig: (config: Partial<TConfig>) => Promise<void>
  reload: () => Promise<void>
  
  // Navigation helpers
  navigateToPrevYear: () => void
  navigateToNextYear: () => void
  navigateToMonth: (year: number, month: number, date?: string) => void
  navigateToPrevMonth: (currentYear: number, currentMonth: number) => void
  navigateToNextMonth: (currentYear: number, currentMonth: number) => void
  jumpToDay: (iso: string) => void
  jumpToMonth: (iso: string) => void
  navigateToYear: (year: number) => void
  
  // Computed helpers
  hasData: boolean
}

/**
 * Hook that provides all common functionality for a plugin page
 * 
 * @example
 * ```typescript
 * export default function MyPluginPage({ params, year }: PluginPageProps) {
 *   const {
 *     goal,
 *     isLoading,
 *     pluginDayData,
 *     pluginConfig,
 *     updateDayData,
 *     updateConfig,
 *     navigateToPrevYear,
 *     navigateToNextYear,
 *   } = usePluginPage({
 *     pluginId: 'my-plugin',
 *     params,
 *     year,
 *   })
 * 
 *   if (isLoading) return <LoadingState />
 *   if (!goal) return <NotFoundState />
 * 
 *   return <MyPluginView data={pluginDayData} config={pluginConfig} ... />
 * }
 * ```
 */
export function usePluginPage<TDayData = any, TConfig = any>({
  pluginId,
  params,
  year: initialYear,
}: UsePluginPageOptions): UsePluginPageResult<TDayData, TConfig> {
  const goalId = params.id
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialSelectedDay = searchParams.get('date')
  const year = initialYear || new Date().getFullYear()

  const {
    goal,
    isLoading,
    todayISO,
    pluginData,
    pluginConfigs,
    handleUpdateData,
    updateConfig: updateConfigBase,
    reload,
  } = useGoalData(goalId, year)

  // Extract plugin-specific data
  const pluginDayData = (pluginData?.[pluginId] || {}) as Record<string, TDayData>
  const pluginConfig = (pluginConfigs?.[pluginId] as TConfig) || null

  // Wrapper for day data updates
  const updateDayData = async (iso: string, updates: Partial<TDayData>) => {
    await handleUpdateData(pluginId, iso, updates)
  }

  // Wrapper for config updates
  const updateConfig = async (config: Partial<TConfig>) => {
    await updateConfigBase(pluginId, config)
  }

  // Navigation helpers
  const navigateToPrevYear = () => {
    router.push(`/goal/${goalId}/${pluginId}/${year - 1}`)
  }

  const navigateToNextYear = () => {
    router.push(`/goal/${goalId}/${pluginId}/${year + 1}`)
  }

  const navigateToMonth = (targetYear: number, targetMonth: number, date?: string) => {
    const url = `/goal/${goalId}/${pluginId}/${targetYear}/${targetMonth}`
    if (date) {
      router.push(`${url}?date=${date}`)
    } else {
      router.push(url)
    }
  }

  const navigateToPrevMonth = (currentYear: number, currentMonth: number) => {
    if (currentMonth === 1) {
      navigateToMonth(currentYear - 1, 12)
    } else {
      navigateToMonth(currentYear, currentMonth - 1)
    }
  }

  const navigateToNextMonth = (currentYear: number, currentMonth: number) => {
    if (currentMonth === 12) {
      navigateToMonth(currentYear + 1, 1)
    } else {
      navigateToMonth(currentYear, currentMonth + 1)
    }
  }

  const jumpToDay = (iso: string) => {
    const currentPath = window.location.pathname
    router.replace(`${currentPath}?date=${iso}`, { scroll: false })
  }

  /**
   * Jump to a specific date's month view (extracts year/month from ISO date)
   */
  const jumpToMonth = (iso: string) => {
    const [y, m] = iso.split('-').map(Number)
    navigateToMonth(y, m, iso)
  }

  const navigateToYear = (targetYear: number) => {
    router.push(`/goal/${goalId}/${pluginId}/${targetYear}`)
  }

  // Helper to check if data has been loaded
  const hasData = Object.keys(pluginDayData).length > 0 || pluginConfig !== null

  return {
    goal,
    goalId,
    isLoading,
    todayISO,
    year,
    pluginDayData,
    pluginConfig,
    router,
    initialSelectedDay,
    updateDayData,
    updateConfig,
    reload,
    navigateToPrevYear,
    navigateToNextYear,
    navigateToYear,
    navigateToMonth,
    navigateToPrevMonth,
    navigateToNextMonth,
    jumpToDay,
    jumpToMonth,
    hasData,
  }
}
