/**
 * Executive Goal Insights Utilities
 * 
 * Helper functions for calculating executive goal insights
 */

import type { ExecutiveGoalDayData, ExecutiveGoalPlan } from './types'
import type { BreakdownItem } from '@/sdk'

// ============================================================================
// Plan Calculation Functions
// ============================================================================

/**
 * Get all unique plans from data (excluding tasks)
 */
export function getAllPlans(allData: Record<string, ExecutiveGoalDayData>): ExecutiveGoalPlan[] {
  const planMap = new Map<string, ExecutiveGoalPlan>()
  
  Object.values(allData).forEach(dayData => {
    if (dayData?.executiveGoalPlans) {
      dayData.executiveGoalPlans.forEach(plan => {
        // Skip tasks (they have a parentExecutiveGoalId)
        if (plan.parentExecutiveGoalId) {
          return
        }
        
        // Use a combination of title and startDate as unique key
        const key = `${plan.title}-${plan.startDate}`
        if (!planMap.has(key)) {
          planMap.set(key, plan)
        }
      })
    }
  })
  
  return Array.from(planMap.values())
}

/**
 * Count total unique plans
 */
export function countTotalPlans(allData: Record<string, ExecutiveGoalDayData>): number {
  return getAllPlans(allData).length
}

/**
 * Count unique goal categories (based on first word of title)
 */
export function countUniquePlaces(allData: Record<string, ExecutiveGoalDayData>): number {
  const categorySet = new Set<string>()
  
  Object.values(allData).forEach(dayData => {
    if (dayData?.executiveGoalPlans) {
      dayData.executiveGoalPlans.forEach(plan => {
        // Extract first word as category (e.g., "Q1" from "Q1 Planning")
        const category = plan.title.split(' ')[0]
        if (category) {
          categorySet.add(category.toLowerCase())
        }
      })
    }
  })
  
  return categorySet.size
}

/**
 * Calculate total days on executive goals
 */
export function calculateTotalDaysOnGoals(allData: Record<string, ExecutiveGoalDayData>): number {
  const plans = getAllPlans(allData)
  
  return plans.reduce((total, plan) => {
    const start = new Date(plan.startDate)
    const end = new Date(plan.endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return total + days
  }, 0)
}

/**
 * Get top 3 goals by duration (excluding tasks, deduplicated by plan ID)
 */
export function getTopVisitedDestinations(
  allData: Record<string, ExecutiveGoalDayData>
): Array<{ name: string; visits: number; days: number; rank: number }> {
  const goalsMap = new Map<string, { visits: number; days: number }>()
  
  // Collect unique plans and calculate their durations
  const processedPlans = new Set<string>()
  Object.values(allData).forEach(dayData => {
    if (dayData?.executiveGoalPlans) {
      dayData.executiveGoalPlans.forEach(plan => {
        // Skip tasks and already processed plans
        if (plan.parentExecutiveGoalId || processedPlans.has(plan.id)) {
          return
        }
        
        processedPlans.add(plan.id)
        
        // Calculate plan duration in days
        const start = new Date(plan.startDate)
        const end = new Date(plan.endDate)
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
        
        goalsMap.set(plan.id, {
          visits: 1,
          days: days,
        })
      })
    }
  })
  
  if (goalsMap.size === 0) return []
  
  // Convert to array with goal titles from the plans
  const allPlans = getAllPlans(allData)
  const sorted = Array.from(goalsMap.entries())
    .map(([id, stat]) => {
      const plan = allPlans.find(p => p.id === id)
      return {
        name: plan?.title || 'Unknown Goal',
        visits: stat.visits,
        days: stat.days,
      }
    })
    .sort((a, b) => b.days - a.days) // Sort by days (descending)
  
  // Return top 3 with rank
  return sorted.slice(0, 3).map((goal, index) => ({
    ...goal,
    rank: index + 1,
  }))
}

/**
 * Get longest goal (legacy - kept for compatibility)
 */
export function getMostVisitedDestination(
  allData: Record<string, ExecutiveGoalDayData>
): { name: string; visits: number; days: number } | null {
  const top = getTopVisitedDestinations(allData)
  return top.length > 0 ? top[0] : null
}

// ============================================================================
// Period Analysis Functions
// ============================================================================

/**
 * Count plans in a specific period
 */
export function countPlansInPeriod(data: Record<string, ExecutiveGoalDayData>): number {
  return getAllPlans(data).length
}

/**
 * Calculate days on goals in period
 */
export function calculateDaysOnGoalsInPeriod(data: Record<string, ExecutiveGoalDayData>): number {
  const dateSet = new Set<string>()
  
  Object.keys(data).forEach(date => {
    if (data[date]?.executiveGoalPlans && data[date].executiveGoalPlans!.length > 0) {
      dateSet.add(date)
    }
  })
  
  return dateSet.size
}

/**
 * Calculate average plan duration
 */
export function calculateAveragePlanDuration(data: Record<string, ExecutiveGoalDayData>): number {
  const plans = getAllPlans(data)
  
  if (plans.length === 0) return 0
  
  const totalDays = plans.reduce((total, plan) => {
    const start = new Date(plan.startDate)
    const end = new Date(plan.endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return total + days
  }, 0)
  
  return Math.round(totalDays / plans.length)
}

/**
 * Build goal breakdown including tasks (deduplicated by plan ID)
 */
export function buildDestinationBreakdown(
  data: Record<string, ExecutiveGoalDayData>
): BreakdownItem[] {
  // Build a map of all plans (both parent and tasks)
  const planMap = new Map<string, ExecutiveGoalPlan>()
  
  Object.values(data).forEach(dayData => {
    if (dayData?.executiveGoalPlans) {
      dayData.executiveGoalPlans.forEach(plan => {
        if (!planMap.has(plan.id)) {
          planMap.set(plan.id, plan)
        }
      })
    }
  })
  
  if (planMap.size === 0) return []
  
  // Build parent-child relationships
  const parentMap = new Map<string, ExecutiveGoalPlan[]>() // parentId -> children
  const parentPlans: ExecutiveGoalPlan[] = []
  
  planMap.forEach(plan => {
    if (!plan.parentExecutiveGoalId) {
      parentPlans.push(plan)
    } else {
      if (!parentMap.has(plan.parentExecutiveGoalId)) {
        parentMap.set(plan.parentExecutiveGoalId, [])
      }
      parentMap.get(plan.parentExecutiveGoalId)!.push(plan)
    }
  })
  
  // Helper to calculate plan days
  const getPlanDays = (plan: ExecutiveGoalPlan): number => {
    const start = new Date(plan.startDate)
    const end = new Date(plan.endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }
  
  // Sort parent plans by days (longest first)
  const sortedPlans = parentPlans.sort((a, b) => getPlanDays(b) - getPlanDays(a))
  
  // Calculate max days for percentage
  const maxDays = sortedPlans.length > 0 ? getPlanDays(sortedPlans[0]) : 0
  
  // Build items with tasks
  const items: BreakdownItem[] = []
  
  sortedPlans.forEach(plan => {
    const days = getPlanDays(plan)
    const subPlans = parentMap.get(plan.id) || []
    
    // Add parent goal item
    items.push({
      label: plan.title,
      value: `${days} day${days !== 1 ? 's' : ''}`,
      count: days,
      details: plan.description || '',
      percentage: maxDays > 0 ? (days / maxDays) * 100 : 0,
      color: '#8B5CF6',
    })
    
    // Add tasks
    subPlans.forEach(subPlan => {
      const subDays = getPlanDays(subPlan)
      
      items.push({
        label: subPlan.title,
        value: `${subDays} day${subDays !== 1 ? 's' : ''}`,
        count: subDays,
        details: subPlan.description || '',
        percentage: maxDays > 0 ? (subDays / maxDays) * 100 : 0,
        color: '#A78BFA', // Lighter purple for tasks
        isSubItem: true, // Mark as sub-item for indentation
      })
    })
  })
  
  return items
}

/**
 * Calculate plans per month average
 */
export function calculatePlansPerMonth(allData: Record<string, ExecutiveGoalDayData>): number {
  const plans = getAllPlans(allData)
  
  if (plans.length === 0) return 0
  
  // Get unique months with plans
  const monthSet = new Set<string>()
  
  plans.forEach(plan => {
    const date = new Date(plan.startDate)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthSet.add(monthKey)
  })
  
  return monthSet.size > 0 ? plans.length / monthSet.size : 0
}

/**
 * Count plans with attachments
 */
export function countPlansWithAttachments(allData: Record<string, ExecutiveGoalDayData>): number {
  const plans = getAllPlans(allData)
  
  return plans.filter(plan => plan.files && plan.files.length > 0).length
}
