'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { PluginDetailProvider } from '@/sdk'
import type { TravelDayData, TravelPlan } from './types'
import { TravelForm } from './components/TravelForm'

interface TravelDetailContext {
  onEditTravel?: (travel: TravelPlan) => void | Promise<void>
  onDeleteTravel?: (travelId: string) => void | Promise<void>
}

// Component for rendering a single travel plan with edit/delete
function TravelPlanCard({
  plan,
  onEdit,
  onDelete,
}: {
  plan: TravelPlan
  onEdit?: (travel: TravelPlan) => void
  onDelete?: (travelId: string) => void
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const handleEdit = async (data: {
    title: string
    destination: string
    startDate: string
    endDate: string
    color: string
    note: string
  }) => {
    if (onEdit) {
      await onEdit({
        ...plan,
        title: data.title,
        destination: data.destination,
        startDate: data.startDate,
        endDate: data.endDate,
        color: data.color,
        note: data.note,
      })
    }
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <h4 className="text-sm font-medium text-white/70 mb-3">Edit Travel</h4>
        <TravelForm
          initialData={plan}
          onSubmit={handleEdit}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className="group p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/8 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {plan.color && (
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: plan.color }}
              />
            )}
            <h4 className="font-medium text-white/90">{plan.title}</h4>
          </div>
          {plan.destination && (
            <p className="text-sm text-white/60 mt-1">📍 {plan.destination}</p>
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

      <div className="text-sm text-white/60">
        <div>📅 {new Date(plan.startDate + 'T00:00:00').toLocaleDateString()} → {new Date(plan.endDate + 'T00:00:00').toLocaleDateString()}</div>
      </div>

      {plan.note && (
        <div className="text-sm text-white/70 pt-2 border-t border-white/10">
          📝 {plan.note}
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && onDelete && (
        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
          <span className="text-sm text-white/60">Delete this trip?</span>
          <button
            onClick={() => onDelete(plan.id)}
            className="px-3 py-1 bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white text-sm font-medium rounded-lg transition-all"
          >
            Delete
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-3 py-1 bg-white/10 hover:bg-white/15 text-white/70 text-sm rounded-lg transition-all"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

export class TravelDetailProviderImpl implements PluginDetailProvider<TravelDayData> {
  renderDetail(
    data: TravelDayData | null,
    date: string,
    onUpdate: (updates: Partial<TravelDayData>) => Promise<void>,
    context?: TravelDetailContext
  ): ReactNode {
    const plans = data?.travelPlans || []

    if (plans.length === 0) {
      return (
        <div className="text-center text-white/40 py-8">
          <div className="text-4xl mb-2">✈️</div>
          <p>No travel plans for this day</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white/90">
          Travel Plans ({plans.length})
        </h3>
        {plans.map((plan) => (
          <TravelPlanCard
            key={plan.id}
            plan={plan}
            onEdit={context?.onEditTravel}
            onDelete={context?.onDeleteTravel}
          />
        ))}
      </div>
    )
  }
}
