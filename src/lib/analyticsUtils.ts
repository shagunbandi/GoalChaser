import type { DayDetails } from '@/types'
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
}

export interface SubjectStats {
  name: string
  totalDays: number
  avgScore: number
  totalScore: number
  topics: TopicStats[]
}

export interface TopicStats {
  name: string
  subject: string
  totalDays: number
  avgScore: number
  totalScore: number
}

export interface AnalyticsSummary {
  totalDays: number
  daysWithData: number
  avgScore: number
  totalScore: number
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
    return {
      date,
      dayName: getDayName(date),
      score: details?.status ?? null,
      subject: details?.subject ?? '',
      topic: details?.topic ?? '',
    }
  })
}

/**
 * Calculate overall analytics summary
 */
export function calculateSummary(dayData: DayProductivity[]): AnalyticsSummary {
  const daysWithScores = dayData.filter((d) => d.score !== null && d.score > 0)

  if (daysWithScores.length === 0) {
    return {
      totalDays: dayData.length,
      daysWithData: 0,
      avgScore: 0,
      totalScore: 0,
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
  const subjectMap = new Map<string, { days: DayProductivity[]; topics: Map<string, DayProductivity[]> }>()

  // Group by subject and topic
  dayData.forEach((day) => {
    if (!day.subject || day.score === null || day.score === 0) return

    if (!subjectMap.has(day.subject)) {
      subjectMap.set(day.subject, { days: [], topics: new Map() })
    }

    const subjectData = subjectMap.get(day.subject)!
    subjectData.days.push(day)

    if (day.topic) {
      if (!subjectData.topics.has(day.topic)) {
        subjectData.topics.set(day.topic, [])
      }
      subjectData.topics.get(day.topic)!.push(day)
    }
  })

  // Calculate stats
  const stats: SubjectStats[] = []

  subjectMap.forEach((data, subjectName) => {
    const totalScore = data.days.reduce((sum, d) => sum + (d.score || 0), 0)
    const avgScore = data.days.length > 0 ? totalScore / data.days.length : 0

    const topicStats: TopicStats[] = []
    data.topics.forEach((topicDays, topicName) => {
      const topicTotal = topicDays.reduce((sum, d) => sum + (d.score || 0), 0)
      const topicAvg = topicDays.length > 0 ? topicTotal / topicDays.length : 0
      topicStats.push({
        name: topicName,
        subject: subjectName,
        totalDays: topicDays.length,
        avgScore: Math.round(topicAvg * 10) / 10,
        totalScore: topicTotal,
      })
    })

    // Sort topics by total days
    topicStats.sort((a, b) => b.totalDays - a.totalDays)

    stats.push({
      name: subjectName,
      totalDays: data.days.length,
      avgScore: Math.round(avgScore * 10) / 10,
      totalScore,
      topics: topicStats,
    })
  })

  // Sort by total days
  stats.sort((a, b) => b.totalDays - a.totalDays)

  return stats
}

/**
 * Get all unique topics with their stats
 */
export function calculateTopicStats(dayData: DayProductivity[]): TopicStats[] {
  const topicMap = new Map<string, { subject: string; days: DayProductivity[] }>()

  dayData.forEach((day) => {
    if (!day.topic || day.score === null || day.score === 0) return

    const key = `${day.subject}||${day.topic}`
    if (!topicMap.has(key)) {
      topicMap.set(key, { subject: day.subject, days: [] })
    }
    topicMap.get(key)!.days.push(day)
  })

  const stats: TopicStats[] = []

  topicMap.forEach((data, key) => {
    const topicName = key.split('||')[1]
    const totalScore = data.days.reduce((sum, d) => sum + (d.score || 0), 0)
    const avgScore = data.days.length > 0 ? totalScore / data.days.length : 0

    stats.push({
      name: topicName,
      subject: data.subject,
      totalDays: data.days.length,
      avgScore: Math.round(avgScore * 10) / 10,
      totalScore,
    })
  })

  stats.sort((a, b) => b.totalDays - a.totalDays)

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

