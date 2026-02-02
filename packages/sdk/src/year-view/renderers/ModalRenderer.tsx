'use client'

import { Modal } from '../../ui/Modal'
import { formatDateDisplay } from '../../utils/date-utils'
import type { ModalSection, ButtonConfig } from '../../types/year-view-config'
import { ButtonRenderer } from './ButtonRenderer'

interface ModalRendererProps {
  open: boolean
  onClose: () => void
  date: string | null
  sections: ModalSection[]
  actions: ButtonConfig[]
}

export function ModalRenderer({
  open,
  onClose,
  date,
  sections,
  actions,
}: ModalRendererProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={date ? formatDateDisplay(date) : 'Day details'}
    >
      {date && (
        <div className="space-y-3">
          {/* Render all content sections */}
          {sections.map((section) => (
            <div key={section.id}>
              {typeof section.content === 'function'
                ? section.content()
                : section.content}
            </div>
          ))}

          {/* Render action buttons if provided */}
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <div key={action.id} className="flex-1 min-w-[140px]">
                  <ButtonRenderer config={{ ...action, className: 'w-full' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
