'use client'

export function AppFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative z-10 border-t border-white/6 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gradient">Nitya</span>
            <span>—</span>
            <span>Your goals, tracked forever</span>
          </div>
          <div>
            <span>© {currentYear} Nitya</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
