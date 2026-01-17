import type { DayStatus } from '@/types'

export type ScoreCategory = 'low' | 'ok' | 'high' | null

export function getScoreCategory(score: DayStatus): ScoreCategory {
  if (score === null) return null
  if (score >= 7) return 'high'
  if (score >= 4) return 'ok'
  return 'low'
}

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

export function getScoreColorHex(score: DayStatus): string | null {
  const category = getScoreCategory(score)
  switch (category) {
    case 'high':
      return '#30D158'
    case 'ok':
      return '#FF9500'
    case 'low':
      return '#FF453A'
    default:
      return null
  }
}

export function getScoreLabel(score: number): string {
  if (score >= 7) return 'High'
  if (score >= 4) return 'OK'
  return 'Low'
}

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

const VIBGYOR_COLORS = [
  { color: '#8B5CF6', shadow: 'rgba(139,92,246,0.3)' },
  { color: '#6366F1', shadow: 'rgba(99,102,241,0.3)' },
  { color: '#3B82F6', shadow: 'rgba(59,130,246,0.3)' },
  { color: '#22D3EE', shadow: 'rgba(34,211,238,0.3)' },
  { color: '#10B981', shadow: 'rgba(16,185,129,0.3)' },
  { color: '#84CC16', shadow: 'rgba(132,204,22,0.3)' },
  { color: '#EAB308', shadow: 'rgba(234,179,8,0.3)' },
  { color: '#F97316', shadow: 'rgba(249,115,22,0.3)' },
  { color: '#EF4444', shadow: 'rgba(239,68,68,0.3)' },
]

function getHoursColorIndex(hours: number, maxHours: number): number {
  if (hours <= 0) return -1
  const ratio = hours / maxHours
  const index = Math.min(Math.floor(ratio * VIBGYOR_COLORS.length), VIBGYOR_COLORS.length - 1)
  return index
}

export function getHoursColorClass(hours: number | null, maxHours: number): string {
  if (hours === null || hours <= 0) {
    return 'bg-white/[0.04] text-white/60 border border-white/[0.08]'
  }
  
  const index = getHoursColorIndex(hours, maxHours)
  const colorData = VIBGYOR_COLORS[index]
  
  return `bg-[${colorData.color}]/80 text-white shadow-[0_0_15px_${colorData.shadow}]`
}

export function getHoursColorStyle(hours: number | null, maxHours: number): React.CSSProperties {
  if (hours === null || hours <= 0) {
    return {}
  }
  
  const index = getHoursColorIndex(hours, maxHours)
  const colorData = VIBGYOR_COLORS[index]
  
  return {
    backgroundColor: `${colorData.color}CC`,
    color: 'white',
    boxShadow: `0 0 15px ${colorData.shadow}`,
  }
}

export function getHoursLabel(hours: number, maxHours: number): string {
  const ratio = hours / maxHours
  if (ratio >= 0.8) return 'Excellent'
  if (ratio >= 0.5) return 'Good'
  if (ratio >= 0.25) return 'Fair'
  return 'Low'
}

export function getStatusColorClass(
  criterion: any | undefined,
  productivityScore: DayStatus,
  totalHours: number | null
): string {
  if (!criterion || criterion.type === 'productivity') {
    return getScoreColorClass(productivityScore)
  }
  
  if (criterion.type === 'hours') {
    return getHoursColorClass(totalHours, criterion.maxHours)
  }
  
  return 'bg-white/[0.04] text-white/60 border border-white/[0.08]'
}

export function getStatusColorStyle(
  criterion: any | undefined,
  productivityScore: DayStatus,
  totalHours: number | null
): React.CSSProperties {
  if (!criterion || criterion.type === 'productivity') {
    return {}
  }
  
  if (criterion.type === 'hours') {
    return getHoursColorStyle(totalHours, criterion.maxHours)
  }
  
  return {}
}

export function getVibgyorColors() {
  return VIBGYOR_COLORS
}

