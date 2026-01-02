'use client'

import type { AgendaItem as AgendaItemType } from '@/types'

interface AgendaItemProps {
  item: AgendaItemType
  selectedDate: string
  isPastOrToday: boolean
  onEdit: (item: AgendaItemType) => void
  onToggleCompletion: (iso: string, id: string, completed: boolean) => void
  onDeleteSeries: (recurrenceId: string) => void
  onDeleteSingle: (iso: string, id: string) => void
}

export function AgendaItem({
  item,
  selectedDate,
  isPastOrToday,
  onEdit,
  onToggleCompletion,
  onDeleteSeries,
  onDeleteSingle,
}: AgendaItemProps) {
  return (
    <div
      data-test-id={`agenda-item-${item.id}`}
      className="
        flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between
        rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2
      "
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium text-white"
            data-test-id="agenda-item-title"
          >
            {item.title}
          </span>
          {item.repeat && item.repeat.type !== 'none' && (
            <span
              className="text-xs text-[#AF52DE] bg-[#AF52DE]/10 px-2 py-1 rounded-lg"
              data-test-id="agenda-item-repeat-badge"
            >
              {item.repeat.type === 'daily'
                ? 'Daily'
                : item.repeat.type === 'weekly'
                ? 'Weekly'
                : `Custom ${item.repeat.days?.join(', ')}`}
            </span>
          )}
          {item.subjects && item.subjects.length > 0 && (
            <div
              className="flex flex-wrap gap-1"
              data-test-id="agenda-item-subjects"
            >
              {item.subjects.map((s) => (
                <span
                  key={s}
                  className="text-[11px] text-[#30D158] bg-[#30D158]/15 px-2 py-0.5 rounded-lg"
                  data-test-id={`agenda-item-subject-${s}`}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        {item.note && (
          <p className="text-xs text-white/50" data-test-id="agenda-item-note">
            {item.note}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(item)}
          data-test-id="button-edit-agenda"
          className="
            text-base text-white/50 hover:text-white
            p-2 rounded-lg hover:bg-white/10 transition-all duration-150
          "
          title="Edit"
        >
          ✏️
        </button>
        {isPastOrToday && (
          <button
            onClick={() =>
              onToggleCompletion(selectedDate, item.id, !item.completed)
            }
            data-test-id={
              item.completed ? 'button-mark-incomplete' : 'button-mark-complete'
            }
            className={`
              text-base p-2 rounded-lg border transition-all duration-150
              ${
                item.completed
                  ? 'bg-[#30D158]/20 border-[#30D158]/40 text-[#30D158]'
                  : 'bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.08]'
              }
            `}
            title={item.completed ? 'Completed' : 'Mark done'}
          >
            {item.completed ? '✅' : '⬜'}
          </button>
        )}
        {item.recurrenceId && (
          <button
            onClick={() => onDeleteSeries(item.recurrenceId!)}
            data-test-id="button-delete-series"
            className="
              text-sm px-2 py-1 rounded-lg
              bg-red-500/10 hover:bg-red-500/20
              text-red-300 hover:text-red-200
              border border-red-500/30
              transition-all duration-150
            "
            title="Delete all occurrences in this series"
          >
            🗑️ Series
          </button>
        )}
        <button
          onClick={() => onDeleteSingle(selectedDate, item.id)}
          data-test-id="button-delete-single"
          className="
            text-sm px-2 py-1 rounded-lg
            bg-white/5 hover:bg-white/10
            text-white/70 hover:text-white
            border border-white/10
            transition-all duration-150
          "
          title="Delete only this day"
        >
          ❌ This day
        </button>
      </div>
    </div>
  )
}
