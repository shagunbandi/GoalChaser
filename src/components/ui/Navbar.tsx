'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserAvatar } from '@/hooks/useAuth'

interface NavbarProps {
  goalId: string
  goalName: string
  goalDescription?: string
}

export function Navbar({ goalId, goalName, goalDescription }: NavbarProps) {
  const pathname = usePathname()
  const isAnalytics = pathname.includes('/analytics')

  return (
    <nav className="sticky top-0 z-50 glass-navbar">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: App name + Goal name */}
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
            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-medium text-white/90 truncate">
                {goalName}
              </h1>
              {goalDescription && (
                <p className="text-white/40 text-xs truncate hidden sm:block">
                  {goalDescription}
                </p>
              )}
            </div>
          </div>

          {/* Right: Navigation + User Avatar */}
          <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/goal/${goalId}`}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium 
                transition-all duration-200
                ${!isAnalytics
                  ? 'bg-white/10 text-white border border-white/10 shadow-[0_0_20px_rgba(0,122,255,0.15)]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }
              `}
            >
              <span className="text-base">📅</span>
              <span className="hidden sm:inline">Calendar</span>
            </Link>
            <Link
              href={`/goal/${goalId}/analytics`}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium 
                transition-all duration-200
                ${isAnalytics
                  ? 'bg-white/10 text-white border border-white/10 shadow-[0_0_20px_rgba(175,82,222,0.15)]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }
              `}
            >
              <span className="text-base">📊</span>
              <span className="hidden sm:inline">Analytics</span>
            </Link>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-white/10" />

            {/* User Avatar */}
            <UserAvatar size="sm" />
          </div>
        </div>
      </div>
    </nav>
  )
}
