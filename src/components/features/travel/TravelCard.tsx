import type { TravelPlan } from '@/types'
import { formatShortDate } from '@/utils'

interface TravelCardProps {
  travel: TravelPlan & { days?: string[] }
  onClick?: () => void
}

export function TravelCard({ travel, onClick }: TravelCardProps) {
  const dayCount = travel.days?.length || 0

  return (
    <button
      onClick={onClick}
      className="
        w-full text-left rounded-xl border border-white/[0.08] bg-white/[0.04] p-3
        hover:bg-white/[0.06] hover:border-white/[0.12]
        transition-all duration-150
      "
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white">{travel.title}</div>
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/[0.12] text-[11px]"
          style={{
            backgroundColor: `${travel.color || 'rgba(14,165,233,0.25)'}`,
          }}
          title={travel.destination}
        >
          ✈️
        </span>
      </div>
      <div className="mt-1 text-xs text-white/60">
        {travel.destination && <span>{travel.destination} • </span>}
        {formatShortDate(travel.startDate)} → {formatShortDate(travel.endDate)}
      </div>
      {dayCount > 0 && (
        <div className="mt-2 text-[11px] text-white/50">
          {dayCount} day{dayCount === 1 ? '' : 's'}
        </div>
      )}
    </button>
  )
}
