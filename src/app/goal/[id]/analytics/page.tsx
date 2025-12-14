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
import {
  DateRangeSelector,
  SubjectBreakdown,
  SubjectSummaryCard,
  TopicBreakdown,
  ExtendedSummary,
} from '@/components/features/analytics'

// Utils
import {
  type DateRange,
  getDateRangePresets,
  getDayWiseProductivity,
  calculateSummary,
  calculateSubjectStats,
  calculateTopicStats,
} from '@/lib/analyticsUtils'
import { toISODateString } from '@/lib/dateUtils'

export default function AnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const goalId = params.id as string

  // Auth hook
  const { user, isLoading: authLoading } = useAuth()

  // Get goal info
  const { getGoal, isLoading: goalsLoading } = useGoals()
  const goal = getGoal(goalId)

  // Firebase hook for data
  const { dayDetails, isLoading, error } = useFirebase(goalId)

  // Date range state - default to last 7 days
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const preset = getDateRangePresets().find((p) => p.id === 'lastweek')
    return preset
      ? preset.getDates()
      : {
          startDate: toISODateString(new Date()),
          endDate: toISODateString(new Date()),
          label: 'Today',
        }
  })

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [authLoading, user, router])

  // Calculate analytics data
  const dayData = useMemo(
    () =>
      getDayWiseProductivity(
        dayDetails,
        dateRange.startDate,
        dateRange.endDate,
      ),
    [dayDetails, dateRange],
  )

  const summary = useMemo(() => calculateSummary(dayData), [dayData])
  const subjectStats = useMemo(() => calculateSubjectStats(dayData), [dayData])
  const topicStats = useMemo(() => calculateTopicStats(dayData), [dayData])

  // Loading state
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
          <div className="w-12 h-12 border-2 border-[#AF52DE] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading analytics...</p>
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
        goalName={goal?.name || 'Goal'}
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

        <div className="max-w-7xl mx-auto space-y-6">
          {/* Date Range Selector */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-white/80 mb-4 flex items-center gap-2">
              <span>📅</span> Select Time Period
            </h2>
            <DateRangeSelector
              selectedRange={dateRange}
              onRangeChange={setDateRange}
            />
          </Card>

          {/* Summary Stats with Circular Distribution */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-white/80 mb-4 flex items-center gap-2">
              <span>📈</span> Overview
            </h2>
            <ExtendedSummary summary={summary} />
          </Card>

          {/* Subject & Topic Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject Breakdown */}
            <Card className="p-6">
              <h2 className="text-lg font-medium text-white/80 mb-4 flex items-center gap-2">
                <span>📚</span> Subject Breakdown
              </h2>
              {subjectStats.length > 0 && (
                <div className="mb-4">
                  <SubjectSummaryCard data={subjectStats} />
                </div>
              )}
              <SubjectBreakdown data={subjectStats} />
            </Card>

            {/* Topic Breakdown */}
            <Card className="p-6">
              <h2 className="text-lg font-medium text-white/80 mb-4 flex items-center gap-2">
                <span>🏷️</span> Topic Breakdown
              </h2>
              <TopicBreakdown data={topicStats} />
            </Card>
          </div>

          {/* Empty State */}
          {summary.daysWithData === 0 && (
            <Card className="p-14 text-center">
              <div className="text-6xl mb-4 opacity-80">📭</div>
              <h3 className="text-xl font-semibold text-white/90 mb-2">
                No Data Yet
              </h3>
              <p className="text-white/50 mb-6">
                Start tracking your productivity to see analytics here.
              </p>
              <Link
                href={`/goal/${goalId}`}
                className="
                  inline-flex items-center gap-2 px-6 py-3
                  bg-gradient-to-r from-[#007AFF] to-[#AF52DE]
                  text-white font-medium rounded-2xl
                  shadow-[0_0_30px_rgba(0,122,255,0.3)]
                  hover:shadow-[0_0_40px_rgba(0,122,255,0.4)]
                  transition-all duration-200
                "
              >
                Start Tracking →
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
