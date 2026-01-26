import React from 'react'
import type { ExecutiveGoalPlan, ExecutiveGoalDayData } from './types'
import type { DayCustomization } from '@/sdk'

/**
 * Calculate the completion percentage background color
 * Red (0%) → Yellow (50%) → Green (100%)
 */
export function getCompletionBackgroundColor(
  completionPercent: number
): string {
  if (completionPercent === 0) {
    // Pure red - no progress
    return 'rgba(239, 68, 68, 0.5)' // red-500
  } else if (completionPercent < 50) {
    // Red to Yellow transition (0-50%)
    const intensity = completionPercent / 50
    // From red (239, 68, 68) to yellow (234, 179, 8)
    const r = 239 - intensity * 5
    const g = 68 + intensity * 111
    const b = 68 - intensity * 60
    return `rgba(${r}, ${g}, ${b}, ${0.5 + intensity * 0.1})`
  } else if (completionPercent < 100) {
    // Yellow to Green transition (50-100%)
    const intensity = (completionPercent - 50) / 50
    // From yellow (234, 179, 8) to green (34, 197, 94)
    const r = 234 - intensity * 200
    const g = 179 + intensity * 18
    const b = 8 + intensity * 86
    return `rgba(${r}, ${g}, ${b}, ${0.6 + intensity * 0.1})`
  } else {
    // 100% - pure green
    return 'rgba(34, 197, 94, 0.7)' // green-500
  }
}

/**
 * Create a gradient border style for multiple goals
 */
export function createMultiGoalBorderStyle(goalColors: string[]): React.CSSProperties {
  if (goalColors.length === 0) return {}
  if (goalColors.length === 1) {
    return {
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: goalColors[0],
    }
  }
  
  // Multiple goals: create gradient border
  const percentPerGoal = 100 / goalColors.length
  const gradientStops = goalColors
    .map((color, index) => {
      const start = index * percentPerGoal
      const end = (index + 1) * percentPerGoal
      return `${color} ${start}%, ${color} ${end}%`
    })
    .join(', ')
  
  return {
    borderWidth: '2px',
    borderStyle: 'solid',
    borderImage: `linear-gradient(to bottom, ${gradientStops}) 1`,
  }
}

/**
 * Get day customization for executive goal plugin calendar cells
 */
export function getExecutiveGoalDayCustomization(
  date: string,
  data: ExecutiveGoalDayData | null,
  isMonthView: boolean = true,
): DayCustomization | null {
  const plans: ExecutiveGoalPlan[] = data?.executiveGoalPlans || []
  
  if (!Array.isArray(plans) || plans.length === 0) {
    return null
  }

  // Find active goals (not tasks) for this date
  const activeGoals = plans.filter(
    plan =>
      !plan.parentExecutiveGoalId &&
      date >= plan.startDate &&
      date <= plan.endDate
  )

  // Find all tasks (with parent goals) for this date
  const allTasks = plans.filter(
    plan =>
      plan.parentExecutiveGoalId &&
      date >= plan.startDate &&
      date <= plan.endDate
  )

  if (activeGoals.length === 0) {
    return null
  }

  // Calculate aggregate task completion
  const completedTasks = allTasks.filter(task => task.completed === true).length
  const totalTasks = allTasks.length
  const completionPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  // Get goal colors for border
  const goalColors = activeGoals.map(goal => goal.color || '#8B5CF6')

  // Base customization
  const customization: DayCustomization = {
    backgroundColor: totalTasks > 0 ? getCompletionBackgroundColor(completionPercent) : undefined,
    style: createMultiGoalBorderStyle(goalColors),
  }

  // Add task dots for desktop monthly view
  if (isMonthView && totalTasks > 0) {
    const maxDotsToShow = 5
    const dots: Array<{ filled: boolean }> = []
    
    // Show up to maxDotsToShow dots
    const dotsToRender = Math.min(totalTasks, maxDotsToShow)
    
    for (let i = 0; i < dotsToRender; i++) {
      dots.push({ filled: i < completedTasks })
    }

    // Create content node with dots using React.createElement
    const dotsContent = React.createElement(
      'div',
      { className: 'mt-auto w-full flex items-center justify-center gap-1 text-[10px]' },
      ...dots.map((dot, index) =>
        React.createElement('div', {
          key: index,
          className: `w-1.5 h-1.5 rounded-full border ${
            dot.filled
              ? 'bg-[#22C55E] border-[#22C55E]'
              : 'bg-transparent border-[#6B7280]'
          }`,
          style: { borderWidth: '1px' },
        })
      ),
      totalTasks > maxDotsToShow &&
        React.createElement(
          'span',
          { className: 'text-white/60 ml-0.5' },
          `+${totalTasks - maxDotsToShow}`
        )
    )

    customization.content = dotsContent
  }

  return customization
}

/**
 * Aggregate day customizations for all dates in a range
 */
export function getExecutiveGoalDayCustomizations(
  dateRange: string[],
  pluginData: Record<string, ExecutiveGoalDayData>,
  isMonthView: boolean = true,
): Record<string, DayCustomization> {
  const customizations: Record<string, DayCustomization> = {}

  for (const date of dateRange) {
    const data = pluginData[date] || null
    const customization = getExecutiveGoalDayCustomization(date, data, isMonthView)
    
    if (customization) {
      customizations[date] = customization
    }
  }

  return customizations
}
