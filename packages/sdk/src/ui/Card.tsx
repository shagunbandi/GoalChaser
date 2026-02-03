'use client'

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: 'blue' | 'purple' | 'cyan' | 'none'
}

export function Card({ children, className = '', hover = false, glow = 'none' }: CardProps) {
  const glowClasses = {
    blue: 'hover:shadow-[0_0_40px_rgba(0,122,255,0.15)]',
    purple: 'hover:shadow-[0_0_40px_rgba(175,82,222,0.15)]',
    cyan: 'hover:shadow-[0_0_40px_rgba(50,212,222,0.15)]',
    none: '',
  }

  return (
    <div
      className={`
        relative overflow-hidden
        bg-white/[0.02] 
        backdrop-blur-[40px]
        rounded-3xl 
        border border-white/[0.06]
        shadow-[0_4px_24px_-1px_rgba(0,0,0,0.2),inset_0_0_1px_rgba(255,255,255,0.1)]
        transition-all duration-300 ease-out
        ${hover ? `
          hover:bg-white/[0.04] 
          hover:border-white/[0.12]
          hover:shadow-[0_8px_40px_-1px_rgba(0,0,0,0.3),inset_0_0_1px_rgba(255,255,255,0.15)]
          hover:-translate-y-0.5
        ` : ''}
        ${glowClasses[glow]}
        ${className}
      `}
    >
      {/* Subtle top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {children}
    </div>
  )
}
