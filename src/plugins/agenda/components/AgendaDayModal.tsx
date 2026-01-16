'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui'
import { AgendaManager } from './AgendaManager'
import { formatDateDisplay } from '@/utils'

interface AgendaDayModalProps {
  selectedDate: string
  todayISO: string
  dayDetails: Record<string, any>
  availableSubjects: string[]
  onUpdateDetails: (iso: string, updates: any) => Promise<void>
  onClose: () => void
}

export function AgendaDayModal({
  selectedDate,
  todayISO,
  dayDetails,
  availableSubjects,
  onUpdateDetails,
  onClose,
}: AgendaDayModalProps) {
  const [statusText, setStatusText] = useState('Ready')
  const [statusTone, setStatusTone] = useState<
    'info' | 'success' | 'error' | 'progress'
  >('info')

  const pushStatus = (status: {
    text: string
    tone?: 'info' | 'success' | 'error' | 'progress'
  }) => {
    setStatusText(status.text)
    setStatusTone(status.tone ?? 'info')
  }

  const agendaItems = dayDetails[selectedDate]?.agendaItems || []

  return (
    <Modal open={true} onClose={onClose}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">Agenda</h2>
            <p className="text-sm text-white/60 mt-1">
              {formatDateDisplay(selectedDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="
              px-4 py-2 rounded-lg text-sm font-medium
              bg-white/5 text-white/70
              hover:bg-white/10 hover:text-white
              transition-all duration-150
            "
          >
            Close
          </button>
        </div>

        {/* Status Bar */}
        <div
          className={`
            text-xs px-3 py-2 rounded-lg
            ${
              statusTone === 'success'
                ? 'bg-green-500/10 text-green-400'
                : statusTone === 'error'
                ? 'bg-red-500/10 text-red-400'
                : statusTone === 'progress'
                ? 'bg-blue-500/10 text-blue-400'
                : 'bg-white/5 text-white/60'
            }
          `}
        >
          {statusText}
        </div>

        {/* Agenda Manager */}
        <div className="max-h-[60vh] overflow-y-auto">
          <AgendaManager
            selectedDate={selectedDate}
            todayISO={todayISO}
            dayDetails={dayDetails}
            agendaItems={agendaItems}
            availableSubjects={availableSubjects}
            onUpdateDetails={onUpdateDetails}
            onStatus={pushStatus}
          />
        </div>
      </div>
    </Modal>
  )
}
