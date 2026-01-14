'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import { useFirebase } from '@/hooks/useFirebase'
import { useGoals } from '@/hooks/useGoals'
import { useAuth } from '@/hooks/useAuth'

import { Card, Navbar } from '@/components/ui'
import { Calendar, DetailView, YearView, BudgetingView } from '@/components/features'

import {
  toISODateString,
  computeMonthInfo,
  getPreviousMonth,
  getNextMonth,
  getMsUntilMidnight,
  enumerateDateRange,
} from '@/utils'

import type { DayStatus, DayDetails, TravelPlan, BudgetPlan, SIPPlan } from '@/types'
import {
  setFirebaseDb,
  loadBudgetsFromFirebase,
  saveBudgetToFirebase,
  deleteBudgetFromFirebase,
  loadSIPsFromFirebase,
  saveSIPToFirebase,
  deleteSIPFromFirebase,
} from '@/lib/api/budget-api'
import { getFirestore } from 'firebase/firestore'
import { getFirebaseApp } from '@/lib/firebase-service'

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
    updateTopicInSubject,
    isTopicInUse,
  } = useFirebase(goalId)

  // Initialize todayISO and selectedDate together so selectedDate defaults to today
  const [todayISO, setTodayISO] = useState(() => toISODateString(new Date()))
  const [selectedDate, setSelectedDate] = useState(() =>
    toISODateString(new Date()),
  )
  const [viewMode, setViewMode] = useState<'month' | 'travel' | 'budgeting'>('month')
  
  // Budgeting data
  const [budgets, setBudgets] = useState<BudgetPlan[]>([])
  const [sips, setSips] = useState<SIPPlan[]>([])
  const [budgetingLoading, setBudgetingLoading] = useState(true)

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
  
  // Load budgets and SIPs from Firebase
  useEffect(() => {
    if (!user) return
    
    const loadBudgetingData = async () => {
      try {
        const app = getFirebaseApp()
        if (!app) return
        
        const db = getFirestore(app)
        setFirebaseDb(db)
        
        const [loadedBudgets, loadedSIPs] = await Promise.all([
          loadBudgetsFromFirebase(user.uid, goalId),
          loadSIPsFromFirebase(user.uid, goalId),
        ])
        
        setBudgets(loadedBudgets)
        setSips(loadedSIPs)
      } catch (error) {
        console.error('Failed to load budgeting data:', error)
      } finally {
        setBudgetingLoading(false)
      }
    }
    
    loadBudgetingData()
  }, [user, goalId])

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

  const goToPreviousYear = () => {
    setCurrentYear((prev) => prev - 1)
  }

  const goToNextYear = () => {
    setCurrentYear((prev) => prev + 1)
  }

  const handleDayClick = (iso: string) => {
    pushStatus({ text: 'Selecting date…', tone: 'progress' })
    setSelectedDate(iso)
    pushStatus({ text: 'Date selected', tone: 'success' })
  }

  const handleUpdateDetails = async (
    iso: string,
    updates: Partial<DayDetails>,
  ) => {
    await updateDayDetails(iso, updates)
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

  const handleUpdateTopic = (
    subjectId: string,
    oldTopic: string,
    newTopic: string,
  ) => {
    updateTopicInSubject(subjectId, oldTopic, newTopic)
  }

  const handleAddTravel = async (travel: Omit<TravelPlan, 'id'>) => {
    pushStatus({ text: 'Saving travel…', tone: 'progress' })

    try {
      const plan: TravelPlan = {
        ...travel,
        id: `travel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      }

      const dates = enumerateDateRange(plan.startDate, plan.endDate)

      // Show progress
      pushStatus({
        text: `Saving travel to ${dates.length} day${
          dates.length === 1 ? '' : 's'
        }...`,
        tone: 'progress',
      })

      const results = await Promise.all(
        dates.map(async (iso) => {
          const existing = dayDetails[iso]?.travelPlans || []
          const filtered = existing.filter((t) => t.id !== plan.id)
          const updatedPlans = [...filtered, plan]

          try {
            await updateDayDetails(iso, { travelPlans: updatedPlans })
            return { success: true, iso }
          } catch (error) {
            console.error(`❌ Failed to save to ${iso}:`, error)
            return { success: false, iso, error }
          }
        }),
      )

      const successCount = results.filter((r) => r.success).length
      const failCount = results.length - successCount

      setSelectedDate(plan.startDate)

      if (failCount > 0) {
        pushStatus({
          text: `⚠️ Travel saved to ${successCount}/${dates.length} days (${failCount} failed)`,
          tone: 'error',
        })
      } else {
        pushStatus({
          text: `✅ Travel saved to ${dates.length} day${
            dates.length === 1 ? '' : 's'
          } • Firebase synced`,
          tone: 'success',
        })
      }
    } catch (err) {
      console.error('❌ Failed to save travel:', err)
      pushStatus({ text: 'Failed to save travel', tone: 'error' })
    }
  }

  const handleJumpToDay = (iso: string) => {
    const date = new Date(`${iso}T00:00:00`)
    setCurrentYear(date.getFullYear())
    setCurrentMonth(date.getMonth() + 1)
    setSelectedDate(iso)
    setViewMode('month')
    pushStatus({ text: 'Day selected', tone: 'success' })
  }
  
  // Budget handlers
  const handleSaveBudget = async (budget: BudgetPlan) => {
    if (!user) return
    
    const success = await saveBudgetToFirebase(user.uid, goalId, budget)
    if (success) {
      setBudgets((prev) => {
        const existing = prev.findIndex((b) => b.id === budget.id)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = budget
          return updated
        }
        return [...prev, budget]
      })
    }
  }
  
  const handleDeleteBudget = async (budgetId: string) => {
    if (!user) return
    
    const success = await deleteBudgetFromFirebase(user.uid, goalId, budgetId)
    if (success) {
      setBudgets((prev) => prev.filter((b) => b.id !== budgetId))
    }
  }
  
  // SIP handlers
  const handleSaveSIP = async (sip: SIPPlan) => {
    if (!user) return
    
    const success = await saveSIPToFirebase(user.uid, goalId, sip)
    if (success) {
      setSips((prev) => {
        const existing = prev.findIndex((s) => s.id === sip.id)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = sip
          return updated
        }
        return [...prev, sip]
      })
    }
  }
  
  const handleDeleteSIP = async (sipId: string) => {
    if (!user) return
    
    const success = await deleteSIPFromFirebase(user.uid, goalId, sipId)
    if (success) {
      setSips((prev) => prev.filter((s) => s.id !== sipId))
    }
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
          <div className="flex justify-between items-center">
            {/* Left side - Back to travelling view button (only shown in month view) */}
            <div>
              {viewMode === 'month' && (
                <button
                  onClick={() => {
                    setViewMode('travel')
                    pushStatus({ text: 'Travelling Year', tone: 'info' })
                  }}
                  className="
                    inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
                    bg-white/5 hover:bg-white/10 text-white/80 border border-white/10
                    transition-all duration-150
                  "
                >
                  ← Back to year view
                </button>
              )}
            </div>

            {/* Right side - View mode toggle */}
            <div className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`
                  px-4 py-2 text-sm font-medium rounded-xl transition-all duration-150
                  ${
                    viewMode === 'month'
                      ? 'bg-white/90 text-black shadow-[0_0_16px_rgba(255,255,255,0.25)]'
                      : 'text-white/70 hover:bg-white/10'
                  }
                `}
              >
                📅 Month
              </button>
              <button
                onClick={() => setViewMode('travel')}
                className={`
                  px-4 py-2 text-sm font-medium rounded-xl transition-all duration-150
                  ${
                    viewMode === 'travel'
                      ? 'bg-white/90 text-black shadow-[0_0_16px_rgba(255,255,255,0.25)]'
                      : 'text-white/70 hover:bg-white/10'
                  }
                `}
              >
                ✈️ Travel
              </button>
              <button
                onClick={() => setViewMode('budgeting')}
                className={`
                  px-4 py-2 text-sm font-medium rounded-xl transition-all duration-150
                  ${
                    viewMode === 'budgeting'
                      ? 'bg-white/90 text-black shadow-[0_0_16px_rgba(255,255,255,0.25)]'
                      : 'text-white/70 hover:bg-white/10'
                  }
                `}
              >
                💰 Budget
              </button>
            </div>
          </div>

          {viewMode === 'month' ? (
            <Card className="p-0 overflow-hidden">
              <div
                className="
                flex flex-col
                md:grid md:grid-cols-2
                divide-y md:divide-y-0
                md:divide-x
                divide-white/[0.06]
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
                    pushStatus({ text: 'Month changed', tone: 'success' })
                  }}
                  onDayClick={handleDayClick}
                  goalStartDate={goal?.startDate}
                  goalEndDate={goal?.endDate}
                  successCriterion={goal?.successCriterion}
                  noCard
                />

                {/* Day Details - Bottom on mobile, Right on desktop */}
                <DetailView
                  selectedDate={selectedDate}
                  todayISO={todayISO}
                  dayDetails={dayDetails}
                  subjectConfigs={subjectConfigs}
                  onUpdateDetails={handleUpdateDetails}
                  onAddSubject={handleAddSubject}
                  onRemoveSubject={handleRemoveSubject}
                  onUpdateSubject={handleUpdateSubject}
                  onToggleHasTopics={handleToggleHasTopics}
                  onAddTopic={handleAddTopic}
                  onRemoveTopic={handleRemoveTopic}
                  onUpdateTopic={handleUpdateTopic}
                  isTopicInUse={isTopicInUse}
                  successCriterion={goal?.successCriterion}
                  noCard
                  onStatus={pushStatus}
                />
              </div>
            </Card>
          ) : viewMode === 'travel' ? (
            <YearView
              year={currentYear}
              todayISO={todayISO}
              dayDetails={dayDetails}
              onUpdateDay={handleUpdateDetails}
              onJumpToDay={handleJumpToDay}
              onPrevYear={() => {
                pushStatus({ text: 'Previous year', tone: 'progress' })
                goToPreviousYear()
                pushStatus({ text: 'Year changed', tone: 'success' })
              }}
              onNextYear={() => {
                pushStatus({ text: 'Next year', tone: 'progress' })
                goToNextYear()
                pushStatus({ text: 'Year changed', tone: 'success' })
              }}
              onAddTravel={handleAddTravel}
            />
          ) : (
            <BudgetingView
              year={currentYear}
              todayISO={todayISO}
              dayDetails={dayDetails}
              budgets={budgets}
              sips={sips}
              onUpdateDay={handleUpdateDetails}
              onSaveBudget={handleSaveBudget}
              onDeleteBudget={handleDeleteBudget}
              onSaveSIP={handleSaveSIP}
              onDeleteSIP={handleDeleteSIP}
              onJumpToDay={handleJumpToDay}
              onPrevYear={() => {
                pushStatus({ text: 'Previous year', tone: 'progress' })
                goToPreviousYear()
                pushStatus({ text: 'Year changed', tone: 'success' })
              }}
              onNextYear={() => {
                pushStatus({ text: 'Next year', tone: 'progress' })
                goToNextYear()
                pushStatus({ text: 'Year changed', tone: 'success' })
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
