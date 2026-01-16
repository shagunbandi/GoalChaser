/**
 * Productivity Plugin Page
 */

'use client'

import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState } from '@/sdk'
import { ProductivityView, ProductivityMonthView } from '../components'
import type { ProductivityDayData, ProductivityConfig } from '../types'
import { ProductivityPlugin } from '../plugin'

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
  
  // Handler to navigate to month view with selected day
  const handleJumpToDay = (iso: string) => {
    const [y, m] = iso.split('-').map(Number)
    navigateToMonth(y, m, iso)
  }
  
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

  // If month is specified, show month view
  if (month) {
    // Calculate month-specific stats
    const monthData = Object.entries(pluginDayData).filter(([date]) => {
      const [y, m] = date.split('-').map(Number)
      return y === currentYear && m === month
    })
    const monthStats = {
      total: monthData.filter(([, data]) => data?.status !== null && data?.status !== undefined).length,
      high: monthData.filter(([, data]) => data?.status !== null && data?.status !== undefined && data.status >= 7).length,
      average: monthData.length > 0
        ? monthData.reduce((sum, [, data]) => sum + (data?.status || 0), 0) / monthData.filter(([, data]) => data?.status !== null && data?.status !== undefined).length
        : 0,
    }

    const monthHeaderConfig = {
      icon: '📊',
      title: `Productivity Month:`,
      stats: [
        { label: 'Tracked days', value: monthStats.total },
        { label: 'High days', value: monthStats.high },
        { label: 'Average', value: monthStats.average.toFixed(1) },
      ],
      legends: [
        { label: 'High (7-10)', color: 'rgb(48, 209, 88)' },
        { label: 'OK (4-6)', color: 'rgb(255, 149, 0)' },
        { label: 'Low (1-3)', color: 'rgb(255, 69, 58)' },
      ],
      actions: [
        {
          id: 'manage-areas',
          label: 'Manage Areas',
          icon: '⚙️',
          onClick: () => {}, // No-op for now, can be extended later
        },
      ],
    }

    return (
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
        />
      </main>
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
