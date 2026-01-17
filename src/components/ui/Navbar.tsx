'use client'

import Link from 'next/link'
import { UserAvatar } from '@/hooks/useAuth'

interface NavbarProps {
  goalId: string
  goalName: string
  goalDescription?: string
  children?: React.ReactNode
}

export function Navbar({
  goalId,
  goalName,
  goalDescription,
  children,
}: NavbarProps) {
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
            <Link href={`/goal/${goalId}`} className="min-w-0 group">
              <h1 className="text-sm md:text-base font-medium text-white/90 truncate group-hover:text-white transition-colors">
                {goalName}
              </h1>
              {goalDescription && (
                <p className="text-white/40 text-xs truncate hidden sm:block group-hover:text-white/50 transition-colors">
                  {goalDescription}
                </p>
              )}
            </Link>
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
