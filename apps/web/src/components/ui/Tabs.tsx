'use client'

export interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onTabChange, className = '' }: TabsProps) {
  return (
    <div
      className={`
        flex 
        bg-white/[0.03] 
        backdrop-blur-xl 
        rounded-2xl 
        border border-white/[0.06] 
        p-1.5
        ${className}
      `}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex-1 py-2.5 px-4 rounded-xl font-medium text-sm 
            transition-all duration-200
            ${activeTab === tab.id
              ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(0,122,255,0.1)] border border-white/10'
              : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
