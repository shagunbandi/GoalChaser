'use client'

import { useState } from 'react'
import { Drawer } from '@/sdk'
import { ExecutiveGoalForm } from './ExecutiveGoalForm'
import { AddExecutiveGoalChat } from './AddExecutiveGoalChat'
import { ExecutiveGoalPlanCard } from '../detail-provider'
import type { ExecutiveGoal, ExecutiveGoalInput, ExecutiveGoalDayData } from '../types'

interface ExecutiveGoalManagerProps {
  isOpen: boolean
  dayData: Record<string, ExecutiveGoalDayData>
  onAddExecutiveGoal: (goal: ExecutiveGoalInput) => void | Promise<void>
  onUpdateExecutiveGoal: (goal: ExecutiveGoal) => void | Promise<void>
  onDeleteExecutiveGoal: (goalId: string) => void | Promise<void>
  onClose: () => void
  allExecutiveGoals?: ExecutiveGoal[]
  userId?: string
  goalId?: string
}

export function ExecutiveGoalManager({
  isOpen,
  onAddExecutiveGoal,
  onUpdateExecutiveGoal,
  onDeleteExecutiveGoal,
  onClose,
  allExecutiveGoals = [],
  userId,
  goalId,
}: ExecutiveGoalManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingExecutiveGoal, setEditingExecutiveGoal] = useState<ExecutiveGoal | null>(null)

  const goals = allExecutiveGoals.sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  )

  const handleAddExecutiveGoal = async (data: ExecutiveGoalInput) => {
    await onAddExecutiveGoal(data)
    setShowAddForm(false)
  }

  const handleUpdateExecutiveGoal = async (data: ExecutiveGoalInput) => {
    if (!editingExecutiveGoal) return
    await onUpdateExecutiveGoal({
      ...editingExecutiveGoal,
      ...data,
    })
    setEditingExecutiveGoal(null)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Executive Goals"
      subtitle={`${goals.length} ${goals.length === 1 ? 'goal' : 'goals'} planned`}
      icon="🎯"
      iconGradient="from-[#8B5CF6] to-[#7C3AED]"
    >
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

      {showAddForm && (
        <div className="p-6 sm:p-8 border-b border-white/5 min-h-[360px]">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Goal</h3>
          <AddExecutiveGoalChat
            onSubmit={async (goal) => {
              await onAddExecutiveGoal(goal)
              setShowAddForm(false)
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {editingExecutiveGoal && (
        <div className="p-6 sm:p-8 border-b border-white/5">
          <h3 className="text-lg font-semibold text-white mb-4">Edit Goal</h3>
          <ExecutiveGoalForm
            initialData={editingExecutiveGoal}
            onSubmit={handleUpdateExecutiveGoal}
            onCancel={() => setEditingExecutiveGoal(null)}
          />
        </div>
      )}

      <div className="px-6 sm:px-8 py-6 flex-1 overflow-y-auto">
        {goals.length === 0 ? (
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
            {goals.map((goal) => (
              <ExecutiveGoalPlanCard
                key={goal.id}
                plan={goal}
                currentDate={today}
                onEdit={onUpdateExecutiveGoal}
                onDelete={onDeleteExecutiveGoal}
                allExecutiveGoals={goals}
                tasks={[]}
                userId={userId}
                goalId={goalId}
                showDayProgress={false}
                hideTaskSection={true}
              />
            ))}
          </div>
        )}
      </div>

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
