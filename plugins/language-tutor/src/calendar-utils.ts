import type { LanguageTutorDayData } from './types'

/**
 * Get background color based on quiz completion
 */
export function getCompletionBackgroundColor(percentage: number): string {
  if (percentage === 0) return 'rgba(139, 92, 246, 0.1)'
  if (percentage < 50) return 'rgba(239, 68, 68, 0.15)'
  if (percentage < 75) return 'rgba(251, 191, 36, 0.15)'
  return 'rgba(34, 197, 94, 0.15)'
}

/**
 * Get day indicator for calendar
 */
export function getDayIndicator(
  date: string,
  data: LanguageTutorDayData | null
): { color: string; label: string } | null {
  if (!data) return null

  const hasTeaching = !!data.teachingContent
  const hasQnA = !!data.qna && data.qna.questions.length > 0

  if (!hasTeaching && !hasQnA) return null

  // If QnA is present, use score to determine color
  if (hasQnA && data.qna?.score) {
    const { percentage } = data.qna.score
    if (percentage >= 80) {
      return { color: '#22C55E', label: 'Excellent' }
    } else if (percentage >= 60) {
      return { color: '#FBBF24', label: 'Good' }
    } else {
      return { color: '#EF4444', label: 'Needs Review' }
    }
  }

  // If only teaching content, show as in progress
  if (hasTeaching) {
    return { color: '#8B5CF6', label: 'In Progress' }
  }

  return null
}

/**
 * Get day customization for calendar (includes border styling)
 */
export function getLanguageTutorDayCustomization(
  date: string,
  data: LanguageTutorDayData | null,
  showDots: boolean = true
) {
  if (!data) return null

  const hasTeaching = !!data.teachingContent
  const hasQnA = !!data.qna && data.qna.questions.length > 0

  if (!hasTeaching && !hasQnA) return null

  let backgroundColor: string | undefined
  let borderColor = '#8B5CF6'
  let dotColor = '#8B5CF6'

  // Determine background and colors based on QnA score
  if (hasQnA && data.qna?.score) {
    const { percentage } = data.qna.score
    backgroundColor = getCompletionBackgroundColor(percentage)
    
    if (percentage >= 80) {
      borderColor = '#22C55E'
      dotColor = '#22C55E'
    } else if (percentage >= 60) {
      borderColor = '#FBBF24'
      dotColor = '#FBBF24'
    } else {
      borderColor = '#EF4444'
      dotColor = '#EF4444'
    }
  }

  return {
    backgroundColor,
    style: {
      borderLeft: `3px solid ${borderColor}`,
      borderTop: `1px solid ${borderColor}40`,
    },
    ...(showDots && {
      dots: [{ type: 'learning', color: dotColor }],
    }),
  }
}
