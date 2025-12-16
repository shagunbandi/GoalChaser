import type { DayStatus, SuccessCriterion } from '@/types'

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
 * Get Apple-style glass color classes based on score (for productivity criterion)
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

// ============ Hours-based VIBGYOR colors ============

// VIBGYOR spectrum colors (Violet → Red, mapped to hours progression)
const VIBGYOR_COLORS = [
  { color: '#8B5CF6', shadow: 'rgba(139,92,246,0.3)' },   // Violet - 0-1 hours
  { color: '#6366F1', shadow: 'rgba(99,102,241,0.3)' },   // Indigo - 1-2 hours
  { color: '#3B82F6', shadow: 'rgba(59,130,246,0.3)' },   // Blue - 2-3 hours
  { color: '#22D3EE', shadow: 'rgba(34,211,238,0.3)' },   // Cyan - 3-4 hours
  { color: '#10B981', shadow: 'rgba(16,185,129,0.3)' },   // Green - 4-5 hours
  { color: '#84CC16', shadow: 'rgba(132,204,22,0.3)' },   // Lime - 5-6 hours
  { color: '#EAB308', shadow: 'rgba(234,179,8,0.3)' },    // Yellow - 6-7 hours
  { color: '#F97316', shadow: 'rgba(249,115,22,0.3)' },   // Orange - 7-8 hours
  { color: '#EF4444', shadow: 'rgba(239,68,68,0.3)' },    // Red - 8+ hours
]

/**
 * Get VIBGYOR color index based on hours and max hours
 */
function getHoursColorIndex(hours: number, maxHours: number): number {
  if (hours <= 0) return -1 // No color for 0 hours
  const ratio = hours / maxHours
  const index = Math.min(Math.floor(ratio * VIBGYOR_COLORS.length), VIBGYOR_COLORS.length - 1)
  return index
}

/**
 * Get VIBGYOR color classes for hours-based tracking
 */
export function getHoursColorClass(hours: number | null, maxHours: number): string {
  if (hours === null || hours <= 0) {
    return 'bg-white/[0.04] text-white/60 border border-white/[0.08]'
  }
  
  const index = getHoursColorIndex(hours, maxHours)
  const colorData = VIBGYOR_COLORS[index]
  
  return `bg-[${colorData.color}]/80 text-white shadow-[0_0_15px_${colorData.shadow}]`
}

/**
 * Get inline style for hours-based coloring (needed for dynamic colors)
 */
export function getHoursColorStyle(hours: number | null, maxHours: number): React.CSSProperties {
  if (hours === null || hours <= 0) {
    return {}
  }
  
  const index = getHoursColorIndex(hours, maxHours)
  const colorData = VIBGYOR_COLORS[index]
  
  return {
    backgroundColor: `${colorData.color}CC`, // CC = 80% opacity
    color: 'white',
    boxShadow: `0 0 15px ${colorData.shadow}`,
  }
}

/**
 * Get hours label text
 */
export function getHoursLabel(hours: number, maxHours: number): string {
  const ratio = hours / maxHours
  if (ratio >= 0.8) return 'Excellent'
  if (ratio >= 0.5) return 'Good'
  if (ratio >= 0.25) return 'Fair'
  return 'Low'
}

/**
 * Get color class based on criterion type
 */
export function getStatusColorClass(
  criterion: SuccessCriterion | undefined,
  productivityScore: DayStatus,
  totalHours: number | null
): string {
  // Default to productivity if no criterion specified
  if (!criterion || criterion.type === 'productivity') {
    return getScoreColorClass(productivityScore)
  }
  
  // Hours-based criterion
  if (criterion.type === 'hours') {
    return getHoursColorClass(totalHours, criterion.maxHours)
  }
  
  return 'bg-white/[0.04] text-white/60 border border-white/[0.08]'
}

/**
 * Get color style based on criterion type (for dynamic VIBGYOR colors)
 */
export function getStatusColorStyle(
  criterion: SuccessCriterion | undefined,
  productivityScore: DayStatus,
  totalHours: number | null
): React.CSSProperties {
  // Default to productivity if no criterion specified (use class-based styling)
  if (!criterion || criterion.type === 'productivity') {
    return {}
  }
  
  // Hours-based criterion needs inline styles for VIBGYOR
  if (criterion.type === 'hours') {
    return getHoursColorStyle(totalHours, criterion.maxHours)
  }
  
  return {}
}

/**
 * Get VIBGYOR colors array for displaying in selector
 */
export function getVibgyorColors() {
  return VIBGYOR_COLORS
}
