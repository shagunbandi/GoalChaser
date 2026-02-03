import type { LanguageTutorDayData } from './types'

/**
 * Count total lessons completed (days with teaching content)
 */
export function countTotalLessons(
  allData: Record<string, LanguageTutorDayData>
): number {
  return Object.values(allData).filter(
    (data) => data.teachingContent && data.teachingContent.trim() !== ''
  ).length
}

/**
 * Count total quizzes taken (days with QnA answered)
 */
export function countTotalQuizzes(
  allData: Record<string, LanguageTutorDayData>
): number {
  return Object.values(allData).filter(
    (data) => data.qna && data.qna.score && data.qna.score.total > 0
  ).length
}

/**
 * Calculate average quiz score across all quizzes
 */
export function calculateAverageScore(
  allData: Record<string, LanguageTutorDayData>
): number {
  const quizzes = Object.values(allData).filter(
    (data) => data.qna && data.qna.score && data.qna.score.total > 0
  )

  if (quizzes.length === 0) return 0

  const totalPercentage = quizzes.reduce((sum, data) => {
    return sum + (data.qna?.score?.percentage ?? 0)
  }, 0)

  return Math.round(totalPercentage / quizzes.length)
}

/**
 * Calculate learning streak (consecutive days with lessons)
 */
export function calculateLearningStreak(
  allData: Record<string, LanguageTutorDayData>,
  todayISO: string
): number {
  const sortedDates = Object.keys(allData)
    .filter((date) => date <= todayISO)
    .sort()
    .reverse()

  let streak = 0
  let currentDate = todayISO

  for (const date of sortedDates) {
    if (date > currentDate) continue
    if (date < currentDate) {
      // Check if gap is more than 1 day
      const daysDiff = Math.floor(
        (new Date(currentDate).getTime() - new Date(date).getTime()) /
          (1000 * 60 * 60 * 24)
      )
      if (daysDiff > 1) break
    }

    const data = allData[date]
    if (data.teachingContent && data.teachingContent.trim() !== '') {
      streak++
      currentDate = date
    } else {
      break
    }
  }

  return streak
}

/**
 * Count lessons in a specific period
 */
export function countLessonsInPeriod(
  data: Record<string, LanguageTutorDayData>
): number {
  return Object.values(data).filter(
    (day) => day.teachingContent && day.teachingContent.trim() !== ''
  ).length
}

/**
 * Calculate average score in a specific period
 */
export function calculateAverageScoreInPeriod(
  data: Record<string, LanguageTutorDayData>
): number {
  const quizzes = Object.values(data).filter(
    (day) => day.qna && day.qna.score && day.qna.score.total > 0
  )

  if (quizzes.length === 0) return 0

  const totalPercentage = quizzes.reduce((sum, day) => {
    return sum + (day.qna?.score?.percentage ?? 0)
  }, 0)

  return Math.round(totalPercentage / quizzes.length)
}

/**
 * Get score distribution (excellent, good, needs review)
 */
export function getScoreDistribution(
  data: Record<string, LanguageTutorDayData>
): { excellent: number; good: number; needsReview: number } {
  const quizzes = Object.values(data).filter(
    (day) => day.qna && day.qna.score && day.qna.score.total > 0
  )

  const distribution = {
    excellent: 0, // 80%+
    good: 0, // 60-79%
    needsReview: 0, // <60%
  }

  quizzes.forEach((day) => {
    const percentage = day.qna?.score?.percentage ?? 0
    if (percentage >= 80) {
      distribution.excellent++
    } else if (percentage >= 60) {
      distribution.good++
    } else {
      distribution.needsReview++
    }
  })

  return distribution
}

/**
 * Build score breakdown for insights
 */
export function buildScoreBreakdown(
  data: Record<string, LanguageTutorDayData>
): Array<{ label: string; value: string; count: number; color: string }> {
  const dist = getScoreDistribution(data)
  
  return [
    {
      label: 'Excellent (80%+)',
      value: `${dist.excellent} quiz${dist.excellent !== 1 ? 'zes' : ''}`,
      count: dist.excellent,
      color: '#22C55E',
    },
    {
      label: 'Good (60-79%)',
      value: `${dist.good} quiz${dist.good !== 1 ? 'zes' : ''}`,
      count: dist.good,
      color: '#FBBF24',
    },
    {
      label: 'Needs Review (<60%)',
      value: `${dist.needsReview} quiz${dist.needsReview !== 1 ? 'zes' : ''}`,
      count: dist.needsReview,
      color: '#EF4444',
    },
  ].filter((item) => item.count > 0)
}
