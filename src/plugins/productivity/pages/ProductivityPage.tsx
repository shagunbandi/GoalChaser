/**
 * Productivity Plugin Page
 */

'use client'

import type { PluginPageProps } from '@/sdk'
import { ProductivityView } from '../components'
import { useGoalData } from '@/hooks/useGoalData'
import { useRouter } from 'next/navigation'

export default function ProductivityPage({ context, params, year = new Date().getFullYear() }: PluginPageProps) {
  const goalId = params.id
  const router = useRouter()

  const {
    goal,
    isLoading,
    todayISO,
    pluginData,
    pluginConfigs,
    handleUpdateData,
    updateConfig,
  } = useGoalData(goalId, year)
  
  // Extract productivity-specific data
  const dayDetails = pluginData?.['productivity'] || {}
  const areaConfigs = (pluginConfigs?.['productivity'] as any)?.areas || []
  
  // Wrapper functions for productivity-specific updates
  const handleUpdateDetails = async (iso: string, updates: any) => {
    await handleUpdateData('productivity', iso, updates)
  }
  
  const handleAddArea = (name: string) => {
    const newArea = { id: `area_${Date.now()}`, name, topics: [], hasTopics: true }
    const updatedConfig = {
      areas: [...areaConfigs, newArea]
    }
    updateConfig('productivity', updatedConfig)
  }
  
  const handleRemoveArea = (id: string) => {
    const updatedConfig = {
      areas: areaConfigs.filter((a: any) => a.id !== id)
    }
    updateConfig('productivity', updatedConfig)
  }
  
  const handleUpdateArea = (id: string, name: string) => {
    const updatedConfig = {
      areas: areaConfigs.map((a: any) => a.id === id ? { ...a, name } : a)
    }
    updateConfig('productivity', updatedConfig)
  }
  
  const handleToggleAreaHasTopics = (id: string) => {
    const updatedConfig = {
      areas: areaConfigs.map((a: any) => a.id === id ? { ...a, hasTopics: !(a.hasTopics ?? true) } : a)
    }
    updateConfig('productivity', updatedConfig)
  }
  
  const handleAddAreaTopic = (areaId: string, topic: string) => {
    const updatedConfig = {
      areas: areaConfigs.map((a: any) => 
        a.id === areaId ? { ...a, topics: [...(a.topics || []), topic] } : a
      )
    }
    updateConfig('productivity', updatedConfig)
  }
  
  const handleRemoveAreaTopic = (areaId: string, topic: string) => {
    const updatedConfig = {
      areas: areaConfigs.map((a: any) => 
        a.id === areaId ? { ...a, topics: (a.topics || []).filter((t: string) => t !== topic) } : a
      )
    }
    updateConfig('productivity', updatedConfig)
  }
  
  const handleUpdateAreaTopic = (areaId: string, oldTopic: string, newTopic: string) => {
    const updatedConfig = {
      areas: areaConfigs.map((a: any) => 
        a.id === areaId ? { ...a, topics: (a.topics || []).map((t: string) => t === oldTopic ? newTopic : t) } : a
      )
    }
    updateConfig('productivity', updatedConfig)
  }
  
  const isAreaTopicInUse = (areaId: string, topic: string) => {
    // Check if topic is used in any day's data
    return Object.values(dayDetails).some((details: any) => 
      details?.areas?.some((area: any) => area.area === areaConfigs.find((a: any) => a.id === areaId)?.name && area.topics?.includes(topic))
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Goal not found</div>
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-6 space-y-4">
      <ProductivityView
        year={year}
        todayISO={todayISO}
        dayDetails={dayDetails}
        areaConfigs={areaConfigs}
        onPrevYear={() => router.push(`/goal/${goalId}/productivity/${year - 1}`)}
        onNextYear={() => router.push(`/goal/${goalId}/productivity/${year + 1}`)}
        onUpdateDay={handleUpdateDetails}
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
