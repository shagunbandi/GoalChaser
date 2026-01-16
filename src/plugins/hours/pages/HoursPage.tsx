/**
 * Hours Plugin Page
 */

'use client'

import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState } from '@/sdk'
import { HoursView, HoursMonthView } from '../components'
import type { HoursDayData, HoursConfig } from '../types'
import { HoursPlugin } from '../plugin'

export default function HoursPage({
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
  } = usePluginPage<HoursDayData, HoursConfig>({
    pluginId: 'hours',
    params,
    year,
  })
  
  // Handler to navigate to month view with selected day
  const handleJumpToDay = (iso: string) => {
    const [y, m] = iso.split('-').map(Number)
    navigateToMonth(y, m, iso)
  }

  const subjectConfigs = pluginConfig?.subjects || []
  const maxHours = pluginConfig?.maxHours || 14

  const handleAddSubject = (name: string) => {
    const newSubject = {
      id: `subject_${Date.now()}`,
      name,
      topics: [],
      hasTopics: true,
    }
    updateConfig({ subjects: [...subjectConfigs, newSubject] })
  }

  const handleRemoveSubject = (id: string) => {
    updateConfig({ subjects: subjectConfigs.filter((s: any) => s.id !== id) })
  }

  const handleUpdateSubject = (id: string, name: string) => {
    updateConfig({
      subjects: subjectConfigs.map((s: any) => s.id === id ? { ...s, name } : s),
    })
  }

  const handleToggleHasTopics = (id: string) => {
    updateConfig({
      subjects: subjectConfigs.map((s: any) =>
        s.id === id ? { ...s, hasTopics: !(s.hasTopics ?? true) } : s,
      ),
    })
  }

  const handleAddTopic = (subjectId: string, topic: string) => {
    updateConfig({
      subjects: subjectConfigs.map((s: any) =>
        s.id === subjectId ? { ...s, topics: [...(s.topics || []), topic] } : s,
      ),
    })
  }

  const handleRemoveTopic = (subjectId: string, topic: string) => {
    updateConfig({
      subjects: subjectConfigs.map((s: any) =>
        s.id === subjectId
          ? {
              ...s,
              topics: (s.topics || []).filter((t: string) => t !== topic),
            }
          : s,
      ),
    })
  }

  const handleUpdateTopic = (
    subjectId: string,
    oldTopic: string,
    newTopic: string,
  ) => {
    updateConfig({
      subjects: subjectConfigs.map((s: any) =>
        s.id === subjectId
          ? {
              ...s,
              topics: (s.topics || []).map((t: string) =>
                t === oldTopic ? newTopic : t,
              ),
            }
          : s,
      ),
    })
  }

  const isTopicInUse = (subjectId: string, topic: string) => {
    return Object.values(pluginDayData).some((details: any) =>
      details?.subjects?.some(
        (subj: any) =>
          subj.subject ===
            subjectConfigs.find((s: any) => s.id === subjectId)?.name &&
          subj.topics?.includes(topic),
      ),
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
      days: monthData.filter(([, data]) => data?.subjects && data.subjects.length > 0).length,
      total: monthData.reduce((sum, [, data]) => {
        return sum + (data?.subjects?.reduce((s: number, entry: any) => s + (entry.hours || 0), 0) || 0)
      }, 0),
    }

    const monthHeaderConfig = {
      icon: '⏱️',
      title: `Hours Month:`,
      stats: [
        { label: 'Days tracked', value: monthStats.days },
        { label: 'Total hours', value: monthStats.total.toFixed(1) },
      ],
      legends: [],
      actions: [],
    }

    return (
      <main className="container mx-auto px-4 py-6 space-y-4">
        <HoursMonthView
          plugin={HoursPlugin}
          month={month}
          year={currentYear}
          goalId={goalId}
          todayISO={todayISO}
          dayData={pluginDayData}
          initialSelectedDate={initialSelectedDay}
          subjectConfigs={subjectConfigs}
          maxHours={maxHours}
          onUpdateDay={updateDayData}
          onBackToYear={() => navigateToYear(currentYear)}
          onAddSubject={handleAddSubject}
          onAddTopic={handleAddTopic}
          onRemoveTopic={handleRemoveTopic}
          onUpdateTopic={handleUpdateTopic}
          onRemoveSubject={handleRemoveSubject}
          onUpdateSubject={handleUpdateSubject}
          onToggleHasTopics={handleToggleHasTopics}
          isTopicInUse={isTopicInUse}
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
      <HoursView
        year={currentYear}
        todayISO={todayISO}
        dayDetails={pluginDayData}
        subjectConfigs={subjectConfigs}
        maxHours={14}
        onPrevYear={navigateToPrevYear}
        onNextYear={navigateToNextYear}
        onUpdateDay={updateDayData}
        onJumpToDay={handleJumpToDay}
        onMonthClick={navigateToMonth}
        initialSelectedDay={initialSelectedDay}
        onAddSubject={handleAddSubject}
        onRemoveSubject={handleRemoveSubject}
        onUpdateSubject={handleUpdateSubject}
        onToggleHasTopics={handleToggleHasTopics}
        onAddTopic={handleAddTopic}
        onRemoveTopic={handleRemoveTopic}
        onUpdateTopic={handleUpdateTopic}
        isTopicInUse={isTopicInUse}
      />
    </main>
  )
}
