'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { AIPreviewData } from '@goal-chaser/sdk'

interface PluginWizardResult {
  pluginId: string
  data: Record<string, unknown> | null // null if skipped
}

interface AIWorkflowWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (confirmedSteps: AIPreviewData[]) => Promise<void>
  previewData: AIPreviewData[]
  /** Existing day data for each plugin */
  existingDayData?: Record<string, unknown>
  /** Plugin configs */
  pluginConfigs?: Record<string, unknown>
  /** Render plugin's wizard flow - returns ReactNode or null if no custom wizard */
  renderPluginWizard?: (
    pluginId: string,
    extractedData: Record<string, unknown>,
    existingData: unknown,
    config: unknown,
    onComplete: (data: Record<string, unknown>) => void,
    onSkip: () => void,
    onUpdateConfig: (config: Record<string, unknown>) => Promise<void>
  ) => ReactNode | null
  /** Callback to update plugin config */
  onUpdateConfig?: (pluginId: string, config: Record<string, unknown>) => Promise<void>
}

/**
 * AI Workflow Wizard
 * Orchestrates plugin-specific wizard flows one at a time
 * Each plugin provides its own multi-step flow
 */
export function AIWorkflowWizard({
  isOpen,
  onClose,
  onComplete,
  previewData: initialPreviewData,
  existingDayData = {},
  pluginConfigs = {},
  renderPluginWizard,
  onUpdateConfig,
}: AIWorkflowWizardProps) {
  const [mounted, setMounted] = useState(false)
  const [currentPluginIndex, setCurrentPluginIndex] = useState(0)
  const [pluginsToProcess, setPluginsToProcess] = useState<AIPreviewData[]>([])
  const [results, setResults] = useState<PluginWizardResult[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const portalRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    portalRef.current = document.body
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Initialize when wizard opens
  useEffect(() => {
    if (isOpen && initialPreviewData.length > 0) {
      const pluginsWithData = initialPreviewData.filter(p => p.hasData)
      setPluginsToProcess(pluginsWithData)
      setCurrentPluginIndex(0)
      setResults([])
      setShowSummary(false)
    }
  }, [isOpen, initialPreviewData])

  const currentPlugin = pluginsToProcess[currentPluginIndex]
  const totalPlugins = pluginsToProcess.length
  const progress = totalPlugins > 0 ? (currentPluginIndex + 1) / (totalPlugins + 1) : 0

  const handlePluginComplete = (data: Record<string, unknown>) => {
    setResults(prev => [...prev, { pluginId: currentPlugin.pluginId, data }])
    moveToNext()
  }

  const handlePluginSkip = () => {
    setResults(prev => [...prev, { pluginId: currentPlugin.pluginId, data: null }])
    moveToNext()
  }

  const moveToNext = () => {
    if (currentPluginIndex >= totalPlugins - 1) {
      setShowSummary(true)
    } else {
      setCurrentPluginIndex(prev => prev + 1)
    }
  }

  const handleUpdateConfig = async (config: Record<string, unknown>) => {
    if (onUpdateConfig && currentPlugin) {
      await onUpdateConfig(currentPlugin.pluginId, config)
    }
  }

  const handleFinalComplete = async () => {
    setIsCompleting(true)
    try {
      const confirmedSteps: AIPreviewData[] = results
        .filter(r => r.data !== null)
        .map(r => {
          const plugin = pluginsToProcess.find(p => p.pluginId === r.pluginId)!
          return {
            pluginId: r.pluginId,
            pluginName: plugin.pluginName,
            pluginIcon: plugin.pluginIcon,
            rawData: plugin.rawData,
            parsedData: r.data!,
            hasData: true,
          }
        })

      await onComplete(confirmedSteps)
      onClose()
    } catch (error) {
      console.error('[AIWorkflowWizard] Failed to save:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  const confirmedCount = results.filter(r => r.data !== null).length
  const skippedCount = results.filter(r => r.data === null).length

  // No data case
  if (isOpen && initialPreviewData.filter(p => p.hasData).length === 0) {
    return mounted && portalRef.current ? createPortal(
      <WizardContainer onClose={onClose}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">🤷</div>
          <h3 className="text-xl font-semibold text-white/90 mb-2">
            No Data Found
          </h3>
          <p className="text-sm text-white/50 max-w-sm mb-6">
            The AI couldn&apos;t find any relevant data in your notes for the enabled plugins.
            Try adding more details to your notes.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Close
          </button>
        </div>
      </WizardContainer>,
      portalRef.current
    ) : null
  }

  if (!isOpen || !mounted || !portalRef.current || pluginsToProcess.length === 0) return null

  // Summary view
  if (showSummary) {
    return createPortal(
      <WizardContainer onClose={onClose}>
        <WizardHeader
          title="Review Complete"
          subtitle={`${confirmedCount} saved, ${skippedCount} skipped`}
          icon="✅"
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {pluginsToProcess.map(plugin => {
              const result = results.find(r => r.pluginId === plugin.pluginId)
              const isConfirmed = result?.data !== null

              return (
                <div
                  key={plugin.pluginId}
                  className={`
                    p-4 rounded-xl border
                    ${isConfirmed 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-white/5 border-white/10 opacity-60'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{plugin.pluginIcon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-white/90">{plugin.pluginName}</div>
                      <div className="text-xs text-white/50">
                        {isConfirmed ? 'Saved' : 'Skipped'}
                      </div>
                    </div>
                    <span className={`text-lg ${isConfirmed ? 'text-green-400' : 'text-white/30'}`}>
                      {isConfirmed ? '✓' : '○'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-6 border-t border-white/5 shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isCompleting}
              className="flex-1 px-4 py-3 rounded-xl text-sm bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
            >
              {confirmedCount === 0 ? 'Close' : 'Cancel'}
            </button>
            {confirmedCount > 0 && (
              <button
                onClick={handleFinalComplete}
                disabled={isCompleting}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50"
              >
                {isCompleting ? 'Saving...' : 'Done'}
              </button>
            )}
          </div>
        </div>
      </WizardContainer>,
      portalRef.current
    )
  }

  // Plugin wizard view
  const pluginWizard = renderPluginWizard?.(
    currentPlugin.pluginId,
    currentPlugin.parsedData,
    existingDayData[currentPlugin.pluginId] ?? null,
    pluginConfigs[currentPlugin.pluginId] ?? null,
    handlePluginComplete,
    handlePluginSkip,
    handleUpdateConfig
  )

  return createPortal(
    <WizardContainer onClose={onClose}>
      <WizardHeader
        title={currentPlugin.pluginName}
        subtitle={`Plugin ${currentPluginIndex + 1} of ${totalPlugins}`}
        icon={currentPlugin.pluginIcon}
        onClose={onClose}
        progress={progress}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {pluginWizard || (
          <FallbackPreview
            plugin={currentPlugin}
            onComplete={handlePluginComplete}
            onSkip={handlePluginSkip}
          />
        )}
      </div>
    </WizardContainer>,
    portalRef.current
  )
}

/**
 * Wizard Container
 */
function WizardContainer({ 
  children, 
  onClose 
}: { 
  children: ReactNode
  onClose: () => void 
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-xl"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />

      <div
        className="
          relative w-full max-w-lg
          max-h-[85vh] overflow-hidden flex flex-col
          bg-gradient-to-br from-[#1a1a24] to-[#15151f]
          border border-white/10 rounded-2xl
          shadow-2xl
        "
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        {children}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

/**
 * Wizard Header
 */
function WizardHeader({
  title,
  subtitle,
  icon,
  onClose,
  progress,
}: {
  title: string
  subtitle: string
  icon: string
  onClose: () => void
  progress?: number
}) {
  return (
    <div className="relative shrink-0">
      {progress !== undefined && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
      
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-2xl border border-purple-500/30">
              {icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{title}</h2>
              <p className="text-sm text-white/50">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Fallback preview for plugins without custom wizard
 */
function FallbackPreview({
  plugin,
  onComplete,
  onSkip,
}: {
  plugin: AIPreviewData
  onComplete: (data: Record<string, unknown>) => void
  onSkip: () => void
}) {
  const [data, setData] = useState(plugin.parsedData)

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/50">
        Review the extracted data below.
      </p>
      
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <pre className="text-xs text-white/70 overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSkip}
          className="flex-1 px-4 py-3 rounded-xl text-sm bg-white/5 text-white/60 hover:bg-white/10 border border-white/10 transition-all"
        >
          Skip
        </button>
        <button
          onClick={() => onComplete(data)}
          className="flex-1 px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          Confirm
        </button>
      </div>
    </div>
  )
}
