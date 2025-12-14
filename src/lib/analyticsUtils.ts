import type { DayDetails, SubjectEntry } from '@/types'
import { toISODateString } from './dateUtils'

// ============ Types ============
export interface DateRange {
  startDate: string
  endDate: string
  label: string
}

export interface DayProductivity {
  date: string
  dayName: string
  score: number | null
  subject: string
  topic: string
  // New fields for multi-subject support
  subjects: SubjectEntry[]
  totalHours: number
}

export interface SubjectStats {
  name: string
  totalDays: number
  avgScore: number
  totalScore: number
  totalHours: number
  topics: TopicStats[]
}

export interface TopicStats {
  name: string
  subject: string
  totalDays: number
  avgScore: number
  totalScore: number
  totalHours: number
}

export interface AnalyticsSummary {
  totalDays: number
  daysWithData: number
  avgScore: number
  totalScore: number
  totalHours: number
  highProductivityDays: number  // score >= 7
  mediumProductivityDays: number // score 4-6
  lowProductivityDays: number // score 1-3
  bestDay: DayProductivity | null
  worstDay: DayProductivity | null
}

// ============ Date Range Presets ============
export function getDateRangePresets(): { id: string; label: string; getDates: () => DateRange }[] {
  return [
    {
      id: 'last3days',
      label: 'Last 3 Days',
      getDates: () => {
        const today = new Date()
        const start = new Date(today)
        start.setDate(today.getDate() - 2)
        return {
          startDate: toISODateString(start),
          endDate: toISODateString(today),
          label: 'Last 3 Days',
        }
      },
    },
    {
      id: 'lastweek',
      label: 'Last 7 Days',
      getDates: () => {
        const today = new Date()
        const start = new Date(today)
        start.setDate(today.getDate() - 6)
        return {
          startDate: toISODateString(start),
          endDate: toISODateString(today),
          label: 'Last 7 Days',
        }
      },
    },
    {
      id: 'last2weeks',
      label: 'Last 2 Weeks',
      getDates: () => {
        const today = new Date()
        const start = new Date(today)
        start.setDate(today.getDate() - 13)
        return {
          startDate: toISODateString(start),
          endDate: toISODateString(today),
          label: 'Last 2 Weeks',
        }
      },
    },
    {
      id: 'lastmonth',
      label: 'Last 30 Days',
      getDates: () => {
        const today = new Date()
        const start = new Date(today)
        start.setDate(today.getDate() - 29)
        return {
          startDate: toISODateString(start),
          endDate: toISODateString(today),
          label: 'Last 30 Days',
        }
      },
    },
    {
      id: 'last3months',
      label: 'Last 3 Months',
      getDates: () => {
        const today = new Date()
        const start = new Date(today)
        start.setMonth(today.getMonth() - 3)
        return {
          startDate: toISODateString(start),
          endDate: toISODateString(today),
          label: 'Last 3 Months',
        }
      },
    },
  ]
}

// ============ Analytics Functions ============

/**
 * Get all dates between start and end (inclusive)
 */
export function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const current = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')

  while (current <= end) {
    dates.push(toISODateString(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

/**
 * Get day name from ISO date string
 */
export function getDayName(iso: string): string {
  const date = new Date(iso + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

/**
 * Get short date format (Dec 14)
 */
export function getShortDate(iso: string): string {
  const date = new Date(iso + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Get day-wise productivity data for a date range
 */
export function getDayWiseProductivity(
  dayDetails: Record<string, DayDetails>,
  startDate: string,
  endDate: string
): DayProductivity[] {
  const dates = getDatesInRange(startDate, endDate)

  return dates.map((date) => {
    const details = dayDetails[date]
    const subjects = details?.subjects || []
    const totalHours = subjects.reduce((sum, s) => sum + (s.hours || 0), 0)
    
    return {
      date,
      dayName: getDayName(date),
      score: details?.status ?? null,
      subject: details?.subject ?? '',
      topic: details?.topic ?? '',
      subjects,
      totalHours,
    }
  })
}

/**
 * Calculate overall analytics summary
 */
export function calculateSummary(dayData: DayProductivity[]): AnalyticsSummary {
  const daysWithScores = dayData.filter((d) => d.score !== null && d.score > 0)
  const totalHours = dayData.reduce((sum, d) => sum + d.totalHours, 0)

  if (daysWithScores.length === 0) {
    return {
      totalDays: dayData.length,
      daysWithData: 0,
      avgScore: 0,
      totalScore: 0,
      totalHours,
      highProductivityDays: 0,
      mediumProductivityDays: 0,
      lowProductivityDays: 0,
      bestDay: null,
      worstDay: null,
    }
  }

  const totalScore = daysWithScores.reduce((sum, d) => sum + (d.score || 0), 0)
  const avgScore = totalScore / daysWithScores.length

  const highDays = daysWithScores.filter((d) => d.score! >= 7).length
  const mediumDays = daysWithScores.filter((d) => d.score! >= 4 && d.score! < 7).length
  const lowDays = daysWithScores.filter((d) => d.score! < 4).length

  const sortedByScore = [...daysWithScores].sort((a, b) => (b.score || 0) - (a.score || 0))
  const bestDay = sortedByScore[0] || null
  const worstDay = sortedByScore[sortedByScore.length - 1] || null

  return {
    totalDays: dayData.length,
    daysWithData: daysWithScores.length,
    avgScore: Math.round(avgScore * 10) / 10,
    totalScore,
    totalHours,
    highProductivityDays: highDays,
    mediumProductivityDays: mediumDays,
    lowProductivityDays: lowDays,
    bestDay,
    worstDay,
  }
}

/**
 * Calculate subject-wise statistics
 */
export function calculateSubjectStats(dayData: DayProductivity[]): SubjectStats[] {
  const subjectMap = new Map<string, { 
    days: Set<string>
    hours: number
    scores: number[]
    topics: Map<string, { days: Set<string>; hours: number; scores: number[] }> 
  }>()

  // Group by subject and topic using new subjects array
  dayData.forEach((day) => {
    // Process multi-subject entries
    if (day.subjects && day.subjects.length > 0) {
      day.subjects.forEach((entry) => {
        if (!entry.subject) return

        if (!subjectMap.has(entry.subject)) {
          subjectMap.set(entry.subject, { 
            days: new Set(), 
            hours: 0, 
            scores: [],
            topics: new Map() 
          })
        }

        const subjectData = subjectMap.get(entry.subject)!
        subjectData.days.add(day.date)
        subjectData.hours += entry.hours || 0
        if (day.score !== null && day.score > 0) {
          subjectData.scores.push(day.score)
        }

        // Process topics
        entry.topics.forEach((topic) => {
          if (!subjectData.topics.has(topic)) {
            subjectData.topics.set(topic, { days: new Set(), hours: 0, scores: [] })
          }
          const topicData = subjectData.topics.get(topic)!
          topicData.days.add(day.date)
          topicData.hours += entry.hours / (entry.topics.length || 1) // Distribute hours across topics
          if (day.score !== null && day.score > 0) {
            topicData.scores.push(day.score)
          }
        })
      })
    }
    // Fallback to legacy single subject/topic
    else if (day.subject && day.score !== null && day.score > 0) {
      if (!subjectMap.has(day.subject)) {
        subjectMap.set(day.subject, { 
          days: new Set(), 
          hours: 0, 
          scores: [],
          topics: new Map() 
        })
      }

      const subjectData = subjectMap.get(day.subject)!
      subjectData.days.add(day.date)
      subjectData.scores.push(day.score)

      if (day.topic) {
        if (!subjectData.topics.has(day.topic)) {
          subjectData.topics.set(day.topic, { days: new Set(), hours: 0, scores: [] })
        }
        const topicData = subjectData.topics.get(day.topic)!
        topicData.days.add(day.date)
        topicData.scores.push(day.score)
      }
    }
  })

  // Calculate stats
  const stats: SubjectStats[] = []

  subjectMap.forEach((data, subjectName) => {
    const totalScore = data.scores.reduce((sum, s) => sum + s, 0)
    const avgScore = data.scores.length > 0 ? totalScore / data.scores.length : 0

    const topicStats: TopicStats[] = []
    data.topics.forEach((topicData, topicName) => {
      const topicTotal = topicData.scores.reduce((sum, s) => sum + s, 0)
      const topicAvg = topicData.scores.length > 0 ? topicTotal / topicData.scores.length : 0
      topicStats.push({
        name: topicName,
        subject: subjectName,
        totalDays: topicData.days.size,
        avgScore: Math.round(topicAvg * 10) / 10,
        totalScore: topicTotal,
        totalHours: Math.round(topicData.hours * 10) / 10,
      })
    })

    // Sort topics by total hours, then by days
    topicStats.sort((a, b) => b.totalHours - a.totalHours || b.totalDays - a.totalDays)

    stats.push({
      name: subjectName,
      totalDays: data.days.size,
      avgScore: Math.round(avgScore * 10) / 10,
      totalScore,
      totalHours: Math.round(data.hours * 10) / 10,
      topics: topicStats,
    })
  })

  // Sort by total hours, then by days
  stats.sort((a, b) => b.totalHours - a.totalHours || b.totalDays - a.totalDays)

  return stats
}

/**
 * Get all unique topics with their stats
 */
export function calculateTopicStats(dayData: DayProductivity[]): TopicStats[] {
  const topicMap = new Map<string, { 
    subject: string
    days: Set<string>
    hours: number
    scores: number[] 
  }>()

  dayData.forEach((day) => {
    // Process multi-subject entries
    if (day.subjects && day.subjects.length > 0) {
      day.subjects.forEach((entry) => {
        entry.topics.forEach((topic) => {
          const key = `${entry.subject}||${topic}`
          if (!topicMap.has(key)) {
            topicMap.set(key, { subject: entry.subject, days: new Set(), hours: 0, scores: [] })
          }
          const topicData = topicMap.get(key)!
          topicData.days.add(day.date)
          topicData.hours += (entry.hours || 0) / (entry.topics.length || 1)
          if (day.score !== null && day.score > 0) {
            topicData.scores.push(day.score)
          }
        })
      })
    }
    // Fallback to legacy
    else if (day.topic && day.score !== null && day.score > 0) {
      const key = `${day.subject}||${day.topic}`
      if (!topicMap.has(key)) {
        topicMap.set(key, { subject: day.subject, days: new Set(), hours: 0, scores: [] })
      }
      const topicData = topicMap.get(key)!
      topicData.days.add(day.date)
      topicData.scores.push(day.score)
    }
  })

  const stats: TopicStats[] = []

  topicMap.forEach((data, key) => {
    const topicName = key.split('||')[1]
    const totalScore = data.scores.reduce((sum, s) => sum + s, 0)
    const avgScore = data.scores.length > 0 ? totalScore / data.scores.length : 0

    stats.push({
      name: topicName,
      subject: data.subject,
      totalDays: data.days.size,
      avgScore: Math.round(avgScore * 10) / 10,
      totalScore,
      totalHours: Math.round(data.hours * 10) / 10,
    })
  })

  stats.sort((a, b) => b.totalHours - a.totalHours || b.totalDays - a.totalDays)

  return stats
}

/**
 * Get score color class based on productivity level
 */
export function getScoreColor(score: number | null): string {
  if (score === null || score === 0) return 'bg-white/10'
  if (score >= 7) return 'bg-[#30D158]'
  if (score >= 4) return 'bg-[#FF9500]'
  return 'bg-[#FF453A]'
}

/**
 * Get score text color class based on productivity level
 */
export function getScoreTextColor(score: number | null): string {
  if (score === null || score === 0) return 'text-white/40'
  if (score >= 7) return 'text-[#30D158]'
  if (score >= 4) return 'text-[#FF9500]'
  return 'text-[#FF453A]'
}

/**
 * Get productivity label
 */
export function getProductivityLabel(score: number | null): string {
  if (score === null || score === 0) return 'No data'
  if (score >= 7) return 'High'
  if (score >= 4) return 'Medium'
  return 'Low'
}

