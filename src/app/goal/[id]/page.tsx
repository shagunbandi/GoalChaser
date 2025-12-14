'use client'

import { useState, useMemo, useEffect, ReactNode, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useFirebase } from '@/hooks/useFirebase'
import { useGoals } from '@/hooks/useGoals'

// ============ Types ============
export type DayStatus = 'RED' | 'YELLOW' | 'GREEN' | null

interface DayInfo {
  date: Date
  iso: string
  dayOfMonth: number
  weekdayIndex: number // 0 = Monday, 6 = Sunday
}

interface MonthInfo {
  year: number
  month: number // 1–12
  days: DayInfo[]
}

interface DayDetails {
  status: DayStatus
  subject: string
  topic: string
}


type TimeRangeType = 'week' | 'month' | 'year' | 'custom'

interface TimeRange {
  type: TimeRangeType
  startDate: string
  endDate: string
  label: string
}

// ============ Helper Functions ============

function toISODateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function computeMonthInfo(year: number, month: number): MonthInfo {
  const days: DayInfo[] = []
  const daysInMonth = new Date(year, month, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const jsWeekday = date.getDay()
    const weekdayIndex = jsWeekday === 0 ? 6 : jsWeekday - 1

    days.push({
      date,
      iso: toISODateString(date),
      dayOfMonth: day,
      weekdayIndex,
    })
  }

  return { year, month, days }
}

function getPreviousMonth(
  year: number,
  month: number,
): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 }
  return { year, month: month - 1 }
}

function getNextMonth(
  year: number,
  month: number,
): { year: number; month: number } {
  if (month === 12) return { year: year + 1, month: 1 }
  return { year, month: month + 1 }
}

function getMsUntilMidnight(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return midnight.getTime() - now.getTime()
}

function formatDateDisplay(iso: string): string {
  const date = new Date(iso + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatShortDate(iso: string): string {
  const date = new Date(iso + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Get predefined time ranges
function getTimeRanges(todayISO: string): TimeRange[] {
  const today = new Date(todayISO + 'T00:00:00')

  // Last 7 days
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - 6)

  // Last 30 days
  const monthStart = new Date(today)
  monthStart.setDate(today.getDate() - 29)

  // Last 365 days
  const yearStart = new Date(today)
  yearStart.setDate(today.getDate() - 364)

  return [
    {
      type: 'week',
      startDate: toISODateString(weekStart),
      endDate: todayISO,
      label: 'Last 7 Days',
    },
    {
      type: 'month',
      startDate: toISODateString(monthStart),
      endDate: todayISO,
      label: 'Last 30 Days',
    },
    {
      type: 'year',
      startDate: toISODateString(yearStart),
      endDate: todayISO,
      label: 'Last Year',
    },
  ]
}

// ============ Constants ============
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// ============ Reusable Components ============

// Card component for consistent styling
interface CardProps {
  children: ReactNode
  className?: string
}

function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 ${className}`}
    >
      {children}
    </div>
  )
}

// Card Header Component - For inline use within a card
interface CardHeaderProps {
  title: string
  icon?: string
  subtitle?: string
  children?: ReactNode
}

function CardHeader({ title, icon, subtitle, children }: CardHeaderProps) {
  return (
    <div className="border-b border-white/10 pb-4 mb-4">
      <div className="flex items-center justify-center gap-2">
        {icon && <span className="text-xl">{icon}</span>}
        <h2 className="text-lg font-bold text-white tracking-wide uppercase">
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className="text-center text-slate-400 text-xs mt-1">{subtitle}</p>
      )}
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}

// Tabs component for mobile navigation
interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

function Tabs({ tabs, activeTab, onTabChange, className = '' }: TabsProps) {
  return (
    <div
      className={`flex bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-1 ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
            activeTab === tab.id
              ? 'bg-white/20 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// Time Range Selector Component
interface TimeRangeSelectorProps {
  ranges: TimeRange[]
  selectedRange: TimeRange
  onRangeChange: (range: TimeRange) => void
  customStartDate: string
  customEndDate: string
  onCustomStartChange: (date: string) => void
  onCustomEndChange: (date: string) => void
}

function TimeRangeSelector({
  ranges,
  selectedRange,
  onRangeChange,
  customStartDate,
  customEndDate,
  onCustomStartChange,
  onCustomEndChange,
}: TimeRangeSelectorProps) {
  const isCustom = selectedRange.type === 'custom'

  // Use selectedRange dates when in custom mode, otherwise use the custom state
  const displayStartDate = isCustom ? selectedRange.startDate : customStartDate
  const displayEndDate = isCustom ? selectedRange.endDate : customEndDate

  const handleCustomSelect = () => {
    onRangeChange({
      type: 'custom',
      startDate: customStartDate,
      endDate: customEndDate,
      label: 'Custom Range',
    })
  }

  const handleStartDateChange = (newStartDate: string) => {
    onCustomStartChange(newStartDate)
    onRangeChange({
      type: 'custom',
      startDate: newStartDate,
      endDate: displayEndDate,
      label: 'Custom Range',
    })
  }

  const handleEndDateChange = (newEndDate: string) => {
    onCustomEndChange(newEndDate)
    onRangeChange({
      type: 'custom',
      startDate: displayStartDate,
      endDate: newEndDate,
      label: 'Custom Range',
    })
  }

  return (
    <div className="space-y-3">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {ranges.map((range) => (
          <button
            key={range.type}
            onClick={() => onRangeChange(range)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedRange.type === range.type
                ? 'bg-cyan-500 text-white'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            {range.label}
          </button>
        ))}
        <button
          onClick={handleCustomSelect}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            isCustom
              ? 'bg-cyan-500 text-white'
              : 'bg-white/10 text-slate-300 hover:bg-white/20'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Custom date inputs */}
      {isCustom && (
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">From</label>
            <input
              type="date"
              value={displayStartDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">To</label>
            <input
              type="date"
              value={displayEndDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            />
          </div>
        </div>
      )}

      {/* Current range display */}
      <p className="text-xs text-slate-500 text-center">
        {formatShortDate(selectedRange.startDate)} —{' '}
        {formatShortDate(selectedRange.endDate)}
      </p>
    </div>
  )
}

// Autocomplete Input Component
interface AutocompleteInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  suggestions: string[]
  placeholder?: string
}

function AutocompleteInput({
  label,
  value,
  onBlur,
  onChange,
  suggestions,
  placeholder = '',
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Use useMemo instead of useEffect + setState to avoid cascading renders
  const filteredSuggestions = useMemo(() => {
    if (value.trim()) {
      return suggestions.filter(
        (s) =>
          s.toLowerCase().includes(value.toLowerCase()) &&
          s.toLowerCase() !== value.toLowerCase(),
      )
    }
    return suggestions
  }, [value, suggestions])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          // Delay to allow click on suggestion
          setTimeout(() => {
            onBlur?.()
          }, 200)
        }}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
      />
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute z-20 w-full mt-2 bg-slate-800 border border-white/20 rounded-xl shadow-xl overflow-hidden">
          {filteredSuggestions.slice(0, 5).map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                onChange(suggestion)
                setIsOpen(false)
              }}
              className="w-full px-4 py-3 text-left text-slate-200 hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Status Selector Component
interface StatusSelectorProps {
  value: DayStatus
  onChange: (status: DayStatus) => void
}

function StatusSelector({ value, onChange }: StatusSelectorProps) {
  const statuses: {
    status: DayStatus
    label: string
    emoji: string
    color: string
    activeColor: string
  }[] = [
    {
      status: 'GREEN',
      label: 'Good',
      emoji: '🟢',
      color: 'border-green-500/30 hover:bg-green-500/20',
      activeColor: 'bg-green-500 border-green-500 text-white',
    },
    {
      status: 'RED',
      label: 'Bad',
      emoji: '🔴',
      color: 'border-red-500/30 hover:bg-red-500/20',
      activeColor: 'bg-red-500 border-red-500 text-white',
    },
    {
      status: 'YELLOW',
      label: 'Okay',
      emoji: '🟡',
      color: 'border-yellow-500/30 hover:bg-yellow-500/20',
      activeColor: 'bg-yellow-400 border-yellow-400 text-slate-900',
    },
  ]

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-300">
        Productivity Status
      </label>
      <div className="grid grid-cols-3 gap-3">
        {statuses.map(({ status, label, emoji, color, activeColor }) => (
          <button
            key={status}
            onClick={() => onChange(value === status ? null : status)}
            className={`py-4 px-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
              value === status
                ? activeColor
                : `bg-white/5 ${color} text-slate-300`
            }`}
          >
            <span className="text-2xl">{emoji}</span>
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Subject Config interface
interface SubjectConfig {
  id: string
  name: string
  topics: string[]
  color?: string
}

// Detail View Component
interface DetailViewProps {
  selectedDate: string
  dayDetails: Record<string, DayDetails>
  subjectConfigs: SubjectConfig[]
  onUpdateDetails: (iso: string, details: Partial<DayDetails>) => void
  onAddSubject: (name: string) => void
  onAddTopic: (subjectId: string, topic: string) => void
}

function DetailView({
  selectedDate,
  dayDetails,
  subjectConfigs,
  onUpdateDetails,
  onAddSubject,
  onAddTopic,
}: DetailViewProps) {
  const [feedback, setFeedback] = useState('')
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [newSubjectInput, setNewSubjectInput] = useState('')
  const [newTopicInput, setNewTopicInput] = useState('')

  const details = dayDetails[selectedDate]
  const currentSubject = details?.subject || ''
  const currentTopic = details?.topic || ''
  const currentStatus = details?.status || null

  // Get available subjects and topics
  const availableSubjects = subjectConfigs.map((s) => s.name)
  const selectedSubjectConfig = subjectConfigs.find((s) => s.name === currentSubject)
  const availableTopics = currentSubject
    ? selectedSubjectConfig?.topics || []
    : subjectConfigs.flatMap((s) => s.topics).filter((v, i, a) => a.indexOf(v) === i)

  const showFeedback = (message: string) => {
    setFeedback(message)
    setTimeout(() => setFeedback(''), 2500)
  }

  const handleSubjectSelect = (subject: string) => {
    onUpdateDetails(selectedDate, { subject, topic: '' })
    showFeedback(`📚 Subject set to: ${subject}`)
    setShowAddSubject(false)
  }

  const handleTopicSelect = (topic: string) => {
    onUpdateDetails(selectedDate, { topic })
    showFeedback(`🏷️ Topic set to: ${topic}`)
    setShowAddTopic(false)
  }

  const handleAddNewSubject = () => {
    if (newSubjectInput.trim()) {
      onAddSubject(newSubjectInput.trim())
      onUpdateDetails(selectedDate, { subject: newSubjectInput.trim(), topic: '' })
      showFeedback(`✅ Created and selected: ${newSubjectInput.trim()}`)
      setNewSubjectInput('')
      setShowAddSubject(false)
    }
  }

  const handleAddNewTopic = () => {
    if (newTopicInput.trim() && selectedSubjectConfig) {
      onAddTopic(selectedSubjectConfig.id, newTopicInput.trim())
      onUpdateDetails(selectedDate, { topic: newTopicInput.trim() })
      showFeedback(`✅ Created and selected: ${newTopicInput.trim()}`)
      setNewTopicInput('')
      setShowAddTopic(false)
    }
  }

  return (
    <Card className="p-5">
      <CardHeader
        icon="📝"
        title="Day Details"
        subtitle={formatDateDisplay(selectedDate)}
      />

      <div className="space-y-5">
        {/* Status Selector */}
        <StatusSelector
          value={currentStatus}
          onChange={(status) => {
            onUpdateDetails(selectedDate, { status })
            if (status) {
              const labels = { GREEN: 'Good 🟢', YELLOW: 'Okay 🟡', RED: 'Bad 🔴' }
              showFeedback(`Status set to ${labels[status]}`)
            }
          }}
        />

        {/* Subject Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Subject</label>
          {availableSubjects.length > 0 && !showAddSubject ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {availableSubjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => handleSubjectSelect(subject)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentSubject === subject
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
                <button
                  onClick={() => setShowAddSubject(true)}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-dashed border-white/20 transition-all"
                >
                  + New
                </button>
              </div>
              {currentSubject && (
                <button
                  onClick={() => {
                    onUpdateDetails(selectedDate, { subject: '', topic: '' })
                    showFeedback('Subject cleared')
                  }}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Clear selection
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubjectInput}
                  onChange={(e) => setNewSubjectInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNewSubject()}
                  placeholder="Enter new subject name..."
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  autoFocus
                />
                <button
                  onClick={handleAddNewSubject}
                  disabled={!newSubjectInput.trim()}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
                >
                  Add
                </button>
                {availableSubjects.length > 0 && (
                  <button
                    onClick={() => { setShowAddSubject(false); setNewSubjectInput('') }}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {availableSubjects.length === 0 && (
                <p className="text-xs text-slate-500">
                  No subjects yet. Add your first subject above or in Settings.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Topic Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Topic</label>
          {availableTopics.length > 0 && !showAddTopic ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {availableTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => handleTopicSelect(topic)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentTopic === topic
                        ? 'bg-violet-500 text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
                {currentSubject && (
                  <button
                    onClick={() => setShowAddTopic(true)}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-dashed border-white/20 transition-all"
                  >
                    + New
                  </button>
                )}
              </div>
              {currentTopic && (
                <button
                  onClick={() => {
                    onUpdateDetails(selectedDate, { topic: '' })
                    showFeedback('Topic cleared')
                  }}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Clear selection
                </button>
              )}
            </div>
          ) : currentSubject ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTopicInput}
                  onChange={(e) => setNewTopicInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNewTopic()}
                  placeholder="Enter new topic name..."
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
                  autoFocus
                />
                <button
                  onClick={handleAddNewTopic}
                  disabled={!newTopicInput.trim()}
                  className="px-4 py-2 bg-violet-500 hover:bg-violet-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
                >
                  Add
                </button>
                {availableTopics.length > 0 && (
                  <button
                    onClick={() => { setShowAddTopic(false); setNewTopicInput('') }}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {availableTopics.length === 0 && (
                <p className="text-xs text-slate-500">
                  No topics for this subject yet. Add your first topic above.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Select a subject first to add topics.
            </p>
          )}
        </div>

        {/* Live Feedback */}
        <div className={`bg-white/5 rounded-xl p-4 border border-white/10 transition-all duration-300 ${feedback ? 'opacity-100' : 'opacity-50'}`}>
          {feedback ? (
            <p className="text-cyan-400 text-sm font-medium">{feedback}</p>
          ) : (
            <p className="text-slate-500 text-xs">
              {currentSubject || currentTopic ? (
                <>
                  📋 Current:{' '}
                  {currentSubject && <span className="text-cyan-400">{currentSubject}</span>}
                  {currentSubject && currentTopic && ' → '}
                  {currentTopic && <span className="text-violet-400">{currentTopic}</span>}
                </>
              ) : (
                '💡 Select a subject to get started'
              )}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

// Calendar Component
interface CalendarProps {
  currentYear: number
  currentMonth: number
  monthInfo: MonthInfo
  dayStatuses: Record<string, DayStatus>
  selectedDate: string
  todayISO: string
  onPrevMonth: () => void
  onNextMonth: () => void
  onDayClick: (iso: string) => void
}

function Calendar({
  currentYear,
  currentMonth,
  monthInfo,
  dayStatuses,
  selectedDate,
  todayISO,
  onPrevMonth,
  onNextMonth,
  onDayClick,
}: CalendarProps) {
  const firstDayWeekdayIndex = monthInfo.days[0]?.weekdayIndex || 0
  const emptyCells = Array(firstDayWeekdayIndex).fill(null)

  const getDayClasses = (
    status: DayStatus,
    isToday: boolean,
    isSelected: boolean,
  ): string => {
    let bg = ''
    switch (status) {
      case 'RED':
        bg = 'bg-red-500 text-white'
        break
      case 'YELLOW':
        bg = 'bg-yellow-400 text-slate-900'
        break
      case 'GREEN':
        bg = 'bg-green-500 text-white'
        break
      default:
        bg = 'bg-white/60 text-slate-900 border border-slate-200/50'
    }
    const todayRing = isToday ? 'ring-2 ring-cyan-400 ring-offset-1' : ''
    const selectedRing = isSelected
      ? 'ring-2 ring-violet-400 ring-offset-2 ring-offset-slate-900'
      : ''
    return `${bg} ${todayRing} ${selectedRing} aspect-square rounded-lg cursor-pointer hover:shadow-lg hover:scale-[1.03] transition-all duration-150 flex flex-col items-start justify-start p-2`
  }

  return (
    <Card className="p-5">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 gap-2">
        <button
          onClick={onPrevMonth}
          className="px-2 sm:px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 hover:scale-105 shrink-0"
        >
          ←
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg sm:text-xl">📅</span>
          <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wide truncate">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </h2>
        </div>
        <button
          onClick={onNextMonth}
          className="px-2 sm:px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 hover:scale-105 shrink-0"
        >
          →
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider py-2"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        {monthInfo.days.map((day) => {
          const status = dayStatuses[day.iso] || null
          const isToday = day.iso === todayISO
          const isSelected = day.iso === selectedDate
          return (
            <div
              key={day.iso}
              onClick={() => onDayClick(day.iso)}
              className={getDayClasses(status, isToday, isSelected)}
            >
              <span className="text-sm font-semibold">{day.dayOfMonth}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// Category Count Type
interface CategoryCount {
  name: string
  count: number
}

// Analytics Data Types
interface SubjectAnalytics {
  name: string
  totalDays: number
  greenDays: number
  yellowDays: number
  redDays: number
  topics: string[]
}

interface AnalyticsData {
  subjects: CategoryCount[]
  topics: CategoryCount[]
  subjectAnalytics: SubjectAnalytics[]
  topicsBySubject: Record<string, string[]>
  totalActiveDays: number
  totalSubjects: number
  totalTopics: number
  totalGreenDays: number
  totalYellowDays: number
  totalRedDays: number
  averageProductivity: number // percentage of green days
}

// Donut Chart Component
interface DonutChartProps {
  green: number
  yellow: number
  red: number
  size?: number
}

function DonutChart({ green, yellow, red, size = 120 }: DonutChartProps) {
  const total = green + yellow + red
  if (total === 0) {
    return (
      <div
        className="rounded-full bg-slate-700/50 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-slate-500 text-xs">No data</span>
      </div>
    )
  }

  const greenPct = (green / total) * 100
  const yellowPct = (yellow / total) * 100
  const redPct = (red / total) * 100

  // Calculate stroke dash offsets for the donut segments
  const circumference = 2 * Math.PI * 40 // radius = 40
  const greenDash = (greenPct / 100) * circumference
  const yellowDash = (yellowPct / 100) * circumference
  const redDash = (redPct / 100) * circumference

  const greenOffset = 0
  const yellowOffset = -greenDash
  const redOffset = -(greenDash + yellowDash)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="transform -rotate-90">
        {/* Green segment */}
        {green > 0 && (
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#22c55e"
            strokeWidth="12"
            strokeDasharray={`${greenDash} ${circumference}`}
            strokeDashoffset={greenOffset}
            className="transition-all duration-500"
          />
        )}
        {/* Yellow segment */}
        {yellow > 0 && (
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#facc15"
            strokeWidth="12"
            strokeDasharray={`${yellowDash} ${circumference}`}
            strokeDashoffset={yellowOffset}
            className="transition-all duration-500"
          />
        )}
        {/* Red segment */}
        {red > 0 && (
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#ef4444"
            strokeWidth="12"
            strokeDasharray={`${redDash} ${circumference}`}
            strokeDashoffset={redOffset}
            className="transition-all duration-500"
          />
        )}
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{total}</span>
        <span className="text-xs text-slate-400">days</span>
      </div>
    </div>
  )
}

// Mini Stat Card for overview
interface MiniStatProps {
  icon: string
  label: string
  value: number | string
  subtext?: string
  color: string
}

function MiniStat({ icon, label, value, subtext, color }: MiniStatProps) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className={`text-3xl font-black ${color}`}>{value}</div>
      {subtext && <div className="text-xs text-slate-500 mt-1">{subtext}</div>}
    </div>
  )
}

// Progress Bar with label
interface LabeledProgressProps {
  label: string
  value: number
  max: number
  color: string
  showPercentage?: boolean
}

function LabeledProgress({
  label,
  value,
  max,
  color,
  showPercentage = false,
}: LabeledProgressProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0

  const colorClasses: Record<string, { bar: string; text: string }> = {
    cyan: { bar: 'bg-cyan-500', text: 'text-cyan-400' },
    violet: { bar: 'bg-violet-500', text: 'text-violet-400' },
    green: { bar: 'bg-green-500', text: 'text-green-400' },
    yellow: { bar: 'bg-yellow-400', text: 'text-yellow-400' },
    red: { bar: 'bg-red-500', text: 'text-red-400' },
    fuchsia: { bar: 'bg-fuchsia-500', text: 'text-fuchsia-400' },
  }

  const classes = colorClasses[color] || colorClasses.cyan

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-300 font-medium truncate flex-1 mr-2">
          {label}
        </span>
        <span className={`text-sm font-bold ${classes.text}`}>
          {value} {showPercentage && max > 0 && `(${Math.round(percentage)}%)`}
        </span>
      </div>
      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${classes.bar} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

// Subject Card with topics
interface SubjectCardProps {
  subject: SubjectAnalytics
  maxDays: number
}

function SubjectCard({ subject, maxDays }: SubjectCardProps) {
  const productivityPct =
    subject.totalDays > 0
      ? Math.round((subject.greenDays / subject.totalDays) * 100)
      : 0

  const getProductivityColor = (pct: number) => {
    if (pct >= 70) return 'text-green-400'
    if (pct >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getProductivityBg = (pct: number) => {
    if (pct >= 70)
      return 'from-green-500/20 to-green-600/10 border-green-500/30'
    if (pct >= 40)
      return 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30'
    return 'from-red-500/20 to-red-600/10 border-red-500/30'
  }

  return (
    <div
      className={`bg-gradient-to-r ${getProductivityBg(
        productivityPct,
      )} rounded-xl p-4 border`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📚</span>
          <span className="font-semibold text-white">{subject.name}</span>
        </div>
        <div className="text-right">
          <div
            className={`text-lg font-bold ${getProductivityColor(
              productivityPct,
            )}`}
          >
            {productivityPct}%
          </div>
          <div className="text-xs text-slate-500">productivity</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 mb-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-slate-400">{subject.greenDays}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          <span className="text-slate-400">{subject.yellowDays}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-slate-400">{subject.redDays}</span>
        </div>
        <div className="ml-auto text-slate-400">
          <span className="font-semibold text-white">{subject.totalDays}</span>{' '}
          days total
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all duration-500"
          style={{ width: `${(subject.totalDays / maxDays) * 100}%` }}
        />
      </div>

      {/* Topics */}
      {subject.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {subject.topics.slice(0, 6).map((topic) => (
            <span
              key={topic}
              className="px-2 py-0.5 bg-white/10 rounded-md text-xs text-slate-300"
            >
              {topic}
            </span>
          ))}
          {subject.topics.length > 6 && (
            <span className="px-2 py-0.5 bg-white/5 rounded-md text-xs text-slate-500">
              +{subject.topics.length - 6} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Activity Breakdown / Analytics Component
interface ActivityAnalyticsProps {
  data: AnalyticsData
  ranges: TimeRange[]
  selectedRange: TimeRange
  onRangeChange: (range: TimeRange) => void
  customStartDate: string
  customEndDate: string
  onCustomStartChange: (date: string) => void
  onCustomEndChange: (date: string) => void
}

function ActivityAnalytics({
  data,
  ranges,
  selectedRange,
  onRangeChange,
  customStartDate,
  customEndDate,
  onCustomStartChange,
  onCustomEndChange,
}: ActivityAnalyticsProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const hasData = data.totalActiveDays > 0

  if (!hasData) {
    return (
      <Card className="p-5">
        <CardHeader icon="📊" title="Activity Analytics">
          <TimeRangeSelector
            ranges={ranges}
            selectedRange={selectedRange}
            onRangeChange={onRangeChange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomStartChange={onCustomStartChange}
            onCustomEndChange={onCustomEndChange}
          />
        </CardHeader>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📈</div>
          <p className="text-slate-400 text-lg">No activity recorded yet</p>
          <p className="text-slate-500 text-sm mt-2">
            Start tracking your days to see detailed analytics
          </p>
        </div>
      </Card>
    )
  }

  const maxSubjectDays = Math.max(
    ...data.subjectAnalytics.map((s) => s.totalDays),
    1,
  )
  const maxTopicCount = Math.max(...data.topics.map((t) => t.count), 1)

  // Use overall productivity counts (from all marked days, not just those with subjects)
  const totalGreen = data.totalGreenDays
  const totalYellow = data.totalYellowDays
  const totalRed = data.totalRedDays

  return (
    <Card className="p-5">
      <CardHeader
        icon="📊"
        title="Activity Analytics"
        subtitle={`${data.totalActiveDays} days tracked`}
      >
        <TimeRangeSelector
          ranges={ranges}
          selectedRange={selectedRange}
          onRangeChange={onRangeChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomStartChange={onCustomStartChange}
          onCustomEndChange={onCustomEndChange}
        />
      </CardHeader>

      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-3">
          <MiniStat
            icon="📚"
            label="Subjects"
            value={data.totalSubjects}
            subtext="unique subjects"
            color="text-cyan-400"
          />
          <MiniStat
            icon="🏷️"
            label="Topics"
            value={data.totalTopics}
            subtext="unique topics"
            color="text-violet-400"
          />
          <MiniStat
            icon="📅"
            label="Active Days"
            value={data.totalActiveDays}
            subtext="days with activity"
            color="text-fuchsia-400"
          />
          <MiniStat
            icon="⚡"
            label="Productivity"
            value={`${data.averageProductivity}%`}
            subtext="green days ratio"
            color={
              data.averageProductivity >= 70
                ? 'text-green-400'
                : data.averageProductivity >= 40
                ? 'text-yellow-400'
                : 'text-red-400'
            }
          />
        </div>

        {/* Productivity Donut Chart */}
        {(totalGreen > 0 || totalYellow > 0 || totalRed > 0) && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>🎯</span> Overall Productivity
            </h3>
            <div className="flex items-center justify-center gap-8">
              <DonutChart
                green={totalGreen}
                yellow={totalYellow}
                red={totalRed}
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-slate-300 text-sm">
                    {totalGreen} green (
                    {totalGreen + totalYellow + totalRed > 0
                      ? Math.round(
                          (totalGreen / (totalGreen + totalYellow + totalRed)) *
                            100,
                        )
                      : 0}
                    %)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="text-slate-300 text-sm">
                    {totalYellow} yellow (
                    {totalGreen + totalYellow + totalRed > 0
                      ? Math.round(
                          (totalYellow /
                            (totalGreen + totalYellow + totalRed)) *
                            100,
                        )
                      : 0}
                    %)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-slate-300 text-sm">
                    {totalRed} red (
                    {totalGreen + totalYellow + totalRed > 0
                      ? Math.round(
                          (totalRed / (totalGreen + totalYellow + totalRed)) *
                            100,
                        )
                      : 0}
                    %)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subjects Breakdown */}
        {data.subjectAnalytics.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() =>
                setExpandedSection(
                  expandedSection === 'subjects' ? null : 'subjects',
                )
              }
              className="w-full flex items-center justify-between text-sm font-semibold text-slate-300 uppercase tracking-wider hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">📚</span> Subjects Breakdown (
                {data.totalSubjects})
              </span>
              <span className="text-slate-500">
                {expandedSection === 'subjects' ? '▼' : '▶'}
              </span>
            </button>
            <div
              className={`space-y-3 overflow-hidden transition-all duration-300 ${
                expandedSection === 'subjects' ||
                data.subjectAnalytics.length <= 3
                  ? 'max-h-[2000px] opacity-100'
                  : 'max-h-[400px] opacity-100'
              }`}
            >
              {(expandedSection === 'subjects'
                ? data.subjectAnalytics
                : data.subjectAnalytics.slice(0, 3)
              ).map((subject) => (
                <SubjectCard
                  key={subject.name}
                  subject={subject}
                  maxDays={maxSubjectDays}
                />
              ))}
              {expandedSection !== 'subjects' &&
                data.subjectAnalytics.length > 3 && (
                  <button
                    onClick={() => setExpandedSection('subjects')}
                    className="w-full py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Show {data.subjectAnalytics.length - 3} more subjects...
                  </button>
                )}
            </div>
          </div>
        )}

        {/* Topics Chart */}
        {data.topics.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() =>
                setExpandedSection(
                  expandedSection === 'topics' ? null : 'topics',
                )
              }
              className="w-full flex items-center justify-between text-sm font-semibold text-slate-300 uppercase tracking-wider hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">🏷️</span> Topics Covered (
                {data.totalTopics})
              </span>
              <span className="text-slate-500">
                {expandedSection === 'topics' ? '▼' : '▶'}
              </span>
            </button>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
              {(expandedSection === 'topics'
                ? data.topics
                : data.topics.slice(0, 5)
              ).map((topic, index) => (
                <LabeledProgress
                  key={topic.name}
                  label={topic.name}
                  value={topic.count}
                  max={maxTopicCount}
                  color={
                    ['violet', 'fuchsia', 'cyan', 'green', 'yellow'][index % 5]
                  }
                />
              ))}
              {expandedSection !== 'topics' && data.topics.length > 5 && (
                <button
                  onClick={() => setExpandedSection('topics')}
                  className="w-full py-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Show {data.topics.length - 5} more topics...
                </button>
              )}
            </div>
          </div>
        )}

        {/* Topics by Subject */}
        {Object.keys(data.topicsBySubject).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="text-lg">🔗</span> Topics by Subject
            </h3>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
              {Object.entries(data.topicsBySubject)
                .slice(0, expandedSection === 'topicsBySubject' ? undefined : 4)
                .map(([subject, topics]) => (
                  <div key={subject}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-cyan-400 font-medium">
                        {subject}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({topics.length} topics)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-2">
                      {topics.slice(0, 8).map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-0.5 bg-violet-500/20 border border-violet-500/30 rounded-md text-xs text-violet-300"
                        >
                          {topic}
                        </span>
                      ))}
                      {topics.length > 8 && (
                        <span className="px-2 py-0.5 bg-white/5 rounded-md text-xs text-slate-500">
                          +{topics.length - 8}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              {expandedSection !== 'topicsBySubject' &&
                Object.keys(data.topicsBySubject).length > 4 && (
                  <button
                    onClick={() => setExpandedSection('topicsBySubject')}
                    className="w-full py-2 text-sm text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
                  >
                    Show {Object.keys(data.topicsBySubject).length - 4} more...
                  </button>
                )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// ============ Main Component ============
export default function GoalPage() {
  const params = useParams()
  const router = useRouter()
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
    removeSubjectConfig,
    addTopicToSubject,
    removeTopicFromSubject,
  } = useFirebase(goalId)

  // Initialize todayISO and selectedDate together so selectedDate defaults to today
  const [todayISO, setTodayISO] = useState(() => toISODateString(new Date()))
  const [activeTab, setActiveTab] = useState('calendar')
  const [selectedDate, setSelectedDate] = useState(() =>
    toISODateString(new Date()),
  )

  // Time range state for stats
  const timeRanges = useMemo(() => getTimeRanges(todayISO), [todayISO])
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(() => {
    const ranges = getTimeRanges(toISODateString(new Date()))
    return ranges[1] // Default to "Last 30 Days"
  })
  const [customStartDate, setCustomStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 29)
    return toISODateString(date)
  })
  const [customEndDate, setCustomEndDate] = useState(() =>
    toISODateString(new Date()),
  )

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

  const { currentMonthInfo, prevMonthInfo, nextMonthInfo } = useMemo(() => {
    const prev = getPreviousMonth(currentYear, currentMonth)
    const next = getNextMonth(currentYear, currentMonth)
    return {
      currentMonthInfo: computeMonthInfo(currentYear, currentMonth),
      prevMonthInfo: computeMonthInfo(prev.year, prev.month),
      nextMonthInfo: computeMonthInfo(next.year, next.month),
    }
  }, [currentYear, currentMonth])

  void prevMonthInfo
  void nextMonthInfo

  // Generate list of dates in the selected time range
  const datesInRange = useMemo(() => {
    const dates: string[] = []
    const startDateStr = selectedTimeRange.startDate
    const endDateStr = selectedTimeRange.endDate

    if (!startDateStr || !endDateStr) return dates

    const start = new Date(startDateStr + 'T00:00:00')
    const end = new Date(endDateStr + 'T00:00:00')

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return dates
    if (start > end) return dates

    const current = new Date(start)
    while (current <= end) {
      dates.push(toISODateString(current))
      current.setDate(current.getDate() + 1)
    }
    return dates
  }, [selectedTimeRange.startDate, selectedTimeRange.endDate])

  // Compute comprehensive analytics for selected time range
  const analyticsData = useMemo((): AnalyticsData => {
    const subjectCounts: Record<string, number> = {}
    const topicCounts: Record<string, number> = {}
    const subjectDetails: Record<
      string,
      {
        greenDays: number
        yellowDays: number
        redDays: number
        topics: Set<string>
      }
    > = {}
    const topicsBySubject: Record<string, Set<string>> = {}

    // Overall productivity counts (regardless of subject/topic)
    let totalGreenDays = 0
    let totalYellowDays = 0
    let totalRedDays = 0
    let activeDays = 0

    datesInRange.forEach((iso) => {
      const details = dayDetails[iso]
      const subject = details?.subject?.trim() || ''
      const topic = details?.topic?.trim() || ''
      const status = details?.status

      // Count days with any productivity status (green/yellow/red)
      if (status === 'GREEN') {
        totalGreenDays++
        activeDays++
      } else if (status === 'YELLOW') {
        totalYellowDays++
        activeDays++
      } else if (status === 'RED') {
        totalRedDays++
        activeDays++
      }

      // Subject counts and details
      if (subject) {
        subjectCounts[subject] = (subjectCounts[subject] || 0) + 1

        if (!subjectDetails[subject]) {
          subjectDetails[subject] = {
            greenDays: 0,
            yellowDays: 0,
            redDays: 0,
            topics: new Set(),
          }
        }

        if (status === 'GREEN') subjectDetails[subject].greenDays++
        else if (status === 'YELLOW') subjectDetails[subject].yellowDays++
        else if (status === 'RED') subjectDetails[subject].redDays++

        if (topic) {
          subjectDetails[subject].topics.add(topic)
          if (!topicsBySubject[subject]) {
            topicsBySubject[subject] = new Set()
          }
          topicsBySubject[subject].add(topic)
        }
      }

      // Topic counts
      if (topic) {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1
      }
    })

    // Convert to arrays and sort by count descending
    const subjects: CategoryCount[] = Object.entries(subjectCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const topics: CategoryCount[] = Object.entries(topicCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // Build subject analytics array
    const subjectAnalytics: SubjectAnalytics[] = Object.entries(subjectDetails)
      .map(([name, data]) => ({
        name,
        totalDays: subjectCounts[name] || 0,
        greenDays: data.greenDays,
        yellowDays: data.yellowDays,
        redDays: data.redDays,
        topics: Array.from(data.topics),
      }))
      .sort((a, b) => b.totalDays - a.totalDays)

    // Convert topics by subject to regular object with arrays
    const topicsBySubjectObj: Record<string, string[]> = {}
    Object.entries(topicsBySubject).forEach(([subject, topicsSet]) => {
      topicsBySubjectObj[subject] = Array.from(topicsSet)
    })

    // Calculate average productivity from ALL marked days (not just those with subjects)
    const totalMarkedDays = totalGreenDays + totalYellowDays + totalRedDays
    const averageProductivity =
      totalMarkedDays > 0
        ? Math.round((totalGreenDays / totalMarkedDays) * 100)
        : 0

    return {
      subjects,
      topics,
      subjectAnalytics,
      topicsBySubject: topicsBySubjectObj,
      totalActiveDays: activeDays,
      totalSubjects: subjects.length,
      totalTopics: topics.length,
      totalGreenDays,
      totalYellowDays,
      totalRedDays,
      averageProductivity,
    }
  }, [datesInRange, dayDetails])

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
    setActiveTab('details')
  }

  const handleUpdateDetails = (iso: string, updates: Partial<DayDetails>) => {
    // Use Firebase to update
    updateDayDetails(iso, updates)
  }

  const handleAddSubject = (name: string) => {
    addSubjectConfig(name)
  }

  const handleAddTopic = (subjectId: string, topic: string) => {
    addTopicToSubject(subjectId, topic)
  }

  // Mobile tabs: 3 views
  const tabs: Tab[] = [
    { id: 'calendar', label: 'Calendar' },
    { id: 'details', label: 'Details' },
    { id: 'analytics', label: 'Analytics' },
  ]

  // Loading state
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
          <p className="text-slate-400 mb-6">This goal doesn&apos;t exist or was deleted.</p>
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

      <div className="relative z-10 min-h-screen p-6">
        {/* Error Banner */}
        {error && (
          <div className="max-w-7xl mx-auto mb-4">
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-center">
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Header with Goal Name */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition-all"
              title="Back to Goals"
            >
              ←
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                {goal?.name || 'Nitya'}
          </h1>
              {goal?.description && (
                <p className="text-slate-400 text-sm mt-1">{goal.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Tabs - visible on small screens */}
        <div className="md:hidden mb-4">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="max-w-7xl mx-auto">
          {/* 
            Desktop Layout:
            - Left column: Calendar + Monthly Stats (stacked)
            - Right column: Day Details + Activity Breakdown (stacked)
            
            Mobile Layout:
            - Tab 1: Calendar only (clicking a day goes to Details tab)
            - Tab 2: Details + Activity Breakdown
            - Tab 3: Monthly Stats
          */}

          <div className="grid grid-cols-1 md:grid-cols-2 md:gap-6">
            {/* Left Column - Calendar */}
            <div className="space-y-4">
              {/* Calendar Panel - shows on calendar tab (mobile) or always (desktop) */}
              <div
                className={`${
                  activeTab === 'calendar' ? 'block' : 'hidden'
                } md:block`}
              >
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
                />
              </div>
            </div>

            {/* Right Column - Day Details + Activity Analytics */}
            <div className="space-y-4">
              {/* Day Details - shows on details tab (mobile) or always (desktop) */}
              <div
                className={`${
                  activeTab === 'details' ? 'block' : 'hidden'
                } md:block`}
              >
                <DetailView
                  selectedDate={selectedDate}
                  dayDetails={dayDetails}
                  subjectConfigs={subjectConfigs}
                  onUpdateDetails={handleUpdateDetails}
                  onAddSubject={handleAddSubject}
                  onAddTopic={handleAddTopic}
                />
              </div>

              {/* Activity Analytics - shows on analytics tab (mobile) or always (desktop) */}
              <div
                className={`${
                  activeTab === 'analytics' ? 'block' : 'hidden'
                } md:block`}
              >
                <ActivityAnalytics
                  data={analyticsData}
                  ranges={timeRanges}
                  selectedRange={selectedTimeRange}
                  onRangeChange={setSelectedTimeRange}
                  customStartDate={customStartDate}
                  customEndDate={customEndDate}
                  onCustomStartChange={setCustomStartDate}
                  onCustomEndChange={setCustomEndDate}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
