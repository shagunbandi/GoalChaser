import type { SIPFrequency } from '../types'

/**
 * Generate SIP investment dates based on frequency
 */
export function generateSIPDates(
  startDate: string,
  endDate: string,
  frequency: SIPFrequency,
): string[] {
  const dates: string[] = []
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)

  let current = new Date(start)

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])

    // Increment based on frequency
    if (frequency === 'daily') {
      current.setDate(current.getDate() + 1)
    } else if (frequency === 'weekly') {
      current.setDate(current.getDate() + 7)
    } else if (frequency === 'monthly') {
      // Keep same day of month when moving to next month
      const targetDay = start.getDate()
      current.setMonth(current.getMonth() + 1)
      
      // Handle month-end edge cases
      const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()
      if (targetDay > daysInMonth) {
        current.setDate(daysInMonth)
      } else {
        current.setDate(targetDay)
      }
    }
  }

  return dates
}
