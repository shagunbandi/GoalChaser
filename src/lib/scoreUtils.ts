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
 * Get Apple-style glass color classes based on score
 */
export function getScoreColorClass(score: DayStatus): string {
  const category = getScoreCategory(score)
  switch (category) {
    case 'high':
      return 'bg-[#30D158]/80 text-white shadow-[0_0_15px_rgba(48,209,88,0.3)]'
    case 'ok':
      return 'bg-[#FF9500]/80 text-white shadow-[0_0_15px_rgba(255,149,0,0.3)]'
    case 'low':
      return 'bg-[#FF453A]/80 text-white shadow-[0_0_15px_rgba(255,69,58,0.3)]'
    default:
      return 'bg-white/[0.04] text-white/60 border border-white/[0.08]'
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
