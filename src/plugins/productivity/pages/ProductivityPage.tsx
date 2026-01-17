/**
 * Productivity Plugin Page
 */

'use client'

import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState } from '@/sdk'
import {
  ProductivityHeader,
  ProductivityYearView,
  ProductivityMonthView,
} from '../components'
import type { ProductivityDayData, ProductivityConfig } from '../types'
import { ProductivityPlugin } from '../plugin'

export default function ProductivityPage({
  params,
  year,
  month,
}: PluginPageProps) {
  console.log('[ProductivityPage] RENDER', { year, month, params })

  const {
    goal,
    goalId,
    isLoading,
    todayISO,
    pluginDayData,
    pluginConfig,
    initialSelectedDay,
    updateDayData,
    updateConfig,
    navigateToPrevYear,
    navigateToNextYear,
    navigateToYear,
    navigateToMonth,
    year: currentYear,
  } = usePluginPage<ProductivityDayData, ProductivityConfig>({
    pluginId: 'productivity',
    params,
    year,
  })

  console.log('[ProductivityPage] usePluginPage result', {
    isLoading,
    hasGoal: !!goal,
    dataCount: Object.keys(pluginDayData).length,
    currentYear,
  })

  const handleJumpToDay = (iso: string) => {
    const [y, m] = iso.split('-').map(Number)
    navigateToMonth(y, m, iso)
  }

  const areaConfigs = pluginConfig?.areas || []

  // Area management handlers
  const handleAddArea = (name: string) => {
    const newArea = {
      id: `area_${Date.now()}`,
      name,
      topics: [],
      hasTopics: true,
    }
    updateConfig({ areas: [...areaConfigs, newArea] })
  }

  const handleRemoveArea = (id: string) => {
    updateConfig({ areas: areaConfigs.filter((a: any) => a.id !== id) })
  }

  const handleUpdateArea = (id: string, name: string) => {
    updateConfig({
      areas: areaConfigs.map((a: any) => (a.id === id ? { ...a, name } : a)),
    })
  }

  const handleToggleAreaHasTopics = (id: string) => {
    updateConfig({
      areas: areaConfigs.map((a: any) =>
        a.id === id ? { ...a, hasTopics: !(a.hasTopics ?? true) } : a,
      ),
    })
  }

  const handleAddAreaTopic = (areaId: string, topic: string) => {
    updateConfig({
      areas: areaConfigs.map((a: any) =>
        a.id === areaId ? { ...a, topics: [...(a.topics || []), topic] } : a,
      ),
    })
  }

  const handleRemoveAreaTopic = (areaId: string, topic: string) => {
    updateConfig({
      areas: areaConfigs.map((a: any) =>
        a.id === areaId
          ? {
              ...a,
              topics: (a.topics || []).filter((t: string) => t !== topic),
            }
          : a,
      ),
    })
  }

  const handleUpdateAreaTopic = (
    areaId: string,
    oldTopic: string,
    newTopic: string,
  ) => {
    updateConfig({
      areas: areaConfigs.map((a: any) =>
        a.id === areaId
          ? {
              ...a,
              topics: (a.topics || []).map((t: string) =>
                t === oldTopic ? newTopic : t,
              ),
            }
          : a,
      ),
    })
  }

  const isAreaTopicInUse = (areaId: string, topic: string) => {
    return Object.values(pluginDayData).some((details: any) =>
      details?.areas?.some(
        (area: any) =>
          area.area === areaConfigs.find((a: any) => a.id === areaId)?.name &&
          area.topics?.includes(topic),
      ),
    )
  }

  // Check if we have any data yet (for initial load vs navigation)
  const hasData = Object.keys(pluginDayData).length > 0 || pluginConfig !== null

  // Only show full-page loading on TRUE initial load (no goal AND no cached data)
  // This prevents the header from disappearing during navigation
  if (!goal && isLoading && !hasData) return <LoadingState />
  if (!goal && !isLoading) return <NotFoundState />

  // Content loading indicator (shown inline when switching years)
  const ContentLoader = () => (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header - ALWAYS rendered, never unmounted */}
      <ProductivityHeader
        year={currentYear}
        dayData={pluginDayData}
        areaConfigs={areaConfigs}
        onPrevYear={navigateToPrevYear}
        onNextYear={navigateToNextYear}
        onAddArea={handleAddArea}
        onRemoveArea={handleRemoveArea}
        onUpdateArea={handleUpdateArea}
        onToggleHasTopics={handleToggleAreaHasTopics}
        onAddTopic={handleAddAreaTopic}
        onRemoveTopic={handleRemoveAreaTopic}
        onUpdateTopic={handleUpdateAreaTopic}
        isTopicInUse={isAreaTopicInUse}
      />

      {/* Content - shows inline loader when switching years */}
      {isLoading && !hasData ? (
        <ContentLoader />
      ) : month ? (
        <ProductivityMonthView
          plugin={ProductivityPlugin}
          month={month}
          year={currentYear}
          goalId={goalId}
          todayISO={todayISO}
          dayData={pluginDayData}
          initialSelectedDate={initialSelectedDay}
          areaConfigs={areaConfigs}
          onUpdateDay={updateDayData}
          onBackToYear={() => navigateToYear(currentYear)}
          detailContext={{
            areaConfigs,
            onAddArea: handleAddArea,
            onAddTopic: handleAddAreaTopic,
            isTopicInUse: isAreaTopicInUse,
          }}
        />
      ) : (
        <ProductivityYearView
          year={currentYear}
          todayISO={todayISO}
          dayDetails={pluginDayData}
          areaConfigs={areaConfigs}
          initialSelectedDay={initialSelectedDay}
          onPrevYear={navigateToPrevYear}
          onNextYear={navigateToNextYear}
          onUpdateDay={updateDayData}
          onJumpToDay={handleJumpToDay}
          onAddArea={handleAddArea}
          onRemoveArea={handleRemoveArea}
          onUpdateArea={handleUpdateArea}
          onToggleHasTopics={handleToggleAreaHasTopics}
          onAddTopic={handleAddAreaTopic}
          onRemoveTopic={handleRemoveAreaTopic}
          onUpdateTopic={handleUpdateAreaTopic}
          isTopicInUse={isAreaTopicInUse}
          onMonthClick={navigateToMonth}
        />
      )}
    </div>
  )
}
