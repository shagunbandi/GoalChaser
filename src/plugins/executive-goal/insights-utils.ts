/**
 * Executive Goal Insights Utilities
 * Task-based metrics (goals live at goal-level and are not in day data).
 */

import type { ExecutiveGoalDayData, ExecutiveGoalTask } from './types'
import type { BreakdownItem } from '@/sdk'

function getAllTasks(allData: Record<string, ExecutiveGoalDayData>): ExecutiveGoalTask[] {
  const taskMap = new Map<string, ExecutiveGoalTask>()
  Object.values(allData).forEach((dayData) => {
    dayData?.tasks?.forEach((task) => {
      if (!taskMap.has(task.id)) taskMap.set(task.id, task)
    })
  })
  return Array.from(taskMap.values())
}

export function countTotalPlans(allData: Record<string, ExecutiveGoalDayData>): number {
  return getAllTasks(allData).length
}

export function countUniquePlaces(allData: Record<string, ExecutiveGoalDayData>): number {
  const parentIds = new Set<string>()
  Object.values(allData).forEach((dayData) => {
    dayData?.tasks?.forEach((t) => {
      if (t.parentExecutiveGoalId) parentIds.add(t.parentExecutiveGoalId)
    })
  })
  return parentIds.size
}

export function calculateTotalDaysOnGoals(allData: Record<string, ExecutiveGoalDayData>): number {
  let count = 0
  Object.values(allData).forEach((dayData) => {
    if (dayData?.tasks && dayData.tasks.length > 0) count++
  })
  return count
}

export function getTopVisitedDestinations(
  allData: Record<string, ExecutiveGoalDayData>
): Array<{ name: string; visits: number; days: number; rank: number }> {
  const tasks = getAllTasks(allData)
  const byParent = new Map<string, { count: number; title: string }>()
  tasks.forEach((t) => {
    const cur = byParent.get(t.parentExecutiveGoalId)
    const title = t.title || 'Task'
    if (!cur) {
      byParent.set(t.parentExecutiveGoalId, { count: 1, title })
    } else {
      byParent.set(t.parentExecutiveGoalId, { count: cur.count + 1, title: cur.title })
    }
  })
  const sorted = Array.from(byParent.entries())
    .map(([id, { count, title }]) => ({ id, name: title, days: count, visits: count }))
    .sort((a, b) => b.days - a.days)
  return sorted.slice(0, 3).map((g, i) => ({ ...g, rank: i + 1 }))
}

export function getMostVisitedDestination(
  allData: Record<string, ExecutiveGoalDayData>
): { name: string; visits: number; days: number } | null {
  const top = getTopVisitedDestinations(allData)
  return top.length > 0 ? top[0] : null
}

export function countPlansInPeriod(data: Record<string, ExecutiveGoalDayData>): number {
  return getAllTasks(data).length
}

export function calculateDaysOnGoalsInPeriod(data: Record<string, ExecutiveGoalDayData>): number {
  let count = 0
  Object.values(data).forEach((dayData) => {
    if (dayData?.tasks && dayData.tasks.length > 0) count++
  })
  return count
}

export function calculateAveragePlanDuration(_data: Record<string, ExecutiveGoalDayData>): number {
  return 1
}

export function buildDestinationBreakdown(
  data: Record<string, ExecutiveGoalDayData>
): BreakdownItem[] {
  const tasks = getAllTasks(data)
  if (tasks.length === 0) return []
  const byParent = new Map<string, ExecutiveGoalTask[]>()
  tasks.forEach((t) => {
    const list = byParent.get(t.parentExecutiveGoalId) || []
    list.push(t)
    byParent.set(t.parentExecutiveGoalId, list)
  })
  const items: BreakdownItem[] = []
  byParent.forEach((taskList, parentId) => {
    const title = taskList[0]?.title || parentId
    items.push({
      label: title,
      value: `${taskList.length} task${taskList.length !== 1 ? 's' : ''}`,
      count: taskList.length,
      details: '',
      percentage: 100,
      color: '#8B5CF6',
    })
  })
  return items
}

export function calculatePlansPerMonth(allData: Record<string, ExecutiveGoalDayData>): number {
  const tasks = getAllTasks(allData)
  if (tasks.length === 0) return 0
  const monthSet = new Set<string>()
  tasks.forEach((t) => {
    const d = t.endDate
    if (d) monthSet.add(d.slice(0, 7))
  })
  return monthSet.size > 0 ? tasks.length / monthSet.size : 0
}

export function countPlansWithAttachments(_allData: Record<string, ExecutiveGoalDayData>): number {
  return 0
}
