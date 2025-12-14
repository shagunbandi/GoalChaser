'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

// Hooks
import { useFirebase } from '@/hooks/useFirebase'
import { useGoals } from '@/hooks/useGoals'

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
  const goalId = params.id as string

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
  if (isLoading || goalsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent mx-auto mb-4" />
          <p className="text-slate-400">Loading analytics...</p>
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
        goalName={goal?.name || 'Goal'}
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

        <div className="max-w-7xl mx-auto space-y-6">
          {/* Date Range Selector */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>📅</span> Select Time Period
            </h2>
            <DateRangeSelector
              selectedRange={dateRange}
              onRangeChange={setDateRange}
            />
          </Card>

          {/* Summary Stats with Circular Distribution */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>📈</span> Overview
            </h2>
            <ExtendedSummary summary={summary} />
          </Card>

          {/* Subject & Topic Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject Breakdown */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
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
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>🏷️</span> Topic Breakdown
              </h2>
              <TopicBreakdown data={topicStats} />
            </Card>
          </div>

          {/* Empty State */}
          {summary.daysWithData === 0 && (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Data Yet
              </h3>
              <p className="text-slate-400 mb-6">
                Start tracking your productivity to see analytics here.
              </p>
              <Link
                href={`/goal/${goalId}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-medium rounded-xl transition-all"
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
