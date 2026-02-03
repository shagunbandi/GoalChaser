'use client'

import Link from 'next/link'
import { useState } from 'react'
import { UserAvatar } from '@/hooks/useAuth'

interface NavbarProps {
  goalId: string
  goalName: string
  goalDescription?: string
  children?: React.ReactNode
  onEditGoal?: () => void
}

export function Navbar({
  goalId,
  goalName,
  goalDescription,
  children,
  onEditGoal,
}: NavbarProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <nav className="sticky top-0 z-50 glass-navbar">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Just branding + goal name */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0 group"
              title="Back to Goals"
            >
              <span className="text-lg md:text-xl font-bold tracking-tight text-gradient group-hover:opacity-80 transition-opacity">
                Nitya
              </span>
            </Link>
            <span className="text-white/20 shrink-0">/</span>
            <div className="min-w-0 flex items-center gap-2 group">
              <Link href={`/goal/${goalId}`} className="min-w-0">
                <h1 className="text-sm md:text-base font-medium text-white/90 truncate group-hover:text-white transition-colors">
                  {goalName}
                </h1>
                {goalDescription && (
                  <p className="text-white/40 text-xs truncate hidden sm:block group-hover:text-white/50 transition-colors">
                    {goalDescription}
                  </p>
                )}
              </Link>
              {onEditGoal && (
                <button
                  onClick={onEditGoal}
                  className="
                    shrink-0 p-1.5 rounded-lg
                    text-white/40 hover:text-white hover:bg-white/10
                    transition-all duration-200
                    opacity-0 group-hover:opacity-100
                  "
                  title="Edit goal"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Right: Just user avatar */}
          <UserAvatar size="sm" />
        </div>

        {/* Tab bar below navbar (children) */}
        {children && (
          <div className="border-t border-white/5 py-2">{children}</div>
        )}
      </div>
    </nav>
  )
}
