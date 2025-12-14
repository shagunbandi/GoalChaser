'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

// Hooks
import { useFirebase } from '@/hooks/useFirebase'
import { useGoals } from '@/hooks/useGoals'

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
  const goalId = params.id as string

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
    addTopicToSubject,
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

  // Loading state
  if (isLoading || goalsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent mx-auto mb-4" />
          <p className="text-slate-400">Loading your goal...</p>
        </div>
      </div>
    )
  }

  // Goal not found
  if (!goal && !goalsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🤔</div>
          <h1 className="text-2xl font-bold text-white mb-4">Goal Not Found</h1>
          <p className="text-slate-400 mb-6">
            This goal doesn&apos;t exist or was deleted.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-medium rounded-xl transition-colors"
          >
            ← Back to Goals
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Subtle grid pattern overlay */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

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
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-center">
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          {/* 
            Desktop Layout:
            - Single card with Calendar + Day Details side by side
            
            Mobile Layout:
            - Calendar on top, Details below with dividing line
          */}

          {/* Mobile View - Stacked layout with divider */}
          <div className="md:hidden">
            <Card className="p-0 overflow-hidden">
              <div className="divide-y divide-white/10">
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
                  onAddTopic={handleAddTopic}
                  noCard
                />
              </div>
            </Card>
          </div>

          {/* Desktop View - Combined card with side-by-side layout */}
          <div className="hidden md:block">
            <Card className="p-0 overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-white/10">
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
                  onAddTopic={handleAddTopic}
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
