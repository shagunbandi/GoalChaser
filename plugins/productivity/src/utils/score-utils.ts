/**
 * Productivity score (1-10) color and label utilities.
 * Used for calendar cell colors, StatusSelector buttons, and labels.
 */

import type { DayStatus } from '../types'

export type ScoreCategory = 'low' | 'ok' | 'high' | null

export function getScoreCategory(score: DayStatus): ScoreCategory {
  if (score === null) return null
  if (score >= 7) return 'high'
  if (score >= 4) return 'ok'
  return 'low'
}

/** Tailwind classes for score buttons (StatusSelector). */
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

/** Tailwind classes for calendar cells (without borders - MonthCalendar handles borders separately) */
export function getScoreColorClassForCalendar(score: DayStatus): string {
  const category = getScoreCategory(score)
  switch (category) {
    case 'high':
      return 'bg-[#30D158]/80 text-white shadow-[0_0_15px_rgba(48,209,88,0.3)]'
    case 'ok':
      return 'bg-[#FF9500]/80 text-white shadow-[0_0_15px_rgba(255,149,0,0.3)]'
    case 'low':
      return 'bg-[#FF453A]/80 text-white shadow-[0_0_15px_rgba(255,69,58,0.3)]'
    default:
      return 'bg-white/[0.04] text-white/60'
  }
}

/** CSS color for calendar cell background (inline style). Use in getCalendarBackground and day customizations. */
export function getScoreBackgroundColor(score: DayStatus): string | null {
  const category = getScoreCategory(score)
  switch (category) {
    case 'high':
      return 'rgba(48, 209, 88, 0.8)'
    case 'ok':
      return 'rgba(255, 149, 0, 0.8)'
    case 'low':
      return 'rgba(255, 69, 58, 0.8)'
    default:
      return null
  }
}

export function getScoreLabel(score: number): string {
  if (score >= 7) return 'High'
  if (score >= 4) return 'OK'
  return 'Low'
}
