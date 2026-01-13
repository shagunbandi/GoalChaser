import type { SIPPlan } from '@/types'
import { formatShortDate } from '@/utils'

interface SIPCardProps {
  sip: SIPPlan & { days?: string[] }
  onRemove?: () => void
}

export function SIPCard({ sip, onRemove }: SIPCardProps) {
  const totalDays = sip.days?.length || 0
  const completedCount = sip.completedDates?.length || 0
  const progressPercentage = totalDays > 0 ? (completedCount / totalDays) * 100 : 0
  const totalInvested = sip.amount * completedCount
  const totalExpected = sip.amount * totalDays

  return (
    <div
      className="
        group w-full rounded-xl border border-white/10 bg-white/5 p-3
        transition-all hover:border-white/20 hover:bg-white/8
      "
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-2 w-2 rounded-full ring-1 ring-black/20"
              style={{ backgroundColor: sip.color || '#10B981' }}
            />
            <h3 className="text-sm font-semibold text-white truncate">
              {sip.name}
            </h3>
          </div>
          <div className="mt-1 text-xs text-white/60">
            ₹{sip.amount.toLocaleString('en-IN')} • {sip.frequency}
          </div>
          <div className="mt-1 text-xs text-white/50">
            {formatShortDate(sip.startDate)} → {formatShortDate(sip.endDate)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-white">
            {completedCount}/{totalDays}
          </div>
          <div className="text-xs text-white/60">
            investments
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-white/60">Progress</span>
          <span className="text-white/80">{progressPercentage.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#10B981] to-[#34D399] transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Investment Summary */}
      <div className="mt-2 flex justify-between text-xs">
        <span className="text-white/60">
          Invested: <span className="text-green-400 font-medium">₹{totalInvested.toLocaleString('en-IN')}</span>
        </span>
        <span className="text-white/60">
          Remaining: <span className="text-white/80 font-medium">₹{(totalExpected - totalInvested).toLocaleString('en-IN')}</span>
        </span>
      </div>

      {sip.expectedReturn && (
        <div className="mt-1 text-xs text-white/50">
          Expected return: {sip.expectedReturn}% p.a.
        </div>
      )}

      {/* Action Buttons */}
      {onRemove && (
        <div className="mt-3 pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="
              px-3 py-1.5 rounded-lg text-xs font-medium
              bg-red-500/10 text-red-400 border border-red-500/20
              hover:bg-red-500/20 hover:border-red-500/30
              transition-all
            "
          >
            Remove SIP
          </button>
        </div>
      )}
    </div>
  )
}
