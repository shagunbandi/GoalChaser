'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

import { useFirebase } from '@/hooks/useFirebase'
import { useGoals } from '@/hooks/useGoals'
import { useAuth } from '@/hooks/useAuth'

import { Card, Navbar } from '@/components/ui'
import { Calendar, GroupedTabBar, AddonsManagerModal, CalendarDetailPanel } from '@/components/features'
import { useAddonsConfig } from '@/hooks/useAddonsConfig'

import {
  toISODateString,
  computeMonthInfo,
  getPreviousMonth,
  getNextMonth,
  getMsUntilMidnight,
} from '@/utils'

import type { DayStatus, DayDetails } from '@/types'

export default function GoalPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const goalId = params.id as string

  // Auth hook
  const { user, isLoading: authLoading } = useAuth()

  // Get goal info
  const { getGoal, isLoading: goalsLoading } = useGoals()
  const goal = getGoal(goalId)

  // Firebase hook for data persistence (scoped to this goal)
  const {
    dayDetails,
    subjectConfigs,
    isLoading,
    error,
    updateDayDetails,
  } = useFirebase(goalId)

  // Initialize todayISO and selectedDate together so selectedDate defaults to today
  const [todayISO, setTodayISO] = useState(() => toISODateString(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => {
    // Check if date is in URL params
    const dateFromUrl = searchParams.get('date')
    return dateFromUrl || toISODateString(new Date())
  })

  // Add-ons management
  const { enabledAddons, saveAddons } = useAddonsConfig(user?.uid, goalId)
  const [showAddonsManager, setShowAddonsManager] = useState(false)

  // Status bar message
  const [statusText, setStatusText] = useState('Ready')
  const [statusTone, setStatusTone] = useState<
    'info' | 'success' | 'error' | 'progress'
  >('info')

  const pushStatus = (status: {
    text: string
    tone?: 'info' | 'success' | 'error' | 'progress'
  }) => {
    setStatusText(status.text)
    setStatusTone(status.tone ?? 'info')
  }

  // Update todayISO at midnight
  useEffect(() => {
    const scheduleUpdate = () => {
      const msUntilMidnight = getMsUntilMidnight()
      return setTimeout(() => {
        setTodayISO(toISODateString(new Date()))
        scheduleUpdate()
      }, msUntilMidnight + 100)
    }
    const timeoutId = scheduleUpdate()
    return () => clearTimeout(timeoutId)
  }, [])

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [authLoading, user, router])

  // Sync selected date when URL changes
  useEffect(() => {
    const dateFromUrl = searchParams.get('date')
    if (dateFromUrl && dateFromUrl !== selectedDate) {
      setSelectedDate(dateFromUrl)
      
      // Update month view to show the selected date's month
      const date = new Date(dateFromUrl)
      setCurrentYear(date.getFullYear())
      setCurrentMonth(date.getMonth() + 1)
    }
  }, [searchParams, selectedDate])

  // Calendar month state
  const initialDate = useMemo(() => new Date(), [])
  const [currentYear, setCurrentYear] = useState(() =>
    initialDate.getFullYear(),
  )
  const [currentMonth, setCurrentMonth] = useState(
    () => initialDate.getMonth() + 1,
  )

  const dayStatuses = useMemo(() => {
    const statuses: Record<string, DayStatus> = {}
    Object.entries(dayDetails).forEach(([iso, details]) => {
      // Show any day with data as having "some activity"
      if (details.note || details.agendaItems?.length || details.status) {
        statuses[iso] = details.status || 5 // Default to "OK" indicator
      }
    })
    return statuses
  }, [dayDetails])

  // Compute month info
  const currentMonthInfo = useMemo(
    () => computeMonthInfo(currentYear, currentMonth),
    [currentYear, currentMonth],
  )

  // Navigation handlers
  const goToPreviousMonth = () => {
    const prev = getPreviousMonth(currentYear, currentMonth)
    setCurrentYear(prev.year)
    setCurrentMonth(prev.month)
  }

  const goToNextMonth = () => {
    const next = getNextMonth(currentYear, currentMonth)
    setCurrentYear(next.year)
    setCurrentMonth(next.month)
  }

  const handleDayClick = (iso: string) => {
    pushStatus({ text: 'Selecting date…', tone: 'progress' })
    setSelectedDate(iso)
    
    // Update URL with selected date seamlessly
    const url = new URL(window.location.href)
    url.searchParams.set('date', iso)
    router.replace(url.pathname + url.search, { scroll: false })
    
    pushStatus({ text: 'Date selected', tone: 'success' })
  }

  const handleUpdateDetails = async (
    iso: string,
    updates: Partial<DayDetails>,
  ) => {
    await updateDayDetails(iso, updates)
  }

  // Loading state (including auth check)
  if (isLoading || goalsLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {/* Glass Background */}
        <div className="glass-background">
          <div className="orb-1" />
          <div className="orb-2" />
        </div>
        <div className="noise-overlay" />

        <div className="relative z-10 text-center">
          <div className="w-12 h-12 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading your goal...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - will redirect
  if (!user) {
    return null
  }

  // Goal not found
  if (!goal && !goalsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {/* Glass Background */}
        <div className="glass-background">
          <div className="orb-1" />
          <div className="orb-2" />
        </div>
        <div className="noise-overlay" />

        <div className="relative z-10 text-center">
          <div className="text-6xl mb-4 opacity-80">🤔</div>
          <h1 className="text-2xl font-semibold text-white/90 mb-4">
            Goal Not Found
          </h1>
          <p className="text-white/50 mb-6">
            This goal doesn&apos;t exist or was deleted.
          </p>
          <Link
            href="/"
            className="
              inline-flex items-center gap-2 px-6 py-3
              bg-linear-to-r from-[#007AFF] to-[#AF52DE]
              text-white font-medium rounded-2xl
              shadow-[0_0_30px_rgba(0,122,255,0.3)]
              hover:shadow-[0_0_40px_rgba(0,122,255,0.4)]
              transition-all duration-200
            "
          >
            ← Back to Goals
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Glass Background */}
      <div className="glass-background">
        <div className="orb-1" />
        <div className="orb-2" />
      </div>
      <div className="noise-overlay" />

      {/* Navbar */}
      <Navbar
        goalId={goalId}
        goalName={goal?.name || 'Nitya'}
        goalDescription={goal?.description}
      >
        <GroupedTabBar
          goalId={goalId}
          currentAddon="calendar"
          currentYear={currentYear}
          enabledAddons={enabledAddons}
          onManageAddons={() => setShowAddonsManager(true)}
        />
      </Navbar>

      <div className="relative z-10 p-4 md:p-6">
        {/* Error Banner */}
        {error && (
          <div className="max-w-7xl mx-auto mb-4">
            <div
              className="
              bg-red-500/10 backdrop-blur-xl
              border border-red-500/30 rounded-2xl 
              p-4 text-center
            "
            >
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto space-y-4">
          <Card className="p-0 overflow-hidden">
              <div
                className="
                flex flex-col
                md:grid md:grid-cols-2
                divide-y md:divide-y-0
                md:divide-x
                divide-white/6
              "
              >
                {/* Calendar - Top on mobile, Left on desktop */}
                <Calendar
                  currentYear={currentYear}
                  currentMonth={currentMonth}
                  monthInfo={currentMonthInfo}
                  dayStatuses={dayStatuses}
                  dayDetails={dayDetails}
                  selectedDate={selectedDate}
                  todayISO={todayISO}
                  onPrevMonth={() => {
                    pushStatus({ text: 'Previous month', tone: 'progress' })
                    goToPreviousMonth()
                    pushStatus({ text: 'Month changed', tone: 'success' })
                  }}
                  onNextMonth={() => {
                    pushStatus({ text: 'Next month', tone: 'progress' })
                    goToNextMonth()
                    pushStatus({ text: 'Year changed', tone: 'success' })
                  }}
                  onDayClick={handleDayClick}
                  goalStartDate={goal?.startDate}
                  goalEndDate={goal?.endDate}
                  successCriterion={goal?.successCriterion}
                  noCard
                />

                {/* Day Details with Addon Summaries - Bottom on mobile, Right on desktop */}
                <CalendarDetailPanel
                  selectedDate={selectedDate}
                  todayISO={todayISO}
                  goalId={goalId}
                  currentYear={currentYear}
                  dayDetails={dayDetails}
                  subjectConfigs={subjectConfigs}
                  enabledAddons={enabledAddons}
                  onUpdateDetails={handleUpdateDetails}
                />
              </div>
            </Card>
        </div>
      </div>

      {/* Add-ons Manager Modal */}
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
