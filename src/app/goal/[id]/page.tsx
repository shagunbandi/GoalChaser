'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// Hooks
import { useFirebase } from '@/hooks/useFirebase'
import { useGoals } from '@/hooks/useGoals'
import { useAuth } from '@/hooks/useAuth'

// Components
import { Card, Navbar } from '@/components/ui'
import { Calendar, DetailView } from '@/components/features'

// Utils
import {
  toISODateString,
  computeMonthInfo,
  getPreviousMonth,
  getNextMonth,
  getMsUntilMidnight,
} from '@/lib/dateUtils'

// Types
import type { DayStatus, DayDetails } from '@/types'

export default function GoalPage() {
  const params = useParams()
  const router = useRouter()
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
    addSubjectConfig,
    removeSubjectConfig,
    updateSubjectConfig,
    toggleSubjectHasTopics,
    addTopicToSubject,
    removeTopicFromSubject,
  } = useFirebase(goalId)

  // Initialize todayISO and selectedDate together so selectedDate defaults to today
  const [todayISO, setTodayISO] = useState(() => toISODateString(new Date()))
  const [selectedDate, setSelectedDate] = useState(() =>
    toISODateString(new Date()),
  )

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

  // Calendar month state
  const initialDate = useMemo(() => new Date(), [])
  const [currentYear, setCurrentYear] = useState(() =>
    initialDate.getFullYear(),
  )
  const [currentMonth, setCurrentMonth] = useState(
    () => initialDate.getMonth() + 1,
  )

  // Derive dayStatuses from dayDetails for backward compatibility
  const dayStatuses = useMemo(() => {
    const statuses: Record<string, DayStatus> = {}
    Object.entries(dayDetails).forEach(([iso, details]) => {
      statuses[iso] = details.status
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
    setSelectedDate(iso)
  }

  const handleUpdateDetails = (iso: string, updates: Partial<DayDetails>) => {
    updateDayDetails(iso, updates)
  }

  const handleAddSubject = (name: string) => {
    addSubjectConfig(name)
  }

  const handleAddTopic = (subjectId: string, topic: string) => {
    addTopicToSubject(subjectId, topic)
  }

  const handleRemoveSubject = (id: string) => {
    removeSubjectConfig(id)
  }

  const handleUpdateSubject = (id: string, name: string) => {
    updateSubjectConfig(id, name)
  }

  const handleToggleHasTopics = (id: string) => {
    toggleSubjectHasTopics(id)
  }

  const handleRemoveTopic = (subjectId: string, topic: string) => {
    removeTopicFromSubject(subjectId, topic)
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
          <h1 className="text-2xl font-semibold text-white/90 mb-4">Goal Not Found</h1>
          <p className="text-white/50 mb-6">
            This goal doesn&apos;t exist or was deleted.
          </p>
          <Link
            href="/"
            className="
              inline-flex items-center gap-2 px-6 py-3
              bg-gradient-to-r from-[#007AFF] to-[#AF52DE]
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
      />

      <div className="relative z-10 p-4 md:p-6">
        {/* Error Banner */}
        {error && (
          <div className="max-w-7xl mx-auto mb-4">
            <div className="
              bg-red-500/10 backdrop-blur-xl
              border border-red-500/30 rounded-2xl 
              p-4 text-center
            ">
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          {/* Mobile View - Stacked layout with divider */}
          <div className="md:hidden">
            <Card className="p-0 overflow-hidden">
              <div className="divide-y divide-white/[0.06]">
                {/* Calendar on top */}
                <Calendar
                  currentYear={currentYear}
                  currentMonth={currentMonth}
                  monthInfo={currentMonthInfo}
                  dayStatuses={dayStatuses}
                  selectedDate={selectedDate}
                  todayISO={todayISO}
                  onPrevMonth={goToPreviousMonth}
                  onNextMonth={goToNextMonth}
                  onDayClick={handleDayClick}
                  noCard
                />

                {/* Day Details below */}
                <DetailView
                  selectedDate={selectedDate}
                  dayDetails={dayDetails}
                  subjectConfigs={subjectConfigs}
                  onUpdateDetails={handleUpdateDetails}
                  onAddSubject={handleAddSubject}
                  onRemoveSubject={handleRemoveSubject}
                  onUpdateSubject={handleUpdateSubject}
                  onToggleHasTopics={handleToggleHasTopics}
                  onAddTopic={handleAddTopic}
                  onRemoveTopic={handleRemoveTopic}
                  noCard
                />
              </div>
            </Card>
          </div>

          {/* Desktop View - Combined card with side-by-side layout */}
          <div className="hidden md:block">
            <Card className="p-0 overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
                {/* Left Side - Calendar */}
                <Calendar
                  currentYear={currentYear}
                  currentMonth={currentMonth}
                  monthInfo={currentMonthInfo}
                  dayStatuses={dayStatuses}
                  selectedDate={selectedDate}
                  todayISO={todayISO}
                  onPrevMonth={goToPreviousMonth}
                  onNextMonth={goToNextMonth}
                  onDayClick={(iso) => setSelectedDate(iso)}
                  noCard
                />

                {/* Right Side - Day Details */}
                <DetailView
                  selectedDate={selectedDate}
                  dayDetails={dayDetails}
                  subjectConfigs={subjectConfigs}
                  onUpdateDetails={handleUpdateDetails}
                  onAddSubject={handleAddSubject}
                  onRemoveSubject={handleRemoveSubject}
                  onUpdateSubject={handleUpdateSubject}
                  onToggleHasTopics={handleToggleHasTopics}
                  onAddTopic={handleAddTopic}
                  onRemoveTopic={handleRemoveTopic}
                  noCard
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
