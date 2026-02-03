'use client'

import { useState, useEffect, useCallback } from 'react'
import type { PluginPageProps } from '@goal-chaser/sdk'
import {
  usePluginPage,
  LoadingState,
  NotFoundState,
  ContentLoader,
} from '@goal-chaser/sdk'
import {
  LanguageTutorHeader,
  YearView,
  LanguageTutorMonthView,
} from '../components'
import type {
  LanguageLearning,
  LanguageLearningInput,
  LanguageTutorDayData,
} from '../types'
import { LanguageTutorPlugin } from '../plugin'
import { loadLearnings, saveLearning, deleteLearning } from '../api'

export default function LanguageTutorPage({
  context,
  params,
  year,
  month,
}: PluginPageProps) {
  const userId = context.userId
  const {
    goal,
    goalId,
    isLoading,
    todayISO,
    pluginDayData,
    initialSelectedDay,
    updateDayData,
    reload,
    navigateToPrevYear,
    navigateToNextYear,
    navigateToYear,
    navigateToMonth,
    jumpToMonth,
    hasData,
    year: currentYear,
  } = usePluginPage<LanguageTutorDayData>({
    pluginId: 'languageTutor',
    params,
    year,
  })

  const [allLearnings, setAllLearnings] = useState<LanguageLearning[]>([])

  const loadAllLearnings = useCallback(async () => {
    if (!userId || !goalId) return []
    const learnings = await loadLearnings(context)
    setAllLearnings(learnings)
    return learnings
  }, [context, userId, goalId])

  useEffect(() => {
    loadAllLearnings()
  }, [loadAllLearnings])

  const handleAddLearning = async (input: LanguageLearningInput) => {
    const learning: LanguageLearning = {
      id: `learning_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      knownLanguages: input.knownLanguages,
      targetLanguage: input.targetLanguage,
      objectives: input.objectives,
      startDate: input.startDate,
      endDate: input.endDate,
      metadata: input.metadata || {
        proficiencyLevel: 'beginner',
        currentTopic: 'Greetings & Basics',
        completedTopics: [],
        topicProgress: {},
        problematicWords: [],
        problematicSentences: [],
        masteredConcepts: [],
        topicsNeedReview: [],
      },
      ...(input.note?.trim() && { note: input.note.trim() }),
      ...(input.color && { color: input.color }),
    }
    const ok = await saveLearning(context, learning)
    if (ok) await loadAllLearnings()
  }

  const handleUpdateLearning = async (updated: LanguageLearning) => {
    const ok = await saveLearning(context, updated)
    if (ok) await loadAllLearnings()
  }

  const handleDeleteLearning = async (learningId: string) => {
    const ok = await deleteLearning(context, learningId)
    if (ok) await loadAllLearnings()
  }

  if (!goal && isLoading && !hasData) return <LoadingState />
  if (!goal && !isLoading) return <NotFoundState />

  return (
    <div className="space-y-6">
      <LanguageTutorHeader
        year={currentYear}
        dayData={pluginDayData}
        onPrevYear={navigateToPrevYear}
        onNextYear={navigateToNextYear}
        onAddLearning={handleAddLearning}
        onUpdateLearning={handleUpdateLearning}
        onDeleteLearning={handleDeleteLearning}
        allLearnings={allLearnings}
        userId={userId}
        goalId={goalId}
      />

      {isLoading && !hasData ? (
        <ContentLoader color="#8B5CF6" />
      ) : month ? (
        <LanguageTutorMonthView
          plugin={LanguageTutorPlugin}
          month={month}
          year={currentYear}
          goalId={goalId}
          todayISO={todayISO}
          dayData={pluginDayData}
          initialSelectedDate={initialSelectedDay}
          onUpdateDay={updateDayData}
          onBackToYear={() => navigateToYear(currentYear)}
          onEditLearning={handleUpdateLearning}
          onDeleteLearning={handleDeleteLearning}
          onAddLearning={handleAddLearning}
          allLearnings={allLearnings}
          userId={userId}
          loadAllLearnings={loadAllLearnings}
        />
      ) : (
        <YearView
          year={currentYear}
          todayISO={todayISO}
          dayDetails={pluginDayData}
          onPrevYear={navigateToPrevYear}
          onNextYear={navigateToNextYear}
          onAddLearning={handleAddLearning}
          onUpdateLearning={handleUpdateLearning}
          onUpdateDay={updateDayData}
          onDeleteLearning={handleDeleteLearning}
          onJumpToDay={jumpToMonth}
          onMonthClick={navigateToMonth}
          initialSelectedDay={initialSelectedDay}
          allLearnings={allLearnings}
        />
      )}
    </div>
  )
}
