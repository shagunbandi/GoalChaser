'use client'

import { useState, useEffect } from 'react'
import { subscribeToStatus } from '@/utils/logger'

type StatusTone = 'info' | 'success' | 'error' | 'progress'

const toneStyles: Record<StatusTone, string> = {
  info: 'bg-white/[0.08] text-white/80',
  success: 'bg-[#30D158]/20 text-[#30D158]',
  error: 'bg-red-500/20 text-red-300',
  progress: 'bg-[#007AFF]/20 text-[#007AFF]',
}

const toneSymbol: Record<StatusTone, string> = {
  info: '•',
  success: '✓',
  error: '✕',
  progress: '◌',
}

export function StatusBar() {
  const [text, setText] = useState('Ready')
  const [tone, setTone] = useState<StatusTone>('info')

  useEffect(() => {
    const unsubscribe = subscribeToStatus((message, level) => {
      setText(message)
      setTone(level)
    })
    return unsubscribe
  }, [])

  const style = toneStyles[tone] || toneStyles.info
  const symbol = toneSymbol[tone] || toneSymbol.info

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-50
        h-7 px-4
        flex items-center
        backdrop-blur-xl border-t border-white/10
        ${style}
        transition-colors duration-200
      `}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-xs font-medium">
        <span className="text-[10px]">{symbol}</span>
        <span className="truncate">{text}</span>
      </div>
    </div>
  )
}
