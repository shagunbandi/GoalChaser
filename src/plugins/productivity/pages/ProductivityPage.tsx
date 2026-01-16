/**
 * Productivity Plugin Page
 */

'use client'

import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState } from '@/sdk'
import { ProductivityView } from '../components'
import type { ProductivityDayData, ProductivityConfig } from '../types'

export default function ProductivityPage({ context, params, year }: PluginPageProps) {
  const {
    goal,
    isLoading,
    todayISO,
    pluginDayData,
    pluginConfig,
    initialSelectedDay,
    updateDayData,
    updateConfig,
    navigateToPrevYear,
    navigateToNextYear,
    jumpToDay,
    year: currentYear,
  } = usePluginPage<ProductivityDayData, ProductivityConfig>({
    pluginId: 'productivity',
    params,
    year,
  })
  
  const areaConfigs = pluginConfig?.areas || []
  
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
        onJumpToDay={jumpToDay}
        onAddArea={handleAddArea}
        onRemoveArea={handleRemoveArea}
        onUpdateArea={handleUpdateArea}
        onToggleHasTopics={handleToggleAreaHasTopics}
        onAddTopic={handleAddAreaTopic}
        onRemoveTopic={handleRemoveAreaTopic}
        onUpdateTopic={handleUpdateAreaTopic}
        isTopicInUse={isAreaTopicInUse}
      />
    </main>
  )
}
