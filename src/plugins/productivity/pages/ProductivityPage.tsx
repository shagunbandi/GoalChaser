/**
 * Productivity Plugin Page
 */

'use client'

import { useState } from 'react'
import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState, ContentLoader } from '@/sdk'
import {
  ProductivityHeader,
  ProductivityYearView,
  ProductivityMonthView,
} from '../components'
import type { ProductivityDayData, ProductivityConfig, StreakType } from '../types'
import { ProductivityPlugin } from '../plugin'

export default function ProductivityPage({
  params,
  year,
  month,
}: PluginPageProps) {
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
    jumpToMonth,
    hasData,
    year: currentYear,
  } = usePluginPage<ProductivityDayData, ProductivityConfig>({
    pluginId: 'productivity',
    params,
    year,
  })

  const areaConfigs = pluginConfig?.areas || []

  // Area filter state
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(
    new Set(areaConfigs.map(a => a.id))
  )

  // Update selected areas when area configs change
  useState(() => {
    setSelectedAreas(new Set(areaConfigs.map(a => a.id)))
  })

  const handleToggleArea = (areaId: string) => {
    setSelectedAreas(prev => {
      const next = new Set(prev)
      if (next.has(areaId)) {
        next.delete(areaId)
      } else {
        next.add(areaId)
      }
      return next
    })
  }

  const handleSelectAllAreas = () => {
    setSelectedAreas(new Set(areaConfigs.map(a => a.id)))
  }

  const handleClearAllAreas = () => {
    setSelectedAreas(new Set())
  }

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

  const handleUpdateAreaGoal = (
    id: string,
    streakType: StreakType,
    targetFrequency?: number,
  ) => {
    updateConfig({
      areas: areaConfigs.map((a: any) =>
        a.id === id
          ? { ...a, streakType, targetFrequency }
          : a,
      ),
    })
  }

  const handleToggleTrackStreaks = (id: string) => {
    updateConfig({
      areas: areaConfigs.map((a: any) =>
        a.id === id ? { ...a, trackStreaks: !(a.trackStreaks ?? true) } : a,
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

  // Only show full-page loading on TRUE initial load (no goal AND no cached data)
  if (!goal && isLoading && !hasData) return <LoadingState />
  if (!goal && !isLoading) return <NotFoundState />

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
        onUpdateAreaGoal={handleUpdateAreaGoal}
        onToggleTrackStreaks={handleToggleTrackStreaks}
        isTopicInUse={isAreaTopicInUse}
        selectedAreas={selectedAreas}
        onToggleArea={handleToggleArea}
        onSelectAllAreas={handleSelectAllAreas}
        onClearAllAreas={handleClearAllAreas}
      />

      {/* Content - shows inline loader when switching years */}
      {isLoading && !hasData ? (
        <ContentLoader color="#007AFF" />
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
          selectedAreas={selectedAreas}
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
          onJumpToDay={jumpToMonth}
          onAddArea={handleAddArea}
          onRemoveArea={handleRemoveArea}
          onUpdateArea={handleUpdateArea}
          onToggleHasTopics={handleToggleAreaHasTopics}
          onAddTopic={handleAddAreaTopic}
          onRemoveTopic={handleRemoveAreaTopic}
          onUpdateTopic={handleUpdateAreaTopic}
          onUpdateAreaGoal={handleUpdateAreaGoal}
          onToggleTrackStreaks={handleToggleTrackStreaks}
          isTopicInUse={isAreaTopicInUse}
          onMonthClick={navigateToMonth}
          selectedAreas={selectedAreas}
          onToggleArea={handleToggleArea}
          onSelectAllAreas={handleSelectAllAreas}
          onClearAllAreas={handleClearAllAreas}
        />
      )}
    </div>
  )
}
