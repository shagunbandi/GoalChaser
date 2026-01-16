'use client'

import type { PluginPageProps } from '@/sdk'
import { AgendaView } from '../components'
import { useGoalData } from '@/hooks/useGoalData'
import { useRouter } from 'next/navigation'

export default function AgendaPage({ context, params, year = new Date().getFullYear() }: PluginPageProps) {
  const goalId = params.id
  const router = useRouter()

  const {
    goal,
    isLoading,
    todayISO,
    pluginData,
    handleUpdateData,
  } = useGoalData(goalId, year)
  
  // Extract agenda-specific data
  const agendaData = pluginData?.['agenda'] || {}
  
  // Wrapper for agenda updates
  const handleUpdateDetails = async (iso: string, updates: any) => {
    await handleUpdateData('agenda', iso, updates)
  }

  const handleJumpToDay = (iso: string) => {
    // Update URL with selected date
    const url = new URL(window.location.href)
    url.searchParams.set('date', iso)
    window.history.replaceState({}, '', url.toString())
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
      <AgendaView
        year={year}
        todayISO={todayISO}
        dayDetails={agendaData}
        subjectConfigs={[]}
        onUpdateDay={handleUpdateDetails}
        onJumpToDay={handleJumpToDay}
        initialSelectedDay={null}
        onPrevYear={() => router.push(`/goal/${goalId}/agenda/${year - 1}`)}
        onNextYear={() => router.push(`/goal/${goalId}/agenda/${year + 1}`)}
      />
    </main>
  )
}
