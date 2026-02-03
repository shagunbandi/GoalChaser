/**
 * Period Tracking Plugin Types
 */

import type { PluginDayData, PluginConfigData } from '@goal-chaser/sdk'

/**
 * Day-level data for period tracking
 */
export interface PeriodDayData extends PluginDayData {
  /** Whether this is a period day */
  isPeriod: boolean
  /** Optional notes for the day */
  notes?: string
}

/**
 * Configuration for the period plugin
 * Currently empty, but can be extended for preferences like expected cycle length
 */
export interface PeriodConfig extends PluginConfigData {
  // Future: expectedCycleLength?: number
  // Future: expectedPeriodDuration?: number
}

/**
 * Cycle statistics calculated from period data
 */
export interface CycleStats {
  /** Average cycle length in days */
  averageCycleLength: number
  /** Minimum cycle length in days */
  minCycleLength: number
  /** Maximum cycle length in days */
  maxCycleLength: number
  /** Number of complete cycles tracked */
  cycleCount: number
}

/**
 * Period duration statistics
 */
export interface PeriodDurationStats {
  /** Average period duration in days */
  averageDuration: number
  /** Minimum period duration in days */
  minDuration: number
  /** Maximum period duration in days */
  maxDuration: number
  /** Number of periods tracked */
  periodCount: number
}
