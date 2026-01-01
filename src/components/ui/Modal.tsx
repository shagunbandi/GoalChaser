interface ModalProps {
  open: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="
          relative z-10 w-full max-w-3xl
          rounded-2xl border border-white/10
          bg-[#0b0b12]/95 backdrop-blur-xl
          shadow-[0_20px_60px_rgba(0,0,0,0.45)]
          overflow-hidden
        "
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="text-lg font-semibold text-white/90">{title}</div>
          <button
            onClick={onClose}
            className="
              text-white/50 hover:text-white
              px-2 py-1 rounded-lg hover:bg-white/5
              transition-colors
            "
          >
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-white/5 bg-white/2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
