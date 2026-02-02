/**
 * SDK Utilities
 * Common utility functions for plugin development
 */

export * from './firestore-helpers'
export {
  formatDateDisplay,
  formatShortDate,
  toISODateString,
  computeMonthInfo,
  getPreviousMonth,
  getNextMonth,
  enumerateDateRange,
  isWeekend,
} from './date-utils'
export {
  getVibgyorColors,
  getHoursColorClass,
  getHoursLabel,
} from './score-utils'
