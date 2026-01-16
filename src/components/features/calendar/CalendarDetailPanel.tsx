'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { DayDetails, SubjectConfig, AddonId } from '@/types'
import { AddonSummaryCard } from './AddonSummaryCard'
import {
  ProductivitySummary,
  HoursSummary,
  FinanceSummary,
  TravelSummary,
  AgendaSummary,
} from './summaries'
import {
  extractProductivityData,
  extractHoursData,
  extractFinanceData,
  extractTravelData,
  extractAgendaData,
} from '@/lib/utils/addon-data-extractor'

interface CalendarDetailPanelProps {
  selectedDate: string
  todayISO: string
  goalId: string
  currentYear: number
  dayDetails: Record<string, DayDetails>
  subjectConfigs: SubjectConfig[]
  enabledAddons: AddonId[]
  onUpdateDetails: (iso: string, updates: Partial<DayDetails>) => Promise<void>
}

export function CalendarDetailPanel({
  selectedDate,
  todayISO,
  goalId,
  currentYear,
  dayDetails,
  subjectConfigs,
  enabledAddons,
  onUpdateDetails,
}: CalendarDetailPanelProps) {
  const router = useRouter()
  const selectedDetails = dayDetails[selectedDate] || {
    status: null,
    subject: '',
    topic: '',
    note: '',
  }

  // Extract data for each addon
  const productivityData = useMemo(
    () => extractProductivityData(dayDetails, selectedDate),
    [dayDetails, selectedDate]
  )
  const hoursData = useMemo(
    () => extractHoursData(dayDetails, selectedDate, subjectConfigs),
    [dayDetails, selectedDate, subjectConfigs]
  )
  const financeData = useMemo(
    () => extractFinanceData(dayDetails, selectedDate),
    [dayDetails, selectedDate]
  )
  const travelData = useMemo(
    () => extractTravelData(dayDetails, selectedDate),
    [dayDetails, selectedDate]
  )
  const agendaData = useMemo(
    () => extractAgendaData(dayDetails, selectedDate),
    [dayDetails, selectedDate]
  )

  // Collapsible state for each addon (auto-expand first one with data)
  const [expandedAddons, setExpandedAddons] = useState<Record<AddonId, boolean>>(() => {
    const initial: Record<AddonId, boolean> = {}
    let firstExpanded = false
    
    // Auto-expand first addon with data
    if (agendaData.hasData && !firstExpanded) {
      initial.calendar = true
      firstExpanded = true
    }
    if (productivityData.hasData && !firstExpanded && enabledAddons.includes('productivity')) {
      initial.productivity = true
      firstExpanded = true
    }
    if (hoursData.hasData && !firstExpanded && enabledAddons.includes('hours')) {
      initial.hours = true
      firstExpanded = true
    }
    if (financeData.hasData && !firstExpanded && enabledAddons.includes('finance')) {
      initial.finance = true
      firstExpanded = true
    }
    if (travelData.hasData && !firstExpanded && enabledAddons.includes('travel')) {
      initial.travel = true
      firstExpanded = true
    }
    
    return initial
  })

  const toggleAddon = (addon: AddonId) => {
    setExpandedAddons((prev) => ({
      ...prev,
      [addon]: !prev[addon],
    }))
  }

  // Navigation handlers
  const navigateToAddon = (addon: AddonId) => {
    const routes: Record<AddonId, string> = {
      productivity: `/goal/${goalId}/productivity/${currentYear}?date=${selectedDate}`,
      hours: `/goal/${goalId}/hours/${currentYear}?date=${selectedDate}`,
      finance: `/goal/${goalId}/finance/${currentYear}?date=${selectedDate}`,
      travel: `/goal/${goalId}/travel/${currentYear}?date=${selectedDate}`,
      analytics: `/goal/${goalId}/analytics?date=${selectedDate}`,
      calendar: `/goal/${goalId}?date=${selectedDate}`,
    }
    router.push(routes[addon])
  }

  // Color themes for each addon
  const colorThemes = {
    productivity: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      text: 'text-purple-400',
    },
    hours: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
    },
    finance: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      text: 'text-green-400',
    },
    travel: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
    },
    agenda: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
    },
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-h-[calc(100vh-200px)] md:max-h-none overflow-y-auto">
      {/* Date Header */}
      <h2 className="text-lg md:text-xl font-semibold text-white/90">
        {new Date(selectedDate).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </h2>

      {/* Notes Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/60">
          Notes
        </label>
        <textarea
          value={selectedDetails.note || ''}
          onChange={(e) => {
            onUpdateDetails(selectedDate, { note: e.target.value })
          }}
          placeholder="Write notes for this day..."
          className="
            w-full min-h-[120px] px-4 py-3
            bg-white/5 border border-white/10
            rounded-xl text-white placeholder-white/30
            focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50
            focus:border-[#007AFF]/30
            transition-all duration-200
            resize-none
          "
        />
      </div>

      {/* Addon Summaries with staggered animation */}
      <div className="space-y-3 pt-2 animate-in fade-in duration-300">
        {/* Agenda Summary (always show if calendar addon is "enabled") */}
        {agendaData.hasData && (
          <AddonSummaryCard
            addon="calendar"
            icon="📝"
            title="Agenda"
            primaryMetric={`${agendaData.completedCount}/${agendaData.totalCount}`}
            expanded={expandedAddons.calendar ?? false}
            onToggle={() => toggleAddon('calendar')}
            color={colorThemes.agenda}
            collapsible={true}
          >
            <AgendaSummary data={agendaData} />
          </AddonSummaryCard>
        )}

        {/* Productivity Summary */}
        {productivityData.hasData && enabledAddons.includes('productivity') && (
          <AddonSummaryCard
            addon="productivity"
            icon="📊"
            title="Productivity"
            primaryMetric={
              productivityData.score !== null
                ? `Score: ${productivityData.score}/10`
                : undefined
            }
            expanded={expandedAddons.productivity ?? false}
            onToggle={() => toggleAddon('productivity')}
            onNavigate={() => navigateToAddon('productivity')}
            color={colorThemes.productivity}
            collapsible={true}
          >
            <ProductivitySummary data={productivityData} />
          </AddonSummaryCard>
        )}

        {/* Hours Summary */}
        {hoursData.hasData && enabledAddons.includes('hours') && (
          <AddonSummaryCard
            addon="hours"
            icon="⏱️"
            title="Hours"
            primaryMetric={`${hoursData.totalHours.toFixed(1)}h`}
            expanded={expandedAddons.hours ?? false}
            onToggle={() => toggleAddon('hours')}
            onNavigate={() => navigateToAddon('hours')}
            color={colorThemes.hours}
            collapsible={true}
          >
            <HoursSummary data={hoursData} />
          </AddonSummaryCard>
        )}

        {/* Finance Summary */}
        {financeData.hasData && enabledAddons.includes('finance') && (
          <AddonSummaryCard
            addon="finance"
            icon="💰"
            title="Finance"
            primaryMetric={`${financeData.netAmount >= 0 ? '+' : ''}₹${Math.abs(
              financeData.netAmount
            ).toLocaleString('en-IN')}`}
            expanded={expandedAddons.finance ?? false}
            onToggle={() => toggleAddon('finance')}
            onNavigate={() => navigateToAddon('finance')}
            color={colorThemes.finance}
            collapsible={true}
          >
            <FinanceSummary data={financeData} />
          </AddonSummaryCard>
        )}

        {/* Travel Summary */}
        {travelData.hasData && enabledAddons.includes('travel') && (
          <AddonSummaryCard
            addon="travel"
            icon="✈️"
            title="Travel"
            primaryMetric={`${travelData.travelPlans.length} plan${
              travelData.travelPlans.length > 1 ? 's' : ''
            }`}
            expanded={expandedAddons.travel ?? false}
            onToggle={() => toggleAddon('travel')}
            onNavigate={() => navigateToAddon('travel')}
            color={colorThemes.travel}
            collapsible={true}
          >
            <TravelSummary data={travelData} />
          </AddonSummaryCard>
        )}
      </div>

      {/* Quick Track Links */}
      <div className="space-y-2 pt-4 border-t border-white/10">
        <div className="text-sm font-medium text-white/60 mb-3">
          Track this day:
        </div>
        <div className="grid grid-cols-2 gap-2">
          {enabledAddons.includes('productivity') && (
            <button
              onClick={() => navigateToAddon('productivity')}
              className="
                px-4 py-3 rounded-xl
                bg-white/5 hover:bg-white/10
                border border-white/10
                text-white/80 hover:text-white
                text-sm font-medium
                transition-all duration-150
                flex items-center gap-2
              "
            >
              <span>📊</span>
              <span>Productivity</span>
            </button>
          )}
          {enabledAddons.includes('hours') && (
            <button
              onClick={() => navigateToAddon('hours')}
              className="
                px-4 py-3 rounded-xl
                bg-white/5 hover:bg-white/10
                border border-white/10
                text-white/80 hover:text-white
                text-sm font-medium
                transition-all duration-150
                flex items-center gap-2
              "
            >
              <span>⏱️</span>
              <span>Hours</span>
            </button>
          )}
          {enabledAddons.includes('finance') && (
            <button
              onClick={() => navigateToAddon('finance')}
              className="
                px-4 py-3 rounded-xl
                bg-white/5 hover:bg-white/10
                border border-white/10
                text-white/80 hover:text-white
                text-sm font-medium
                transition-all duration-150
                flex items-center gap-2
              "
            >
              <span>💰</span>
              <span>Finance</span>
            </button>
          )}
          {enabledAddons.includes('travel') && (
            <button
              onClick={() => navigateToAddon('travel')}
              className="
                px-4 py-3 rounded-xl
                bg-white/5 hover:bg-white/10
                border border-white/10
                text-white/80 hover:text-white
                text-sm font-medium
                transition-all duration-150
                flex items-center gap-2
              "
            >
              <span>✈️</span>
              <span>Travel</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
