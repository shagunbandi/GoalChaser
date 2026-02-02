import { useState, useEffect } from 'react'
import type { TravelPlan } from '../types'
import { PlaceAutocomplete } from './PlaceAutocomplete'

interface TravelFormProps {
  initialData?: Partial<TravelPlan>
  onSubmit: (data: {
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
  }) => void | Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  availableTravels?: TravelPlan[]
}

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// Helper function to get date 1 week from today in YYYY-MM-DD format
function getOneWeekLater(): string {
  const today = new Date()
  const oneWeekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  return oneWeekLater.toISOString().split('T')[0]
}

export function TravelForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  availableTravels = [],
}: TravelFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [destination, setDestination] = useState(initialData?.destination || '')
  const [startDate, setStartDate] = useState(
    initialData?.startDate || getTodayDate(),
  )
  const [endDate, setEndDate] = useState(
    initialData?.endDate || getOneWeekLater(),
  )
  const [color, setColor] = useState(initialData?.color || '#0EA5E9')
  const [note, setNote] = useState(initialData?.note || '')
  const [parentTravelId, setParentTravelId] = useState(initialData?.parentTravelId || '')
  const [error, setError] = useState<string | null>(null)
  
  // Google Places data
  const [placeId, setPlaceId] = useState(initialData?.placeId || '')
  const [placeCoordinates, setPlaceCoordinates] = useState<{ lat: number; lng: number } | undefined>(
    initialData?.placeCoordinates
  )
  const [placeAddress, setPlaceAddress] = useState(initialData?.placeAddress || '')

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setDestination(initialData.destination || '')
      setStartDate(initialData.startDate || getTodayDate())
      setEndDate(initialData.endDate || getOneWeekLater())
      setColor(initialData.color || '#0EA5E9')
      setNote(initialData.note || '')
      setParentTravelId(initialData.parentTravelId || '')
      setPlaceId(initialData.placeId || '')
      setPlaceCoordinates(initialData.placeCoordinates)
      setPlaceAddress(initialData.placeAddress || '')
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !startDate || !endDate) {
      setError('Title and dates are required')
      return
    }

    if (startDate > endDate) {
      setError('End date must be after start date')
      return
    }

    // Validate parent travel dates if a parent is selected
    if (parentTravelId) {
      const parentTravel = availableTravels.find(t => t.id === parentTravelId)
      if (parentTravel) {
        if (startDate < parentTravel.startDate || endDate > parentTravel.endDate) {
          setError('Sub-travel dates must be within parent travel dates')
          return
        }
      }
    }

    setError(null)
    await onSubmit({
      title: title.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      color,
      note: note.trim(),
      parentTravelId: parentTravelId || undefined,
      placeId: placeId || undefined,
      placeCoordinates: placeCoordinates,
      placeAddress: placeAddress || undefined,
    })
  }

  const handlePlaceSelect = (place: {
    name: string
    placeId: string
    address: string
    coordinates: { lat: number; lng: number }
  }) => {
    setDestination(place.name)
    setPlaceId(place.placeId)
    setPlaceCoordinates(place.coordinates)
    setPlaceAddress(place.address)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-white/60">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Work trip to NYC"
            className="
              w-full rounded-xl border border-white/10 bg-white/5
              px-3 py-2 text-sm text-white placeholder-white/40
              focus:border-[#AF52DE]/60 focus:outline-none
            "
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-white/60">
            Destination (optional)
          </label>
          <PlaceAutocomplete
            value={destination}
            onChange={setDestination}
            onPlaceSelect={handlePlaceSelect}
            placeholder="City or country"
            disabled={isSubmitting}
            className="
              w-full rounded-xl border border-white/10 bg-white/5
              px-3 py-2 text-sm text-white placeholder-white/40
              focus:border-[#AF52DE]/60 focus:outline-none
            "
          />
        </div>
      </div>

      {/* Main Trip Selector */}
      {availableTravels.length > 0 && (
        <div className="space-y-1">
          <label className="text-xs text-white/60">Main Trip (optional)</label>
          <select
            value={parentTravelId}
            onChange={(e) => setParentTravelId(e.target.value)}
            className="
              w-full rounded-xl border border-white/10 bg-white/5
              px-3 py-2 text-sm text-white
              focus:border-[#AF52DE]/60 focus:outline-none
              appearance-none cursor-pointer
            "
            disabled={isSubmitting}
          >
            <option value="" className="bg-[#1a1a1a] text-white">None (Standalone trip)</option>
            {availableTravels
              .filter(t => {
                // Don't show self
                if (t.id === initialData?.id) return false
                // Don't show travels that already have parents (keep nesting to 1 level)
                if (t.parentTravelId) return false
                // Only show travels that overlap with current date range
                if (startDate && endDate) {
                  return !(t.endDate < startDate || t.startDate > endDate)
                }
                return true
              })
              .map(travel => (
                <option key={travel.id} value={travel.id} className="bg-[#1a1a1a] text-white">
                  {travel.title} ({travel.startDate} → {travel.endDate})
                </option>
              ))
            }
          </select>
          {parentTravelId && (
            <p className="text-xs text-white/40 mt-1">
              This trip will be grouped under the selected main trip
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-white/60">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="
              w-full rounded-xl border border-white/10 bg-white/5
              px-3 py-2 text-sm text-white placeholder-white/40
              focus:border-[#AF52DE]/60 focus:outline-none
            "
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-white/60">End date</label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="
              w-full rounded-xl border border-white/10 bg-white/5
              px-3 py-2 text-sm text-white placeholder-white/40
              focus:border-[#AF52DE]/60 focus:outline-none
            "
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/60">Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-12 rounded-lg border border-white/10 bg-transparent"
            disabled={isSubmitting}
          />
          <span className="text-xs text-white/50">
            Used to highlight travel days
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/60">Notes (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Details, tickets, confirmation numbers..."
          className="
            w-full rounded-xl border border-white/10 bg-white/5
            px-3 py-2 text-sm text-white placeholder-white/40
            focus:border-[#AF52DE]/60 focus:outline-none
            resize-none
          "
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="
            px-4 py-2 rounded-xl text-sm font-medium
            bg-white/[0.05] text-white/70 hover:bg-white/[0.1]
            transition-all duration-150
          "
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="
            px-4 py-2 rounded-xl text-sm font-medium
            bg-gradient-to-r from-[#007AFF] to-[#AF52DE]
            text-white hover:shadow-[0_0_20px_rgba(0,122,255,0.3)]
            transition-all duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isSubmitting
            ? 'Saving…'
            : initialData?.id
            ? 'Update travel'
            : 'Save travel'}
        </button>
      </div>
    </form>
  )
}
