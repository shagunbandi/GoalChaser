interface StatusBarProps {
  text: string
  tone?: 'info' | 'success' | 'error' | 'progress'
}

const toneStyles: Record<NonNullable<StatusBarProps['tone']>, string> = {
  info: 'bg-white/[0.06] text-white/80 border-white/[0.12]',
  success: 'bg-[#30D158]/15 text-[#30D158] border-[#30D158]/30',
  error: 'bg-red-500/10 text-red-300 border-red-500/30',
  progress: 'bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/25',
}

const toneSymbol: Record<NonNullable<StatusBarProps['tone']>, string> = {
  info: 'ℹ️',
  success: '✅',
  error: '⚠️',
  progress: '⏳',
}

export function StatusBar({ text, tone = 'info' }: StatusBarProps) {
  const style = toneStyles[tone] || toneStyles.info
  const symbol = toneSymbol[tone] || toneSymbol.info

  return (
    <div className="fixed inset-x-0 bottom-3 pointer-events-none z-40">
      <div className="flex justify-center px-4">
        <div
          className={`
            pointer-events-auto min-h-[44px] min-w-[240px]
            px-4 py-2 rounded-2xl border
            shadow-[0_10px_30px_rgba(0,0,0,0.35)]
            backdrop-blur-xl
            ${style}
          `}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 text-sm">
            <span>{symbol}</span>
            <span className="truncate">{text || 'Ready'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
