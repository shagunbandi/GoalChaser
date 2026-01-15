'use client'

import type { ButtonConfig } from '@/types/year-view-config'

interface ButtonRendererProps {
  config: ButtonConfig & { className?: string }
}

export function ButtonRenderer({ config }: ButtonRendererProps) {
  const getColorClasses = () => {
    // Ghost variant - glassmorphic style
    if (config.variant === 'ghost') {
      return 'bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/12 text-white/70 hover:text-white backdrop-blur-sm'
    }

    // Solid variant - glassmorphic with subtle color tints
    switch (config.color) {
      case 'danger':
        return 'bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 text-red-200 border border-red-500/30 hover:border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.15)] hover:shadow-[0_0_18px_rgba(239,68,68,0.25)] backdrop-blur-md'
      
      case 'success':
        return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 text-green-200 border border-green-500/30 hover:border-green-500/40 shadow-[0_0_12px_rgba(34,197,94,0.15)] hover:shadow-[0_0_18px_rgba(34,197,94,0.25)] backdrop-blur-md'
      
      case 'warning':
        return 'bg-gradient-to-r from-amber-500/20 to-orange-400/20 hover:from-amber-500/30 hover:to-orange-400/30 text-amber-200 border border-amber-500/30 hover:border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)] hover:shadow-[0_0_18px_rgba(245,158,11,0.25)] backdrop-blur-md'
      
      case 'info':
        return 'bg-gradient-to-r from-sky-500/20 to-blue-500/20 hover:from-sky-500/30 hover:to-blue-500/30 text-sky-200 border border-sky-500/30 hover:border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.15)] hover:shadow-[0_0_18px_rgba(14,165,233,0.25)] backdrop-blur-md'
      
      case 'purple':
        return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-200 border border-purple-500/30 hover:border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.15)] hover:shadow-[0_0_18px_rgba(168,85,247,0.25)] backdrop-blur-md'
      
      case 'secondary':
        return 'bg-white/10 hover:bg-white/15 border border-white/15 hover:border-white/20 text-white backdrop-blur-md'
      
      case 'primary':
      default:
        return 'bg-gradient-to-r from-[#007AFF]/20 to-[#AF52DE]/20 hover:from-[#007AFF]/30 hover:to-[#AF52DE]/30 text-blue-200 border border-[#007AFF]/30 hover:border-[#007AFF]/40 shadow-[0_0_12px_rgba(0,122,255,0.15)] hover:shadow-[0_0_18px_rgba(175,82,222,0.25)] backdrop-blur-md'
    }
  }

  return (
    <button
      onClick={config.onClick}
      disabled={config.disabled}
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
        transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${getColorClasses()}
        ${config.className || ''}
      `}
    >
      {config.icon && <span>{config.icon}</span>}
      {config.label}
    </button>
  )
}
