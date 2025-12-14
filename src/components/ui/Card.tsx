'use client'

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 ${className}`}
    >
      {children}
    </div>
  )
}

