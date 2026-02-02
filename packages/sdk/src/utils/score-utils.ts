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
  const index = Math.min(
    Math.floor(ratio * VIBGYOR_COLORS.length),
    VIBGYOR_COLORS.length - 1
  )
  return index
}

export function getHoursColorClass(
  hours: number | null,
  maxHours: number
): string {
  if (hours === null || hours <= 0) {
    return 'bg-white/[0.04] text-white/60 border border-white/[0.08]'
  }
  const index = getHoursColorIndex(hours, maxHours)
  const colorData = VIBGYOR_COLORS[index]
  return `bg-[${colorData.color}]/80 text-white shadow-[0_0_15px_${colorData.shadow}]`
}

export function getHoursLabel(hours: number, maxHours: number): string {
  const ratio = hours / maxHours
  if (ratio >= 0.8) return 'Excellent'
  if (ratio >= 0.5) return 'Good'
  if (ratio >= 0.25) return 'Fair'
  return 'Low'
}

export function getVibgyorColors() {
  return VIBGYOR_COLORS
}
