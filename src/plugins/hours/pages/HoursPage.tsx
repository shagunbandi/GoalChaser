/**
 * Hours Plugin Page
 */

'use client'

import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState } from '@/sdk'
import { HoursView } from '../components'
import type { HoursDayData, HoursConfig } from '../types'

export default function HoursPage({ context, params, year }: PluginPageProps) {
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
  } = usePluginPage<HoursDayData, HoursConfig>({
    pluginId: 'hours',
    params,
    year,
  })

  const subjectConfigs = pluginConfig?.subjects || []

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
        onJumpToDay={jumpToDay}
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
