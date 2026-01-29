'use client'

import { useState } from 'react'
import { Drawer } from '@/sdk'
import { ExecutiveGoalForm } from './ExecutiveGoalForm'
import { AddExecutiveGoalChat } from './AddExecutiveGoalChat'
import { ExecutiveGoalPlanCard } from '../detail-provider'
import type { ExecutiveGoalPlan, ExecutiveGoalPlanInput, ExecutiveGoalDayData } from '../types'
import { formatShortDate } from '@/utils'

interface ExecutiveGoalManagerProps {
  isOpen: boolean
  dayData: Record<string, ExecutiveGoalDayData>
  onAddExecutiveGoal: (goal: ExecutiveGoalPlanInput) => void | Promise<void>
  onUpdateExecutiveGoal: (goal: ExecutiveGoalPlan) => void | Promise<void>
  onDeleteExecutiveGoal: (goalId: string) => void | Promise<void>
  onClose: () => void
  allExecutiveGoals?: ExecutiveGoalPlan[]
  userId?: string
  goalId?: string
}

export function ExecutiveGoalManager({
  isOpen,
  dayData,
  onAddExecutiveGoal,
  onUpdateExecutiveGoal,
  onDeleteExecutiveGoal,
  onClose,
  allExecutiveGoals,
  userId,
  goalId,
}: ExecutiveGoalManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingExecutiveGoal, setEditingExecutiveGoal] = useState<ExecutiveGoalPlan | null>(null)

  // Extract unique executive goal plans from day data
  const executiveGoalPlans = (() => {
    const planMap = new Map<string, ExecutiveGoalPlan>()
    Object.values(dayData).forEach((data) => {
      data?.executiveGoalPlans?.forEach((plan) => {
        if (!planMap.has(plan.id)) {
          planMap.set(plan.id, plan)
        }
      })
    })
    return Array.from(planMap.values()).sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    )
  })()

  const handleAddExecutiveGoal = async (data: {
    title: string
    plan: string
    startDate: string
    endDate: string
    color: string
    note: string
    parentExecutiveGoalId?: string
  }) => {
    await onAddExecutiveGoal({
      title: data.title,
      plan: data.plan,
      startDate: data.startDate,
      endDate: data.endDate,
      color: data.color,
      note: data.note,
      parentExecutiveGoalId: data.parentExecutiveGoalId,
    })
    setShowAddForm(false)
  }

  const handleUpdateExecutiveGoal = async (data: {
    title: string
    plan: string
    startDate: string
    endDate: string
    color: string
    note: string
    parentExecutiveGoalId?: string
  }) => {
    if (!editingExecutiveGoal) return
    await onUpdateExecutiveGoal({
      ...editingExecutiveGoal,
      title: data.title,
      plan: data.plan,
      startDate: data.startDate,
      endDate: data.endDate,
      color: data.color,
      note: data.note,
      parentExecutiveGoalId: data.parentExecutiveGoalId,
    })
    setEditingExecutiveGoal(null)
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Executive Goals"
      subtitle={`${executiveGoalPlans.length} ${executiveGoalPlans.length === 1 ? 'goal' : 'goals'} planned`}
      icon="🎯"
      iconGradient="from-[#8B5CF6] to-[#7C3AED]"
    >
      {/* Add New Executive Goal Button */}
      {!showAddForm && !editingExecutiveGoal && (
        <div className="p-6 sm:p-8 border-b border-white/5">
          <button
            onClick={() => setShowAddForm(true)}
            className="
              w-full px-6 py-4
              bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED]
              hover:from-[#8B5CF6]/90 hover:to-[#7C3AED]/90
              text-white font-semibold rounded-xl
              shadow-lg shadow-[#8B5CF6]/25
              transition-all duration-200
              hover:scale-[1.02] active:scale-[0.98]
              text-sm
            "
          >
            + Add New Goal
          </button>
        </div>
      )}

      {/* Add Executive Goal - Nitya AI Chat */}
      {showAddForm && (
        <div className="p-6 sm:p-8 border-b border-white/5 min-h-[360px]">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Goal</h3>
          <AddExecutiveGoalChat
            onSubmit={async (goal) => {
              await onAddExecutiveGoal({
                title: goal.title,
                plan: goal.plan,
                startDate: goal.startDate,
                endDate: goal.endDate,
                color: goal.color,
                note: goal.note,
                parentExecutiveGoalId: goal.parentExecutiveGoalId,
              })
              setShowAddForm(false)
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Edit Executive Goal Form */}
      {editingExecutiveGoal && (
        <div className="p-6 sm:p-8 border-b border-white/5">
          <h3 className="text-lg font-semibold text-white mb-4">Edit Goal</h3>
          <ExecutiveGoalForm
            initialData={editingExecutiveGoal}
            onSubmit={handleUpdateExecutiveGoal}
            onCancel={() => setEditingExecutiveGoal(null)}
            availableExecutiveGoals={allExecutiveGoals || executiveGoalPlans}
          />
        </div>
      )}

      {/* Executive Goal List */}
      <div className="px-6 sm:px-8 py-6 flex-1 overflow-y-auto">
        {executiveGoalPlans.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center border border-white/10">
              <span className="text-5xl opacity-50">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-white/80 mb-2">No goals yet</h3>
            <p className="text-sm text-white/40 max-w-xs mx-auto">
              Add your first executive goal to start tracking your progress
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {executiveGoalPlans
              .filter(goal => !goal.parentExecutiveGoalId) // Only show parent goals
              .map((goal) => {
                // Use today's date for the manage view since it's not date-specific
                const today = new Date().toISOString().split('T')[0]
                
                return (
                  <ExecutiveGoalPlanCard
                    key={goal.id}
                    plan={goal}
                    currentDate={today}
                    onEdit={onUpdateExecutiveGoal}
                    onDelete={onDeleteExecutiveGoal}
                    allExecutiveGoals={allExecutiveGoals || executiveGoalPlans}
                    tasks={[]}
                    userId={userId}
                    goalId={goalId}
                    showDayProgress={false}
                    hideTaskSection={true}
                  />
                )
              })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 sm:p-8 border-t border-white/5 shrink-0 bg-gradient-to-t from-black/20">
        <button
          onClick={onClose}
          className="
            w-full px-4 py-3.5
            bg-white/10 hover:bg-white/15
            text-white font-semibold rounded-xl
            transition-all duration-200
            hover:scale-[1.01] active:scale-[0.99]
            border border-white/10
          "
        >
          Done
        </button>
      </div>
    </Drawer>
  )
}
