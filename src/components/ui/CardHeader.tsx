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
    <div className="border-b border-white/10 pb-4 mb-4">
      <div className="flex items-center justify-center gap-2">
        {icon && <span className="text-xl">{icon}</span>}
        <h2 className="text-lg font-bold text-white tracking-wide uppercase">
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className="text-center text-slate-400 text-xs mt-1">{subtitle}</p>
      )}
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}

