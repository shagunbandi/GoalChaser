'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/ui'
import { YearView, GroupedTabBar, AddonsManagerModal } from '@/components/features'
import { useGoalData } from '@/hooks/useGoalData'
import { useAddonsConfig } from '@/hooks/useAddonsConfig'
import { useAuth } from '@/hooks/useAuth'

export default function TravelPage() {
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
    handleUpdateDetails,
    handleAddTravel,
    pushStatus,
    statusText,
    statusTone,
  } = useGoalData(goalId)

  const { enabledAddons, saveAddons } = useAddonsConfig(user?.uid, goalId)
  const [showAddonsManager, setShowAddonsManager] = useState(false)
  
  // Get initial selected day from URL
  const [initialSelectedDay, setInitialSelectedDay] = useState<string | null>(null)
  
  useEffect(() => {
    const dateFromUrl = searchParams.get('date')
    setInitialSelectedDay(dateFromUrl)
  }, [searchParams])

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

  const handleJumpToDay = (iso: string) => {
    // Update URL with selected date without navigating away
    const url = new URL(window.location.href)
    url.searchParams.set('date', iso)
    router.replace(url.pathname + url.search, { scroll: false })
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
          currentAddon="travel"
          currentYear={year}
          enabledAddons={enabledAddons}
          onManageAddons={() => setShowAddonsManager(true)}
        />
      </Navbar>

      <main className="container mx-auto px-4 py-6 space-y-4">
        <YearView
          year={year}
          todayISO={todayISO}
          dayDetails={dayDetails}
          onUpdateDay={handleUpdateDetails}
          onAddTravel={handleAddTravel}
          onJumpToDay={handleJumpToDay}
          initialSelectedDay={initialSelectedDay}
          onPrevYear={() => {
            pushStatus({ text: 'Previous year', tone: 'progress' })
            router.push(`/goal/${goalId}/travel/${year - 1}`)
            pushStatus({ text: 'Year changed', tone: 'success' })
          }}
          onNextYear={() => {
            pushStatus({ text: 'Next year', tone: 'progress' })
            router.push(`/goal/${goalId}/travel/${year + 1}`)
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
