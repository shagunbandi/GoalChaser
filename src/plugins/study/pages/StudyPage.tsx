/**
 * Study Plugin Page
 */

'use client'

import { useState } from 'react'
import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState, ContentLoader } from '@/sdk'
import { StudyHeader, StudyView, StudyMonthView } from '../components'
import type { StudyDayData, StudyConfig, StreakType } from '../types'
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
    jumpToMonth,
    hasData,
    year: currentYear,
  } = usePluginPage<StudyDayData, StudyConfig>({
    pluginId: 'study',
    params,
    year,
  })

  const subjectConfigs = pluginConfig?.subjects || []
  const maxHours = pluginConfig?.maxHours || 14

  // Subject filter state
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(
    new Set(subjectConfigs.map(s => s.id))
  )

  // Update selected subjects when subject configs change
  useState(() => {
    setSelectedSubjects(new Set(subjectConfigs.map(s => s.id)))
  })

  const handleToggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev => {
      const next = new Set(prev)
      if (next.has(subjectId)) {
        next.delete(subjectId)
      } else {
        next.add(subjectId)
      }
      return next
    })
  }

  const handleSelectAllSubjects = () => {
    setSelectedSubjects(new Set(subjectConfigs.map(s => s.id)))
  }

  const handleClearAllSubjects = () => {
    setSelectedSubjects(new Set())
  }

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

  const handleUpdateSubjectGoal = (
    subjectId: string,
    streakType: StreakType,
    targetFrequency?: number
  ) => {
    updateConfig({
      subjects: subjectConfigs.map((s: any) =>
        s.id === subjectId
          ? { ...s, streakType, targetFrequency }
          : s
      ),
    })
  }

  const handleToggleTrackStreaks = (subjectId: string) => {
    updateConfig({
      subjects: subjectConfigs.map((s: any) =>
        s.id === subjectId
          ? { ...s, trackStreaks: !(s.trackStreaks ?? false) }
          : s
      ),
    })
  }

  // Only show full-page loading on TRUE initial load (no goal AND no cached data)
  if (!goal && isLoading && !hasData) return <LoadingState />
  if (!goal && !isLoading) return <NotFoundState />

  return (
    <div className="space-y-6">
      {/* Header - ALWAYS rendered, never unmounted */}
      <StudyHeader
        year={currentYear}
        dayData={pluginDayData}
        maxHours={maxHours}
        subjectConfigs={subjectConfigs}
        onPrevYear={navigateToPrevYear}
        onNextYear={navigateToNextYear}
        onAddSubject={handleAddSubject}
        onRemoveSubject={handleRemoveSubject}
        onUpdateSubject={handleUpdateSubject}
        onToggleHasTopics={handleToggleHasTopics}
        onAddTopic={handleAddTopic}
        onRemoveTopic={handleRemoveTopic}
        onUpdateTopic={handleUpdateTopic}
        isTopicInUse={isTopicInUse}
        onUpdateSubjectGoal={handleUpdateSubjectGoal}
        onToggleTrackStreaks={handleToggleTrackStreaks}
        selectedSubjects={selectedSubjects}
        onToggleSubject={handleToggleSubject}
        onSelectAllSubjects={handleSelectAllSubjects}
        onClearAllSubjects={handleClearAllSubjects}
      />

      {/* Content - shows inline loader when switching years */}
      {isLoading && !hasData ? (
        <ContentLoader color="#8B5CF6" />
      ) : month ? (
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
          selectedSubjects={selectedSubjects}
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
          onJumpToDay={jumpToMonth}
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
          onUpdateSubjectGoal={handleUpdateSubjectGoal}
          onToggleTrackStreaks={handleToggleTrackStreaks}
          selectedSubjects={selectedSubjects}
          onToggleSubject={handleToggleSubject}
          onSelectAllSubjects={handleSelectAllSubjects}
          onClearAllSubjects={handleClearAllSubjects}
        />
      )}
    </div>
  )
}
