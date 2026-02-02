'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  icon?: string
  iconGradient?: string
  children: ReactNode
}

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon = '⚙️',
  iconGradient = 'from-[#007AFF] to-[#5856D6]',
  children,
}: DrawerProps) {
  const [mounted, setMounted] = useState(false)
  const portalRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    portalRef.current = document.body
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!isOpen || !mounted || !portalRef.current) return null

  const drawerContent = (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-xl transition-opacity duration-200"
        onClick={onClose}
        style={{
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Drawer Panel */}
      <div
        className="
          fixed top-0 right-0 bottom-0
          w-full max-w-[90vw] md:max-w-[70vw] lg:max-w-3xl h-full
          overflow-hidden flex flex-col
          bg-gradient-to-br from-[#1a1a24] to-[#15151f]
          border-l border-white/10
          shadow-[-25px_0_60px_-15px_rgba(0,0,0,0.9)]
        "
        style={{
          animation: 'slideInRight 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div className="relative p-6 sm:p-8 shrink-0 border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-[#007AFF]/5 to-transparent" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${iconGradient} flex items-center justify-center text-2xl shadow-lg`}
                style={{ boxShadow: '0 10px 30px -10px rgba(0, 122, 255, 0.3)' }}
              >
                {icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-sm text-white/50 mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="
                w-10 h-10 rounded-xl
                bg-white/5 hover:bg-white/10
                border border-white/10 hover:border-white/20
                text-white/60 hover:text-white
                flex items-center justify-center
                transition-all duration-200
                hover:scale-105
              "
            >
              <span className="text-lg">✕</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  )

  return createPortal(drawerContent, portalRef.current)
}
