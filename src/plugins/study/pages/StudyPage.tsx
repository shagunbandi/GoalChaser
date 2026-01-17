/**
 * Study Plugin Page
 */

'use client'

import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState } from '@/sdk'
import { StudyHeader, StudyView, StudyMonthView } from '../components'
import type { StudyDayData, StudyConfig } from '../types'
import { StudyPlugin } from '../plugin'

export default function StudyPage({
  params,
  year,
  month,
}: PluginPageProps) {
  const {
    goal,
    isLoading,
    goalId,
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
  } = usePluginPage<StudyDayData, StudyConfig>({
    pluginId: 'study',
    params,
    year,
  })

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
      subjects: subjectConfigs.map((s: any) =>
        s.id === id ? { ...s, name } : s,
      ),
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
    <div className="space-y-6">
      {/* Shared Header Component */}
      <StudyHeader
        year={currentYear}
        dayData={pluginDayData}
        onPrevYear={navigateToPrevYear}
        onNextYear={navigateToNextYear}
      />

      {/* Conditionally render Month or Year view */}
      {month ? (
        <StudyMonthView
          plugin={StudyPlugin}
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
        />
      ) : (
        <StudyView
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
      )}
    </div>
  )
}

