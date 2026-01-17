/**
 * Productivity Plugin Page
 */

'use client'

import { useState } from 'react'
import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState } from '@/sdk'
import { ProductivityView, ProductivityMonthView, AreaManager } from '../components'
import type { ProductivityDayData, ProductivityConfig } from '../types'
import { ProductivityPlugin } from '../plugin'
import { buildProductivityHeaderConfig } from '../utils/header-config'

export default function ProductivityPage({
  context,
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
    jumpToDay,
    router,
    year: currentYear,
  } = usePluginPage<ProductivityDayData, ProductivityConfig>({
    pluginId: 'productivity',
    params,
    year,
  })
  
  // State for Area Manager Modal
  const [showAreaManager, setShowAreaManager] = useState(false)
  
  // Handler to navigate to month view with selected day
  const handleJumpToDay = (iso: string) => {
    const [y, m] = iso.split('-').map(Number)
    navigateToMonth(y, m, iso)
  }
  
  const areaConfigs = pluginConfig?.areas || []
  
  // Area management handlers (shared between year and month views)
  const handleAddArea = (name: string) => {
    const newArea = { id: `area_${Date.now()}`, name, topics: [], hasTopics: true }
    updateConfig({ areas: [...areaConfigs, newArea] })
  }
  
  const handleRemoveArea = (id: string) => {
    updateConfig({ areas: areaConfigs.filter((a: any) => a.id !== id) })
  }
  
  const handleUpdateArea = (id: string, name: string) => {
    updateConfig({ areas: areaConfigs.map((a: any) => a.id === id ? { ...a, name } : a) })
  }
  
  const handleToggleAreaHasTopics = (id: string) => {
    updateConfig({ 
      areas: areaConfigs.map((a: any) => a.id === id ? { ...a, hasTopics: !(a.hasTopics ?? true) } : a) 
    })
  }
  
  const handleAddAreaTopic = (areaId: string, topic: string) => {
    updateConfig({
      areas: areaConfigs.map((a: any) => 
        a.id === areaId ? { ...a, topics: [...(a.topics || []), topic] } : a
      )
    })
  }
  
  const handleRemoveAreaTopic = (areaId: string, topic: string) => {
    updateConfig({
      areas: areaConfigs.map((a: any) => 
        a.id === areaId ? { ...a, topics: (a.topics || []).filter((t: string) => t !== topic) } : a
      )
    })
  }
  
  const handleUpdateAreaTopic = (areaId: string, oldTopic: string, newTopic: string) => {
    updateConfig({
      areas: areaConfigs.map((a: any) => 
        a.id === areaId ? { ...a, topics: (a.topics || []).map((t: string) => t === oldTopic ? newTopic : t) } : a
      )
    })
  }
  
  const isAreaTopicInUse = (areaId: string, topic: string) => {
    return Object.values(pluginDayData).some((details: any) => 
      details?.areas?.some((area: any) => 
        area.area === areaConfigs.find((a: any) => a.id === areaId)?.name && 
        area.topics?.includes(topic)
      )
    )
  }

  if (isLoading) return <LoadingState />
  if (!goal) return <NotFoundState />

  // If month is specified, show month view
  if (month) {
    // Filter data for the current month
    const monthData: Record<string, ProductivityDayData> = {}
    Object.entries(pluginDayData).forEach(([date, data]) => {
      const [y, m] = date.split('-').map(Number)
      if (y === currentYear && m === month) {
        monthData[date] = data
      }
    })
    
    // Build header config for month view using shared utility
    const monthHeaderConfig = buildProductivityHeaderConfig(
      monthData,
      'month',
      () => setShowAreaManager(true)
    )

    return (
      <>
        <main className="container mx-auto px-4 py-6 space-y-4">
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
            headerConfig={monthHeaderConfig}
            onPrevYear={navigateToPrevYear}
            onNextYear={navigateToNextYear}
            detailContext={{
              areaConfigs,
              onAddArea: handleAddArea,
              onAddTopic: handleAddAreaTopic,
              isTopicInUse: isAreaTopicInUse,
            }}
          />
        </main>
        
        {/* Area Manager Modal */}
        {showAreaManager && (
          <AreaManager
            isOpen={showAreaManager}
            areaConfigs={areaConfigs}
            onAddArea={handleAddArea}
            onRemoveArea={handleRemoveArea}
            onUpdateArea={handleUpdateArea}
            onToggleHasTopics={handleToggleAreaHasTopics}
            onAddTopic={handleAddAreaTopic}
            onRemoveTopic={handleRemoveAreaTopic}
            onUpdateTopic={handleUpdateAreaTopic}
            isTopicInUse={isAreaTopicInUse}
            onClose={() => setShowAreaManager(false)}
          />
        )}
      </>
    )
  }

  // Otherwise show year view
  return (
    <main className="container mx-auto px-4 py-6 space-y-4">
      <ProductivityView
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
    </main>
  )
}
