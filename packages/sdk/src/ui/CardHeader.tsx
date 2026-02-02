'use client'

import { ReactNode } from 'react'

interface CardHeaderProps {
  title: string
  icon?: string
  subtitle?: string
  children?: ReactNode
}

export function CardHeader({ title, icon, subtitle, children }: CardHeaderProps) {
  return (
    <div className="relative pb-5 mb-5">
      <div className="flex items-center justify-center gap-3">
        {icon && (
          <span className="text-xl opacity-80">{icon}</span>
        )}
        <h2 className="text-lg font-semibold text-white/90 tracking-wide">
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className="text-center text-white/40 text-sm mt-1.5">{subtitle}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
      
      {/* Glass divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  )
}
