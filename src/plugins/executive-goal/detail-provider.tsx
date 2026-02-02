'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { PluginDetailProvider } from '@/sdk'
import { NotesField } from '@/sdk'
import type {
  ExecutiveGoalDayData,
  ExecutiveGoal,
  ExecutiveGoalInput,
  ExecutiveGoalTask,
  ExecutiveGoalTaskInput,
} from './types'
import { ExecutiveGoalForm } from './components/ExecutiveGoalForm'
import { ExecutiveGoalTaskForm } from './components/ExecutiveGoalTaskForm'
import { AddExecutiveGoalChat } from './components/AddExecutiveGoalChat'
import { GenerateTasksModal } from './components/GenerateTasksModal'
import type { SuggestedTask } from './components/GenerateTasksModal'
import { FileUpload } from './components/FileUpload'

interface ExecutiveGoalDetailContext {
  onEditExecutiveGoal?: (executiveGoal: ExecutiveGoal) => void | Promise<void>
  onDeleteExecutiveGoal?: (executiveGoalId: string) => void | Promise<void>
  onAddExecutiveGoal?: (executiveGoal: ExecutiveGoalInput) => void | Promise<void>
  selectedDate?: string
  allExecutiveGoals?: ExecutiveGoal[]
  userId?: string
  goalId?: string
  loadAllPlansForGoal?: () => Promise<ExecutiveGoal[]>
}

// Component for empty state with add executiveGoal option
function EmptyExecutiveGoalState({
  date,
  notes,
  onAddExecutiveGoal,
  onSaveNotes,
  allExecutiveGoals,
}: {
  date: string
  notes: string
  onAddExecutiveGoal?: (executiveGoal: ExecutiveGoalInput) => void | Promise<void>
  onSaveNotes: (notes: string) => void | Promise<void>
  allExecutiveGoals?: ExecutiveGoal[]
}) {
  const [isAdding, setIsAdding] = useState(false)

  if (isAdding) {
    return (
      <div className="space-y-4">
        {/* Notes first */}
        <NotesField
          value={notes}
          onSave={onSaveNotes}
          label="ExecutiveGoal Notes"
          placeholder="Notes about your executiveGoal day..."
          icon="📝"
          accentColor="#8B5CF6"
          resetKey={date}
        />
        <div className="py-4">
          <h4 className="text-sm font-medium text-white/70 mb-3">Add Executive Goal</h4>
          <AddExecutiveGoalChat
            onSubmit={async (goal) => {
              if (onAddExecutiveGoal) await onAddExecutiveGoal(goal)
              setIsAdding(false)
            }}
            onCancel={() => setIsAdding(false)}
            prefilledStartDate={date}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Notes first */}
      <NotesField
        value={notes}
        onSave={onSaveNotes}
        label="ExecutiveGoal Notes"
        placeholder="Notes about your executiveGoal day..."
        icon="📝"
        accentColor="#8B5CF6"
        resetKey={date}
      />

      <div className="text-center text-white/40 py-8">
        <div className="text-4xl mb-2">🎯</div>
        <p>No executiveGoal plans for this day</p>
        {onAddExecutiveGoal && (
          <button
            onClick={() => setIsAdding(true)}
            className="
              mt-4 px-4 py-2 rounded-xl text-sm font-medium
              bg-gradient-to-r from-[#8B5CF6] to-[#AF52DE]
              text-white hover:shadow-[0_0_20px_rgba(0,122,255,0.3)]
              transition-all duration-150
            "
          >
            + Add ExecutiveGoal
          </button>
        )}
      </div>
    </div>
  )
}

// Helper to calculate trip stats (goal-level plan with start/end date)
function getTripStats(plan: ExecutiveGoal, currentDate: string) {
  const start = new Date(plan.startDate + 'T00:00:00')
  const end = new Date(plan.endDate + 'T00:00:00')
  const current = new Date(currentDate + 'T00:00:00')

  const totalDays =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const currentDay =
    Math.ceil((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

  let status: 'starting' | 'ongoing' | 'ending' = 'ongoing'
  if (currentDay === 1) status = 'starting'
  else if (currentDay === totalDays) status = 'ending'

  return { totalDays, currentDay, status }
}

// Format date nicely
function formatExecutiveGoalDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

// Component for rendering a single task (day-level)
function TaskCard({
  task,
  currentDate,
  planColor,
  onEdit,
  onDelete,
  userId,
  goalId,
}: {
  task: ExecutiveGoalTask
  currentDate: string
  planColor: string
  onEdit: (task: ExecutiveGoalTask) => void
  onDelete: (taskId: string) => void
  userId?: string
  goalId?: string
}) {
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [completionNote, setCompletionNote] = useState(task.completionNote || '')
  const taskColor = task.color || planColor

  const handleToggleComplete = async () => {
    await onEdit({ ...task, completed: !task.completed })
  }

  const handleSaveNote = async () => {
    await onEdit({ ...task, completionNote: completionNote.trim() })
    setIsAddingNote(false)
  }

  return (
    <div 
      className="group rounded-xl border p-3 transition-all cursor-pointer hover:bg-white/[0.02]"
      style={{
        borderColor: `${taskColor}40`,
        background: `linear-gradient(135deg, ${taskColor}08, transparent)`,
        opacity: task.completed ? 0.7 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          className="mt-0.5 flex-shrink-0"
        >
          <div
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
              task.completed
                ? 'bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] border-[#8B5CF6]'
                : 'border-white/30 hover:border-[#8B5CF6]/60'
            }`}
          >
            {task.completed && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            )}
          </div>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1" onClick={() => setIsAddingNote(true)}>
            <h4 className={`text-sm font-medium ${task.completed ? 'text-white/50 line-through' : 'text-white/80'}`}>
              {task.title}
            </h4>
          </div>
          {task.howToAchieve && (
            <p className="text-xs text-white/55 mt-0.5 leading-relaxed">
              → {task.howToAchieve}
            </p>
          )}

          {/* Completion Note Display */}
          {task.completionNote && !isAddingNote && (
            <div 
              className="mt-2 p-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10"
              onClick={() => setIsAddingNote(true)}
            >
              <p className="text-xs text-white/60 italic">&quot;{task.completionNote}&quot;</p>
            </div>
          )}

          {/* Add/Edit Note Section */}
          {isAddingNote && (
            <div className="mt-2 space-y-2">
              <textarea
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder="How did it go?"
                rows={2}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-[#8B5CF6]/60 focus:outline-none resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={handleSaveNote} className="px-3 py-1 rounded-lg text-xs font-medium bg-[#8B5CF6] hover:bg-[#7C3AED] text-white transition-colors">
                  Save
                </button>
                <button onClick={() => { setIsAddingNote(false); setCompletionNote(task.completionNote || ''); }} className="px-3 py-1 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-white/70 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-white/40 mt-2">
            <span>📅 {formatExecutiveGoalDate(task.endDate)}</span>
            {!isAddingNote && !task.completionNote && (
              <button onClick={() => setIsAddingNote(true)} className="text-[#8B5CF6]/60 hover:text-[#8B5CF6] transition-colors">
                + Add note
              </button>
            )}
          </div>
        </div>
        
        {/* Actions */}
        {!isAddingNote && onDelete && (
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(task.id)
              }}
              className="p-1.5 rounded-lg text-white/30 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-all text-xs"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ExecutiveGoalPlanCard({
  plan,
  currentDate,
  onEdit,
  onDelete,
  onAddTask,
  onAddTasks,
  onEditTask,
  onDeleteTask,
  allExecutiveGoals,
  tasks = [],
  userId,
  goalId,
  showDayProgress = true,
  hideTaskSection = false,
  loadAllPlansForGoal,
}: {
  plan: ExecutiveGoal
  currentDate: string
  onEdit?: (executiveGoal: ExecutiveGoal) => void
  onDelete?: (executiveGoalId: string) => void
  onAddTask?: (task: ExecutiveGoalTask) => void
  /** Add multiple tasks in one update (avoids stale closure when adding suggested tasks). */
  onAddTasks?: (tasks: ExecutiveGoalTask[]) => void
  onEditTask?: (task: ExecutiveGoalTask) => void
  onDeleteTask?: (taskId: string) => void
  allExecutiveGoals?: ExecutiveGoal[]
  tasks?: ExecutiveGoalTask[]
  userId?: string
  goalId?: string
  showDayProgress?: boolean
  hideTaskSection?: boolean
  loadAllPlansForGoal?: () => Promise<ExecutiveGoal[]>
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([])
  const [generateLoading, setGenerateLoading] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [lastGenerateUsage, setLastGenerateUsage] = useState<{
    totalTokens: number
    estimatedCostUsd: number
  } | null>(null)
  const [lastPromptsUsed, setLastPromptsUsed] = useState<{ system: string; user: string } | null>(null)

  const { totalDays, currentDay, status } = getTripStats(plan, currentDate)
  const progress = (currentDay / totalDays) * 100
  const planColor = plan.color || '#8B5CF6'

  const handleEdit = async (data: ExecutiveGoalInput) => {
    if (onEdit) {
      await onEdit({ ...plan, ...data })
    }
    setIsEditing(false)
  }

  const runGenerateTasks = async () => {
    if (!loadAllPlansForGoal || !onAddTask || !userId || !goalId) return
    setGenerateModalOpen(true)
    setGenerateLoading(true)
    setGenerateError(null)
    try {
      const goals = await loadAllPlansForGoal()
      const goal = goals.find((g) => g.id === plan.id) || plan
      const completedForGoal = tasks.filter(
        (t) => t.parentExecutiveGoalId === plan.id && t.completed === true && t.endDate <= currentDate,
      )
      const completedTasks = completedForGoal.map((t) => ({
        title: t.title,
        endDate: t.endDate,
        completionNote: t.completionNote,
      }))
      const existingTasksForDay = tasks
        .filter((t) => t.endDate === currentDate)
        .map((t) => t.title)

      const res = await fetch('/api/ai/generate-executive-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planText: goal.plan || '',
          progressSoFar: goal.progressSoFar || [],
          completedTasks,
          date: currentDate,
          existingTasksForDay,
          goalStartDate: goal.startDate,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setGenerateError(data.error || `Request failed: ${res.status}`)
        setSuggestedTasks([])
        return
      }
      if ((data.newSummary || data.totalUsage) && onEdit) {
        const updates: Partial<ExecutiveGoal> = { ...goal }
        if (data.newSummary) {
          updates.progressSoFar = [...(goal.progressSoFar || []), data.newSummary]
        }
        if (data.totalUsage) {
          const prev = goal.aiUsage
          const totalUsage = data.totalUsage as {
            promptTokens: number
            completionTokens: number
            totalTokens: number
            estimatedCostUsd: number
          }
          updates.aiUsage = {
            totalPromptTokens: (prev?.totalPromptTokens ?? 0) + totalUsage.promptTokens,
            totalCompletionTokens: (prev?.totalCompletionTokens ?? 0) + totalUsage.completionTokens,
            totalTokens: (prev?.totalTokens ?? 0) + totalUsage.totalTokens,
            estimatedCostUsd: (prev?.estimatedCostUsd ?? 0) + totalUsage.estimatedCostUsd,
            lastUpdated: new Date().toISOString(),
          }
        }
        await onEdit(updates as ExecutiveGoal)
      }
      setSuggestedTasks(data.tasks || [])
      setLastGenerateUsage(
        data.totalUsage
          ? {
              totalTokens: data.totalUsage.totalTokens,
              estimatedCostUsd: data.totalUsage.estimatedCostUsd,
            }
          : null
      )
      setLastPromptsUsed(data.promptsUsed ?? null)
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Something went wrong')
      setSuggestedTasks([])
    } finally {
      setGenerateLoading(false)
    }
  }

  const handleAddSuggestedTasks = async (toAdd: SuggestedTask[]) => {
    if (toAdd.length === 0) return
    const newTasks: ExecutiveGoalTask[] = toAdd.map((t, i) => ({
      id: `task_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 9)}`,
      title: t.title,
      parentExecutiveGoalId: plan.id,
      endDate: currentDate,
      color: plan.color,
      completed: false,
      ...(t.howToAchieve && { howToAchieve: t.howToAchieve }),
    }))
    if (onAddTasks) {
      await onAddTasks(newTasks)
    } else if (onAddTask) {
      for (const task of newTasks) {
        await onAddTask(task)
      }
    }
  }

  if (isEditing) {
    return (
      <div
        className="rounded-2xl border border-white/10 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${planColor}10, transparent)`,
        }}
      >
        <div className="p-4">
          <h4 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
            <span>✏️</span> Edit goal
          </h4>
          <ExecutiveGoalForm
            initialData={plan}
            onSubmit={handleEdit}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className="group rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm transition-all duration-300 hover:border-white/20"
      style={{
        background: `linear-gradient(135deg, ${planColor}15, ${planColor}05)`,
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          {/* Icon with color */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-lg"
            style={{
              backgroundColor: `${planColor}40`,
              boxShadow: `0 0 20px ${planColor}30`,
            }}
          >
            🎯
          </div>

          {/* Title & Destination */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-white/90 truncate">
                {plan.title}
              </h4>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0"
                style={{
                  backgroundColor: `${planColor}30`,
                  color: planColor,
                }}
              >
                {showDayProgress 
                  ? `Day ${currentDay}/${totalDays}`
                  : `${totalDays} day${totalDays !== 1 ? 's' : ''}`
                }
              </span>
            </div>
            {plan.plan && (
              <p className="text-sm text-white/50 mt-0.5 truncate">
                {plan.plan}
              </p>
            )}
            {plan.aiUsage && (
              <p className="text-[10px] text-white/40 mt-1">
                AI: {plan.aiUsage.totalTokens.toLocaleString()} tokens, ~$
                {plan.aiUsage.estimatedCostUsd.toFixed(4)} USD
              </p>
            )}
          </div>

          {/* Actions */}
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-lg text-white/40 hover:text-[#FF9500] hover:bg-[#FF9500]/10 transition-all"
                  title="Edit"
                >
                  ✏️
                </button>
              )}
              {onDelete && !showDeleteConfirm && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 rounded-lg text-white/40 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-all"
                  title="Delete"
                >
                  🗑️
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50">Goal Progress</span>
            <span
              className="font-semibold capitalize"
              style={{ color: planColor }}
            >
              {status === 'starting'
                ? '🚀 Starting Today'
                : status === 'ending'
                ? '🏁 Last Day'
                : `${Math.round(progress)}% Complete`}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${planColor}, ${planColor}CC)`,
              }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="px-3 py-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-xs text-white/40 mb-1">📅 From</div>
            <div className="text-sm font-medium text-white/80">
              {formatExecutiveGoalDate(plan.startDate)}
            </div>
          </div>
          <div className="px-3 py-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-xs text-white/40 mb-1">🏁 To</div>
            <div className="text-sm font-medium text-white/80">
              {formatExecutiveGoalDate(plan.endDate)}
            </div>
          </div>
        </div>

        {/* Notes */}
        {plan.note && (
          <div className="px-3 py-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-xs text-white/40 mb-1">📝 Notes</div>
            <div className="text-sm text-white/70 whitespace-pre-wrap">
              {plan.note}
            </div>
          </div>
        )}
        
        {/* File Attachments */}
        {userId && goalId && (
          <div className="px-3 py-2">
            {plan.files && plan.files.length > 0 && (
              <div className="text-xs text-white/40 mb-2">📎 Attachments</div>
            )}
            <FileUpload
              executiveGoalId={plan.id}
              userId={userId}
              goalId={goalId}
              files={plan.files || []}
              onFilesChange={async (files) => {
                if (onEdit) {
                  await onEdit({ ...plan, files })
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Tasks section */}
      {!hideTaskSection && (
        <div className="border-t border-white/10 bg-white/[0.01] p-4">
          {tasks.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">Tasks</span>
                <span className="text-xs text-white/30">{tasks.length}</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <div className="space-y-3 mb-3">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentDate={currentDate}
                    planColor={planColor}
                    onEdit={(updated) => {
                      if (onEditTask) onEditTask(updated)
                    }}
                    onDelete={(id) => {
                      if (onDeleteTask) onDeleteTask(id)
                    }}
                    userId={userId}
                    goalId={goalId}
                  />
                ))}
              </div>
            </>
          )}

          {/* Generate tasks for today */}
          {!isAddingTask &&
            userId &&
            goalId &&
            loadAllPlansForGoal &&
            onAddTask && (
              <button
                onClick={runGenerateTasks}
                className="
                  w-full px-4 py-2.5 rounded-xl
                  bg-white/10 hover:bg-white/15 border border-white/10
                  text-white/80 hover:text-white font-medium text-sm
                  transition-all duration-200 flex items-center justify-center gap-2 mb-2
                "
              >
                Generate tasks for {currentDate === new Date().toISOString().split('T')[0] ? 'today' : 'this day'}
              </button>
            )}

          {/* Add task button - always visible, below tasks */}
          {!isAddingTask && userId && goalId && (
            <button
              onClick={() => setIsAddingTask(true)}
              className="
                w-full px-4 py-2.5 rounded-xl
                bg-gradient-to-r from-[#8B5CF6]/20 to-[#7C3AED]/20
                hover:from-[#8B5CF6]/30 hover:to-[#7C3AED]/30
                border border-[#8B5CF6]/30 hover:border-[#8B5CF6]/50
                text-white/80 hover:text-white
                font-medium text-sm
                transition-all duration-200
                flex items-center justify-center gap-2
              "
            >
              Add Task
            </button>
          )}

          {/* Add task form */}
          {isAddingTask && onAddTask && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-white/70 mb-3">
                Add Task
              </h4>
              <ExecutiveGoalTaskForm
                availableGoals={allExecutiveGoals || [plan]}
                date={currentDate}
                defaultColor={plan.color}
                onSubmit={async (data: ExecutiveGoalTaskInput) => {
                  const newTask: ExecutiveGoalTask = {
                    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                    title: data.title,
                    parentExecutiveGoalId: data.parentExecutiveGoalId,
                    endDate: data.endDate,
                    color: data.color,
                    completed: false,
                  }
                  await onAddTask(newTask)
                  setIsAddingTask(false)
                }}
                onCancel={() => setIsAddingTask(false)}
              />
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && onDelete && (
        <div className="px-4 py-3 border-t border-white/10 bg-red-500/5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-white/60">Delete this trip?</span>
            <div className="flex gap-2">
              <button
                onClick={() => onDelete(plan.id)}
                className="px-4 py-1.5 bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white text-sm font-medium rounded-lg transition-all"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white/70 text-sm rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate tasks modal */}
      <GenerateTasksModal
        open={generateModalOpen}
        onClose={() => {
          setGenerateModalOpen(false)
          setGenerateError(null)
        }}
        goal={plan}
        date={currentDate}
        suggestedTasks={suggestedTasks}
        isLoading={generateLoading}
        error={generateError}
        onAddSelected={handleAddSuggestedTasks}
        onRegenerate={runGenerateTasks}
        lastUsage={lastGenerateUsage}
        promptsUsed={lastPromptsUsed}
      />
    </div>
  )
}

// Component for goals that span this day + tasks on this day
function ExecutiveGoalPlansView({
  goalsForDay,
  tasksForDay,
  date,
  notes,
  onEditExecutiveGoal,
  onDeleteExecutiveGoal,
  onAddExecutiveGoal,
  onSaveNotes,
  onUpdateDay,
  allExecutiveGoals,
  userId,
  goalId,
  loadAllPlansForGoal,
}: {
  goalsForDay: ExecutiveGoal[]
  tasksForDay: ExecutiveGoalTask[]
  date: string
  notes: string
  onEditExecutiveGoal?: (executiveGoal: ExecutiveGoal) => void | Promise<void>
  onDeleteExecutiveGoal?: (executiveGoalId: string) => void | Promise<void>
  onAddExecutiveGoal?: (executiveGoal: ExecutiveGoalInput) => void | Promise<void>
  onSaveNotes: (notes: string) => void | Promise<void>
  onUpdateDay: (updates: Partial<ExecutiveGoalDayData>) => void | Promise<void>
  allExecutiveGoals?: ExecutiveGoal[]
  userId?: string
  goalId?: string
  loadAllPlansForGoal?: () => Promise<ExecutiveGoal[]>
}) {
  const [isAdding, setIsAdding] = useState(false)

  const handleEditTask = async (task: ExecutiveGoalTask) => {
    await onUpdateDay({
      tasks: tasksForDay.map((t) => (t.id === task.id ? task : t)),
    })
  }

  const handleDeleteTask = async (taskId: string) => {
    await onUpdateDay({ tasks: tasksForDay.filter((t) => t.id !== taskId) })
  }

  const handleAddTask = async (task: ExecutiveGoalTask) => {
    await onUpdateDay({ tasks: [...tasksForDay, task] })
  }

  const handleAddTasks = async (tasks: ExecutiveGoalTask[]) => {
    await onUpdateDay({ tasks: [...tasksForDay, ...tasks] })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/30 to-amber-500/30 flex items-center justify-center text-xl">
            🎯
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white/90">Executive Goals</h3>
            <p className="text-xs text-white/50">
              {goalsForDay.length} goal{goalsForDay.length !== 1 ? 's' : ''}, {tasksForDay.length} task{tasksForDay.length !== 1 ? 's' : ''} on this day
            </p>
          </div>
        </div>
        {onAddExecutiveGoal && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="
              px-3 py-1.5 rounded-lg text-xs font-medium
              bg-white/10 hover:bg-white/15 text-white/70
              transition-all duration-150 flex items-center gap-1
            "
          >
            <span>+</span> Add goal
          </button>
        )}
      </div>

      <NotesField
        value={notes}
        onSave={onSaveNotes}
        label="Executive Goal Notes"
        placeholder="Notes about your executive goal day..."
        icon="📝"
        accentColor="#8B5CF6"
        resetKey={date}
      />

      {isAdding && (
        <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 p-4 min-h-[320px]">
          <h4 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
            <span>🎯</span> Add New Executive Goal
          </h4>
          <AddExecutiveGoalChat
            onSubmit={async (goal) => {
              if (onAddExecutiveGoal) await onAddExecutiveGoal(goal)
              setIsAdding(false)
            }}
            onCancel={() => setIsAdding(false)}
            prefilledStartDate={date}
          />
        </div>
      )}

      {goalsForDay.map((plan) => (
        <ExecutiveGoalPlanCard
          key={plan.id}
          plan={plan}
          currentDate={date}
          onEdit={onEditExecutiveGoal}
          onDelete={onDeleteExecutiveGoal}
          onAddTask={handleAddTask}
          onAddTasks={handleAddTasks}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          allExecutiveGoals={allExecutiveGoals}
          tasks={tasksForDay.filter((t) => t.parentExecutiveGoalId === plan.id)}
          userId={userId}
          goalId={goalId}
          loadAllPlansForGoal={loadAllPlansForGoal}
        />
      ))}
    </div>
  )
}

export class ExecutiveGoalDetailProviderImpl
  implements PluginDetailProvider<ExecutiveGoalDayData>
{
  renderDetail(
    data: ExecutiveGoalDayData | null,
    date: string,
    onUpdate: (updates: Partial<ExecutiveGoalDayData>) => Promise<void>,
    context?: ExecutiveGoalDetailContext,
  ): ReactNode {
    const notes = data?.notes || ''
    const tasksForDay = data?.tasks || []
    const goalsForDay =
      context?.allExecutiveGoals?.filter(
        (g) => date >= g.startDate && date <= g.endDate,
      ) || []

    const handleSaveNotes = async (newNotes: string) => {
      await onUpdate({ notes: newNotes })
    }

    if (goalsForDay.length === 0 && tasksForDay.length === 0) {
      return (
        <EmptyExecutiveGoalState
          date={date}
          notes={notes}
          onAddExecutiveGoal={context?.onAddExecutiveGoal}
          onSaveNotes={handleSaveNotes}
          allExecutiveGoals={context?.allExecutiveGoals}
        />
      )
    }

    return (
      <ExecutiveGoalPlansView
        goalsForDay={goalsForDay}
        tasksForDay={tasksForDay}
        date={date}
        notes={notes}
        onEditExecutiveGoal={context?.onEditExecutiveGoal}
        onDeleteExecutiveGoal={context?.onDeleteExecutiveGoal}
        onAddExecutiveGoal={context?.onAddExecutiveGoal}
        onSaveNotes={handleSaveNotes}
        onUpdateDay={onUpdate}
        allExecutiveGoals={context?.allExecutiveGoals}
        userId={context?.userId}
        goalId={context?.goalId}
        loadAllPlansForGoal={context?.loadAllPlansForGoal}
      />
    )
  }
}

// Export components for reuse
export { ExecutiveGoalPlanCard, TaskCard }
