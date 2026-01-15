'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/ui'
import { HoursView, GroupedTabBar, AddonsManagerModal } from '@/components/features'
import { useFirebase } from '@/hooks/useFirebase'
import { useGoals } from '@/hooks/useGoals'
import { useAuth } from '@/hooks/useAuth'
import { useAddonsConfig } from '@/hooks/useAddonsConfig'
import { toISODateString } from '@/utils'

export default function HoursPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const goalId = params.id as string
  const year = parseInt(params.year as string)

  const { user } = useAuth()
  const { getGoal } = useGoals()
  const goal = getGoal(goalId)

  const {
    dayDetails,
    subjectConfigs,
    isLoading,
    updateDayDetails,
    addSubjectConfig,
    removeSubjectConfig,
    updateSubjectConfig,
    toggleSubjectHasTopics,
    addTopicToSubject,
    removeTopicFromSubject,
    updateTopicInSubject,
    isTopicInUse,
  } = useFirebase(goalId)

  const { enabledAddons, saveAddons } = useAddonsConfig(user?.uid, goalId)
  const [showAddonsManager, setShowAddonsManager] = useState(false)
  const [todayISO] = useState(() => toISODateString(new Date()))

  // Get initial selected day from URL
  const [initialSelectedDay, setInitialSelectedDay] = useState<string | null>(null)

  useEffect(() => {
    const dateFromUrl = searchParams.get('date')
    setInitialSelectedDay(dateFromUrl)
  }, [searchParams])

  // Status tracking
  const [statusText, setStatusText] = useState('Ready')
  const [statusTone, setStatusTone] = useState<'info' | 'success' | 'error' | 'progress'>('info')

  const pushStatus = (status: { text: string; tone?: 'info' | 'success' | 'error' | 'progress' }) => {
    setStatusText(status.text)
    setStatusTone(status.tone ?? 'info')
  }

  const handleJumpToDay = (iso: string) => {
    // Update URL with selected date without navigating away
    const url = new URL(window.location.href)
    url.searchParams.set('date', iso)
    router.replace(url.pathname + url.search, { scroll: false })
  }

  // Get max hours from goal's success criterion
  const maxHours = goal?.successCriterion?.type === 'hours' ? goal.successCriterion.maxHours : 8

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
          maxHours={maxHours}
          onUpdateDay={updateDayDetails}
          onAddSubject={addSubjectConfig}
          onRemoveSubject={removeSubjectConfig}
          onUpdateSubject={updateSubjectConfig}
          onToggleHasTopics={toggleSubjectHasTopics}
          onAddTopic={addTopicToSubject}
          onRemoveTopic={removeTopicFromSubject}
          onUpdateTopic={updateTopicInSubject}
          isTopicInUse={isTopicInUse}
          onJumpToDay={handleJumpToDay}
          initialSelectedDay={initialSelectedDay}
          onPrevYear={() => {
            pushStatus({ text: 'Previous year', tone: 'progress' })
            router.push(`/goal/${goalId}/hours/${year - 1}`)
            pushStatus({ text: 'Year changed', tone: 'success' })
          }}
          onNextYear={() => {
            pushStatus({ text: 'Next year', tone: 'progress' })
            router.push(`/goal/${goalId}/hours/${year + 1}`)
            pushStatus({ text: 'Year changed', tone: 'success' })
          }}
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
