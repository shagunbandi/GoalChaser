'use client'

import { useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/ui'
import {
  HoursView,
  GroupedTabBar,
  AddonsManagerModal,
} from '@/components/features'
import { useGoalData } from '@/hooks/useGoalData'
import { useAddonsConfig } from '@/hooks/useAddonsConfig'
import { useAuth } from '@/hooks/useAuth'

export default function HoursPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const goalId = params.id as string
  const year = parseInt(params.year as string)

  const { user } = useAuth()
  const {
    goal,
    isLoading,
    todayISO,
    dayDetails,
    subjectConfigs,
    handleUpdateDetails,
    handleAddSubject,
    handleRemoveSubject,
    handleUpdateSubject,
    handleToggleHasTopics,
    handleAddTopic,
    handleRemoveTopic,
    handleUpdateTopic,
    isTopicInUse,
  } = useGoalData(goalId, year)

  const { enabledAddons, saveAddons } = useAddonsConfig(user?.uid, goalId)
  const [showAddonsManager, setShowAddonsManager] = useState(false)

  // Get initial selected day from URL
  const initialSelectedDay = searchParams.get('date')

  const handleJumpToDay = (iso: string) => {
    // Update URL with selected date without navigating away
    const url = new URL(window.location.href)
    url.searchParams.set('date', iso)
    window.history.replaceState({}, '', url.toString())
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a1f] text-white flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="min-h-screen bg-[#0a0a1f] text-white flex items-center justify-center">
        <div className="text-white/60">Goal not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a1f] text-white">
      <Navbar
        goalId={goalId}
        goalName={goal.name}
        goalDescription={goal.description}
      >
        <GroupedTabBar
          goalId={goalId}
          currentAddon="hours"
          currentYear={year}
          enabledAddons={enabledAddons}
          onManageAddons={() => setShowAddonsManager(true)}
        />
      </Navbar>

      <main className="container mx-auto px-4 py-6 space-y-4">
        <HoursView
          year={year}
          todayISO={todayISO}
          dayDetails={dayDetails}
          subjectConfigs={subjectConfigs}
          maxHours={14}
          onPrevYear={() => router.push(`/goal/${goalId}/hours/${year - 1}`)}
          onNextYear={() => router.push(`/goal/${goalId}/hours/${year + 1}`)}
          onUpdateDay={handleUpdateDetails}
          onJumpToDay={handleJumpToDay}
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

      <AddonsManagerModal
        open={showAddonsManager}
        onClose={() => setShowAddonsManager(false)}
        goalId={goalId}
        enabledAddons={enabledAddons}
        onSave={saveAddons}
      />
    </div>
  )
}
