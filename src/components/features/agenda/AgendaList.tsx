'use client'

import type { AgendaItem as AgendaItemType } from '@/types'
import { AgendaItem } from './AgendaItem'

interface AgendaListProps {
  items: AgendaItemType[]
  selectedDate: string
  isPastOrToday: boolean
  onEdit: (item: AgendaItemType) => void
  onToggleCompletion: (iso: string, id: string, completed: boolean) => void
  onDeleteSeries: (recurrenceId: string) => void
  onDeleteSingle: (iso: string, id: string) => void
}

export function AgendaList({
  items,
  selectedDate,
  isPastOrToday,
  onEdit,
  onToggleCompletion,
  onDeleteSeries,
  onDeleteSingle,
}: AgendaListProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="space-y-2" data-testid="agenda-list">
      {items.map((item) => (
        <AgendaItem
          key={item.id}
          item={item}
          selectedDate={selectedDate}
          isPastOrToday={isPastOrToday}
          onEdit={onEdit}
          onToggleCompletion={onToggleCompletion}
          onDeleteSeries={onDeleteSeries}
          onDeleteSingle={onDeleteSingle}
        />
      ))}
    </div>
  )
}
