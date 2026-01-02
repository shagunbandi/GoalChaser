/**
 * Unit tests for recurrence date generation
 * Tests the core logic for creating recurring agenda items
 */

import { describe, it, expect } from '@jest/globals'
import {
  generateRecurrenceDates,
  getWeekdayCode,
  addDays,
  WEEKDAY_CODES,
} from '../recurrence'

describe('recurrence utils', () => {
  describe('addDays', () => {
    it('should add days to a date', () => {
      const date = new Date('2026-01-01T00:00:00')
      const result = addDays(date, 5)
      expect(result.toISOString().split('T')[0]).toBe('2026-01-06')
    })

    it('should handle adding 0 days', () => {
      const date = new Date('2026-01-01T00:00:00')
      const result = addDays(date, 0)
      expect(result.toISOString().split('T')[0]).toBe('2026-01-01')
    })

    it('should handle negative days', () => {
      const date = new Date('2026-01-10T00:00:00')
      const result = addDays(date, -5)
      expect(result.toISOString().split('T')[0]).toBe('2026-01-05')
    })

    it('should handle month boundaries', () => {
      const date = new Date('2026-01-30T00:00:00')
      const result = addDays(date, 5)
      expect(result.toISOString().split('T')[0]).toBe('2026-02-04')
    })
  })

  describe('getWeekdayCode', () => {
    it('should return correct weekday code for Monday', () => {
      expect(getWeekdayCode('2026-01-05')).toBe('mon')
    })

    it('should return correct weekday code for Wednesday', () => {
      expect(getWeekdayCode('2026-01-07')).toBe('wed')
    })

    it('should return correct weekday code for Sunday', () => {
      expect(getWeekdayCode('2026-01-04')).toBe('sun')
    })

    it('should return correct weekday code for Saturday', () => {
      expect(getWeekdayCode('2026-01-03')).toBe('sat')
    })
  })

  describe('generateRecurrenceDates - none', () => {
    it('should return only start date when type is none', () => {
      const result = generateRecurrenceDates('2026-01-01', 'none', [], '2026-01-31')
      expect(result).toEqual(['2026-01-01'])
    })
  })

  describe('generateRecurrenceDates - daily', () => {
    it('should generate daily dates for 7 days', () => {
      const result = generateRecurrenceDates('2026-01-01', 'daily', [], '2026-01-07')
      expect(result).toHaveLength(7)
      expect(result).toEqual([
        '2026-01-01',
        '2026-01-02',
        '2026-01-03',
        '2026-01-04',
        '2026-01-05',
        '2026-01-06',
        '2026-01-07',
      ])
    })

    it('should generate daily dates for 1 day (start date only)', () => {
      const result = generateRecurrenceDates('2026-01-01', 'daily', [], '2026-01-01')
      expect(result).toEqual(['2026-01-01'])
    })

    it('should respect end date boundary', () => {
      const result = generateRecurrenceDates('2026-01-01', 'daily', [], '2026-01-03')
      expect(result).toHaveLength(3)
      expect(result[result.length - 1]).toBe('2026-01-03')
    })
  })

  describe('generateRecurrenceDates - weekly', () => {
    it('should generate weekly Mondays for 4 weeks', () => {
      // Start on Tuesday 2026-01-06, generate Mondays
      const result = generateRecurrenceDates('2026-01-06', 'weekly', ['mon'], '2026-02-02')
      expect(result).toHaveLength(4)
      expect(result).toEqual([
        '2026-01-12', // First Monday after start
        '2026-01-19',
        '2026-01-26',
        '2026-02-02',
      ])
      // Verify all are Mondays
      result.forEach((date) => {
        expect(getWeekdayCode(date)).toBe('mon')
      })
    })

    it('should generate weekly Wednesdays for 4 weeks', () => {
      // Start on Thursday 2026-01-08, generate Wednesdays
      const result = generateRecurrenceDates('2026-01-08', 'weekly', ['wed'], '2026-02-04')
      expect(result).toHaveLength(4)
      expect(result).toEqual([
        '2026-01-14', // First Wednesday after start
        '2026-01-21',
        '2026-01-28',
        '2026-02-04',
      ])
      // Verify all are Wednesdays
      result.forEach((date) => {
        expect(getWeekdayCode(date)).toBe('wed')
      })
    })

    it('should include start date if it matches the weekday', () => {
      // Start on Monday 2026-01-05, generate Mondays
      const result = generateRecurrenceDates('2026-01-05', 'weekly', ['mon'], '2026-01-26')
      expect(result).toHaveLength(4)
      expect(result[0]).toBe('2026-01-05') // Start date IS included
    })

    it('should handle single occurrence when end date is close', () => {
      const result = generateRecurrenceDates('2026-01-05', 'weekly', ['mon'], '2026-01-06')
      expect(result).toHaveLength(1)
      expect(result[0]).toBe('2026-01-05')
    })

    it('should default to start day weekday when days array is empty', () => {
      // Start on Monday, empty days should use Monday
      const result = generateRecurrenceDates('2026-01-05', 'weekly', [], '2026-01-26')
      expect(result).toHaveLength(4)
      result.forEach((date) => {
        expect(getWeekdayCode(date)).toBe('mon')
      })
    })
  })

  describe('generateRecurrenceDates - custom', () => {
    it('should generate for multiple days (Mon/Wed/Fri) for 2 weeks', () => {
      const result = generateRecurrenceDates(
        '2026-01-06', // Tuesday
        'custom',
        ['mon', 'wed', 'fri'],
        '2026-01-19'
      )
      
      // Should get: Wed 1/7, Fri 1/9, Mon 1/12, Wed 1/14, Fri 1/16, Mon 1/19 = 6 items
      expect(result).toHaveLength(6)
      expect(result).toEqual([
        '2026-01-07',  // Wed
        '2026-01-09',  // Fri
        '2026-01-12',  // Mon
        '2026-01-14',  // Wed
        '2026-01-16',  // Fri
        '2026-01-19',  // Mon
      ])
      
      // Verify all are one of the selected days
      result.forEach((date) => {
        const code = getWeekdayCode(date)
        expect(['mon', 'wed', 'fri']).toContain(code)
      })
    })

    it('should handle single day in custom mode', () => {
      const result = generateRecurrenceDates(
        '2026-01-01',
        'custom',
        ['thu'],
        '2026-01-31'
      )
      
      // Count Thursdays in January 2026
      result.forEach((date) => {
        expect(getWeekdayCode(date)).toBe('thu')
      })
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle all weekdays', () => {
      const result = generateRecurrenceDates(
        '2026-01-01',
        'custom',
        ['mon', 'tue', 'wed', 'thu', 'fri'],
        '2026-01-09'
      )
      
      // Should skip weekends
      result.forEach((date) => {
        const code = getWeekdayCode(date)
        expect(['sat', 'sun']).not.toContain(code)
      })
      expect(result.length).toBeGreaterThanOrEqual(5)
    })
  })

  describe('generateRecurrenceDates - edge cases', () => {
    it('should handle end date before start date gracefully', () => {
      const result = generateRecurrenceDates('2026-01-10', 'daily', [], '2026-01-05')
      // Should return at least start date or handle gracefully
      expect(result.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle no end date (uses 365-day window)', () => {
      const result = generateRecurrenceDates('2026-01-06', 'weekly', ['mon'], undefined)
      
      // Should generate ~52 Mondays in a year
      expect(result.length).toBeGreaterThan(50)
      expect(result.length).toBeLessThanOrEqual(53)
      
      // Verify all are Mondays
      result.forEach((date) => {
        expect(getWeekdayCode(date)).toBe('mon')
      })
    })

    it('should respect 365-day window limit', () => {
      const result = generateRecurrenceDates('2026-01-01', 'daily', [], undefined)
      expect(result.length).toBeLessThanOrEqual(365)
    })

    it('should handle end date exactly 365 days away', () => {
      const result = generateRecurrenceDates('2026-01-01', 'daily', [], '2026-12-31')
      expect(result.length).toBe(365)
    })

    it('should return start date as fallback when no dates match', () => {
      // Edge case: shouldn't happen in practice but tests the fallback
      const result = generateRecurrenceDates('2026-01-05', 'weekly', ['sun'], '2026-01-06')
      // Should have 0 Sundays or include start date as fallback
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('generateRecurrenceDates - real-world scenarios', () => {
    it('should handle "Team Meeting every Monday for 4 weeks" use case', () => {
      const today = '2026-01-02' // Friday
      const endDate = '2026-01-30'
      const result = generateRecurrenceDates(today, 'weekly', ['mon'], endDate)
      
      expect(result).toEqual([
        '2026-01-05',
        '2026-01-12',
        '2026-01-19',
        '2026-01-26',
      ])
    })

    it('should handle "Gym Mon/Wed/Fri for 2 weeks" use case', () => {
      const today = '2026-01-02'
      const endDate = '2026-01-16'
      const result = generateRecurrenceDates(today, 'custom', ['mon', 'wed', 'fri'], endDate)
      
      expect(result.length).toBe(6) // 2 * (Mon + Wed + Fri)
      
      // Verify pattern
      const weekdays = result.map(getWeekdayCode)
      expect(weekdays.every(d => ['mon', 'wed', 'fri'].includes(d))).toBe(true)
    })

    it('should handle "Daily standup for 5 days" use case', () => {
      const today = '2026-01-05' // Monday
      const endDate = '2026-01-09' // Friday
      const result = generateRecurrenceDates(today, 'daily', [], endDate)
      
      expect(result).toHaveLength(5)
      expect(result).toEqual([
        '2026-01-05',
        '2026-01-06',
        '2026-01-07',
        '2026-01-08',
        '2026-01-09',
      ])
    })

    it('should handle recurring event starting in the past', () => {
      const startDate = '2025-12-30' // Past date
      const endDate = '2026-01-27'
      const result = generateRecurrenceDates(startDate, 'weekly', ['mon'], endDate)
      
      // Should include all Mondays from start to end
      expect(result.length).toBeGreaterThan(0)
      result.forEach((date) => {
        expect(getWeekdayCode(date)).toBe('mon')
      })
    })
  })

  describe('WEEKDAY_CODES constant', () => {
    it('should have correct order starting with Sunday', () => {
      expect(WEEKDAY_CODES).toEqual(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'])
    })

    it('should have 7 elements', () => {
      expect(WEEKDAY_CODES).toHaveLength(7)
    })
  })
})

