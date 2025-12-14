'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavbarProps {
  goalId: string
  goalName: string
  goalDescription?: string
}

export function Navbar({ goalId, goalName, goalDescription }: NavbarProps) {
  const pathname = usePathname()
  const isAnalytics = pathname.includes('/analytics')

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: App name + Goal name */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0 group"
              title="Back to Goals"
            >
              <span className="text-lg md:text-xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
                Nitya
              </span>
            </Link>
            <span className="text-slate-600 shrink-0">/</span>
            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-semibold text-white truncate">
                {goalName}
              </h1>
              {goalDescription && (
                <p className="text-slate-500 text-xs truncate hidden sm:block">
                  {goalDescription}
                </p>
              )}
            </div>
          </div>

          {/* Right: Navigation */}
          <div className="flex items-center gap-2">
            <Link
              href={`/goal/${goalId}`}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                !isAnalytics
                  ? 'bg-white/20 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>📅</span>
              <span className="hidden sm:inline">Calendar</span>
            </Link>
            <Link
              href={`/goal/${goalId}/analytics`}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isAnalytics
                  ? 'bg-white/20 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>📊</span>
              <span className="hidden sm:inline">Analytics</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
