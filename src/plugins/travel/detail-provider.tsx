'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { PluginDetailProvider } from '@/sdk'
import { NotesField } from '@/sdk'
import type { TravelDayData, TravelPlan, TravelPlanInput } from './types'
import { TravelForm } from './components/TravelForm'
import { FileUpload } from './components/FileUpload'

interface TravelDetailContext {
  onEditTravel?: (travel: TravelPlan) => void | Promise<void>
  onDeleteTravel?: (travelId: string) => void | Promise<void>
  onAddTravel?: (travel: TravelPlanInput) => void | Promise<void>
  selectedDate?: string
  allTravels?: TravelPlan[]
  userId?: string
  goalId?: string
}

// Component for empty state with add travel option
function EmptyTravelState({
  date,
  notes,
  onAddTravel,
  onSaveNotes,
  allTravels,
}: {
  date: string
  notes: string
  onAddTravel?: (travel: TravelPlanInput) => void | Promise<void>
  onSaveNotes: (notes: string) => void | Promise<void>
  allTravels?: TravelPlan[]
}) {
  const [isAdding, setIsAdding] = useState(false)

  const handleSubmit = async (data: {
    title: string
    destination: string
    startDate: string
    endDate: string
    color: string
    note: string
    parentTravelId?: string
    placeId?: string
    placeCoordinates?: { lat: number; lng: number }
    placeAddress?: string
  }) => {
    if (onAddTravel) {
      await onAddTravel(data)
    }
    setIsAdding(false)
  }

  if (isAdding) {
    return (
      <div className="space-y-4">
        {/* Notes first */}
        <NotesField
          value={notes}
          onSave={onSaveNotes}
          label="Travel Notes"
          placeholder="Notes about your travel day..."
          icon="📝"
          accentColor="#F97316"
          resetKey={date}
        />
        <div className="py-4">
          <h4 className="text-sm font-medium text-white/70 mb-3">Add Travel</h4>
          <TravelForm
            initialData={{
              startDate: date,
              endDate: date,
            }}
            onSubmit={handleSubmit}
            onCancel={() => setIsAdding(false)}
            availableTravels={allTravels}
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
        label="Travel Notes"
        placeholder="Notes about your travel day..."
        icon="📝"
        accentColor="#F97316"
        resetKey={date}
      />

      <div className="text-center text-white/40 py-8">
        <div className="text-4xl mb-2">✈️</div>
        <p>No travel plans for this day</p>
        {onAddTravel && (
          <button
            onClick={() => setIsAdding(true)}
            className="
              mt-4 px-4 py-2 rounded-xl text-sm font-medium
              bg-gradient-to-r from-[#007AFF] to-[#AF52DE]
              text-white hover:shadow-[0_0_20px_rgba(0,122,255,0.3)]
              transition-all duration-150
            "
          >
            + Add Travel
          </button>
        )}
      </div>
    </div>
  )
}

// Helper to calculate trip stats
function getTripStats(plan: TravelPlan, currentDate: string) {
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
function formatTravelDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

// Component for rendering a single travel plan with edit/delete
function SubTripCard({
  subTrip,
  currentDate,
  planColor,
  onEdit,
  onDelete,
  allTravels,
  userId,
  goalId,
}: {
  subTrip: TravelPlan
  currentDate: string
  planColor: string
  onEdit?: (travel: TravelPlan) => void
  onDelete?: (travelId: string) => void
  allTravels?: TravelPlan[]
  userId?: string
  goalId?: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const { totalDays, currentDay } = getTripStats(subTrip, currentDate)
  const subColor = subTrip.color || planColor

  if (isEditing && onEdit && allTravels) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <TravelForm
          initialData={subTrip}
          onSubmit={async (data) => {
            await onEdit({ ...subTrip, ...data })
            setIsEditing(false)
          }}
          onCancel={() => setIsEditing(false)}
          availableTravels={allTravels}
        />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: subColor }}
            />
            <h5 className="text-sm font-semibold text-white/80 truncate">
              {subTrip.title}
            </h5>
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0"
              style={{
                backgroundColor: `${subColor}20`,
                color: subColor,
              }}
            >
              Day {currentDay}/{totalDays}
            </span>
          </div>
          {subTrip.destination && (
            <p className="text-xs text-white/40 flex items-center gap-1 mb-2">
              <span>📍</span> {subTrip.destination}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-white/40">
            <span>📅 {formatTravelDate(subTrip.startDate)} → {formatTravelDate(subTrip.endDate)}</span>
          </div>
        </div>
        
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-lg text-white/30 hover:text-[#FF9500] hover:bg-[#FF9500]/10 transition-all text-xs"
                title="Edit"
              >
                ✏️
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(subTrip.id)}
                className="p-1.5 rounded-lg text-white/30 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-all text-xs"
                title="Delete"
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* File attachments for sub-trip */}
      {userId && goalId && (
        <div className="mt-2 pt-2 border-t border-white/5">
          {subTrip.files && subTrip.files.length > 0 && (
            <div className="text-[10px] text-white/40 mb-2">📎 Attachments</div>
          )}
          <FileUpload
            travelId={subTrip.id}
            userId={userId}
            goalId={goalId}
            files={subTrip.files || []}
            onFilesChange={async (files) => {
              if (onEdit) {
                await onEdit({ ...subTrip, files })
              }
            }}
          />
        </div>
      )}
    </div>
  )
}

function TravelPlanCard({
  plan,
  currentDate,
  onEdit,
  onDelete,
  allTravels,
  subTrips = [],
  userId,
  goalId,
}: {
  plan: TravelPlan
  currentDate: string
  onEdit?: (travel: TravelPlan) => void
  onDelete?: (travelId: string) => void
  allTravels?: TravelPlan[]
  subTrips?: TravelPlan[]
  userId?: string
  goalId?: string
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const { totalDays, currentDay, status } = getTripStats(plan, currentDate)
  const progress = (currentDay / totalDays) * 100
  const planColor = plan.color || '#0EA5E9'

  const handleEdit = async (data: {
    title: string
    destination: string
    startDate: string
    endDate: string
    color: string
    note: string
    parentTravelId?: string
    placeId?: string
    placeCoordinates?: { lat: number; lng: number }
    placeAddress?: string
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
        parentTravelId: data.parentTravelId,
        placeId: data.placeId,
        placeCoordinates: data.placeCoordinates,
        placeAddress: data.placeAddress,
      })
    }
    setIsEditing(false)
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
            <span>✏️</span> Edit Travel
          </h4>
          <TravelForm
            initialData={plan}
            onSubmit={handleEdit}
            onCancel={() => setIsEditing(false)}
            availableTravels={allTravels}
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
            ✈️
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
                Day {currentDay}/{totalDays}
              </span>
            </div>
            {plan.destination && (
              <p className="text-sm text-white/50 mt-0.5 truncate flex items-center gap-1">
                <span>📍</span> {plan.destination}
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
            <span className="text-white/50">Trip Progress</span>
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
              {formatTravelDate(plan.startDate)}
            </div>
          </div>
          <div className="px-3 py-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-xs text-white/40 mb-1">🏁 To</div>
            <div className="text-sm font-medium text-white/80">
              {formatTravelDate(plan.endDate)}
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
              travelId={plan.id}
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
      
      {/* Sub-trips section */}
      {subTrips.length > 0 && (
        <div className="border-t border-white/10 bg-white/[0.01] p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">Sub-trips</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="space-y-3">
            {subTrips.map((subTrip) => (
              <SubTripCard
                key={subTrip.id}
                subTrip={subTrip}
                currentDate={currentDate}
                planColor={planColor}
                onEdit={onEdit}
                onDelete={onDelete}
                allTravels={allTravels}
                userId={userId}
                goalId={goalId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Component for travel plans list with add option
function TravelPlansView({
  plans,
  date,
  notes,
  onEditTravel,
  onDeleteTravel,
  onAddTravel,
  onSaveNotes,
  allTravels,
  userId,
  goalId,
}: {
  plans: TravelPlan[]
  date: string
  notes: string
  onEditTravel?: (travel: TravelPlan) => void | Promise<void>
  onDeleteTravel?: (travelId: string) => void | Promise<void>
  onAddTravel?: (travel: TravelPlanInput) => void | Promise<void>
  onSaveNotes: (notes: string) => void | Promise<void>
  allTravels?: TravelPlan[]
  userId?: string
  goalId?: string
}) {
  const [isAdding, setIsAdding] = useState(false)

  const handleSubmit = async (data: {
    title: string
    destination: string
    startDate: string
    endDate: string
    color: string
    note: string
    parentTravelId?: string
    placeId?: string
    placeCoordinates?: { lat: number; lng: number }
    placeAddress?: string
  }) => {
    if (onAddTravel) {
      await onAddTravel(data)
    }
    setIsAdding(false)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/30 to-amber-500/30 flex items-center justify-center text-xl">
            ✈️
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white/90">Travel Plans</h3>
            <p className="text-xs text-white/50">
              {plans.length} trip{plans.length !== 1 ? 's' : ''} on this day
            </p>
          </div>
        </div>

        {/* Add button */}
        {onAddTravel && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="
              px-3 py-1.5 rounded-lg text-xs font-medium
              bg-white/10 hover:bg-white/15 text-white/70
              transition-all duration-150 flex items-center gap-1
            "
          >
            <span>+</span> Add
          </button>
        )}
      </div>

      {/* Day Notes - First */}
      <NotesField
        value={notes}
        onSave={onSaveNotes}
        label="Travel Notes"
        placeholder="Notes about your travel day..."
        icon="📝"
        accentColor="#F97316"
        resetKey={date}
      />

      {/* Add Travel Form */}
      {isAdding && (
        <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 p-4">
          <h4 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
            <span>✈️</span> Add New Travel
          </h4>
          <TravelForm
            initialData={{
              startDate: date,
              endDate: date,
            }}
            onSubmit={handleSubmit}
            onCancel={() => setIsAdding(false)}
            availableTravels={allTravels}
          />
        </div>
      )}

      {/* Travel Cards */}
      {(() => {
        // Separate parent trips and orphan trips (no parent or parent doesn't exist on this day)
        const parentTrips = plans.filter(p => !p.parentTravelId)
        const subTrips = plans.filter(p => p.parentTravelId)
        
        // Group sub-trips by their parent
        const subTripsByParent = subTrips.reduce((acc, trip) => {
          const parentId = trip.parentTravelId!
          if (!acc[parentId]) acc[parentId] = []
          acc[parentId].push(trip)
          return acc
        }, {} as Record<string, typeof plans>)
        
        return parentTrips.map((plan) => (
          <TravelPlanCard
            key={plan.id}
            plan={plan}
            currentDate={date}
            onEdit={onEditTravel}
            onDelete={onDeleteTravel}
            allTravels={allTravels}
            subTrips={subTripsByParent[plan.id] || []}
            userId={userId}
            goalId={goalId}
          />
        ))
      })()}
    </div>
  )
}

export class TravelDetailProviderImpl
  implements PluginDetailProvider<TravelDayData>
{
  renderDetail(
    data: TravelDayData | null,
    date: string,
    onUpdate: (updates: Partial<TravelDayData>) => Promise<void>,
    context?: TravelDetailContext,
  ): ReactNode {
    const plans = data?.travelPlans || []
    const notes = data?.notes || ''

    const handleSaveNotes = async (newNotes: string) => {
      await onUpdate({ notes: newNotes })
    }

    if (plans.length === 0) {
      return (
        <EmptyTravelState
          date={date}
          notes={notes}
          onAddTravel={context?.onAddTravel}
          onSaveNotes={handleSaveNotes}
          allTravels={context?.allTravels}
        />
      )
    }

    return (
      <TravelPlansView
        plans={plans}
        date={date}
        notes={notes}
        onEditTravel={context?.onEditTravel}
        onDeleteTravel={context?.onDeleteTravel}
        onAddTravel={context?.onAddTravel}
        onSaveNotes={handleSaveNotes}
        allTravels={context?.allTravels}
        userId={context?.userId}
        goalId={context?.goalId}
      />
    )
  }
}
