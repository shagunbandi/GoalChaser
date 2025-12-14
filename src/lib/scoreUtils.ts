import type { DayStatus } from '@/types'

export type ScoreCategory = 'low' | 'ok' | 'high' | null

/**
 * Get category from productivity score
 * 1-3: Low, 4-6: OK, 7-10: High
 */
export function getScoreCategory(score: DayStatus): ScoreCategory {
  if (score === null) return null
  if (score >= 7) return 'high'
  if (score >= 4) return 'ok'
  return 'low'
}

/**
 * Get Tailwind color classes based on score
 */
export function getScoreColorClass(score: DayStatus): string {
  const category = getScoreCategory(score)
  switch (category) {
    case 'high':
      return 'bg-green-500 text-white'
    case 'ok':
      return 'bg-yellow-400 text-slate-900'
    case 'low':
      return 'bg-red-500 text-white'
    default:
      return 'bg-white/60 text-slate-900 border border-slate-200/50'
  }
}

/**
 * Get score label text
 */
export function getScoreLabel(score: number): string {
  if (score >= 7) return 'High'
  if (score >= 4) return 'OK'
  return 'Low'
}

/**
 * Get emoji for score category
 */
export function getScoreEmoji(score: number): string {
  const category = getScoreCategory(score)
  switch (category) {
    case 'high':
      return '🟢'
    case 'ok':
      return '🟡'
    case 'low':
      return '🔴'
    default:
      return ''
  }
}

