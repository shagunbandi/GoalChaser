import React from 'react'
import type { ExecutiveGoalDayData, ExecutiveGoalTask } from './types'
import type { DayCustomization } from '@goal-chaser/sdk'

/**
 * Calculate the completion percentage background color
 * Red (0%) → Yellow (50%) → Green (100%)
 */
export function getCompletionBackgroundColor(
  completionPercent: number
): string {
  if (completionPercent === 0) {
    return 'rgba(239, 68, 68, 0.5)'
  } else if (completionPercent < 50) {
    const intensity = completionPercent / 50
    const r = 239 - intensity * 5
    const g = 68 + intensity * 111
    const b = 68 - intensity * 60
    return `rgba(${r}, ${g}, ${b}, ${0.5 + intensity * 0.1})`
  } else if (completionPercent < 100) {
    const intensity = (completionPercent - 50) / 50
    const r = 234 - intensity * 200
    const g = 179 + intensity * 18
    const b = 8 + intensity * 86
    return `rgba(${r}, ${g}, ${b}, ${0.6 + intensity * 0.1})`
  } else {
    return 'rgba(34, 197, 94, 0.7)'
  }
}

export function createMultiGoalBorderStyle(goalColors: string[]): React.CSSProperties {
  if (goalColors.length === 0) return {}
  if (goalColors.length === 1) {
    return {
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: goalColors[0],
    }
  }
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
 * Day customization based on day-level tasks (completion %, colors).
 */
export function getExecutiveGoalDayCustomization(
  date: string,
  data: ExecutiveGoalDayData | null,
  isMonthView: boolean = true,
): DayCustomization | null {
  const tasks: ExecutiveGoalTask[] = data?.tasks || []
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return null
  }

  const completedTasks = tasks.filter((t) => t.completed === true).length
  const totalTasks = tasks.length
  const completionPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  const goalColors = [...new Set(tasks.map((t) => t.color || '#8B5CF6'))]

  const customization: DayCustomization = {
    backgroundColor: getCompletionBackgroundColor(completionPercent),
    style: createMultiGoalBorderStyle(goalColors),
  }

  if (isMonthView && totalTasks > 0) {
    const maxDotsToShow = 5
    const dots: Array<{ filled: boolean }> = []
    const dotsToRender = Math.min(totalTasks, maxDotsToShow)
    for (let i = 0; i < dotsToRender; i++) {
      dots.push({ filled: i < completedTasks })
    }
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
