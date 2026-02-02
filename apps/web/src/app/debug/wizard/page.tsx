'use client'

import { useState } from 'react'
import { AIWorkflowWizard } from '@/components/features/calendar/AIWorkflowWizard'
import type { AIPreviewData } from '@goal-chaser/sdk'
import { usePluginRegistry } from '@/core/plugin-registry/hooks'

// Dummy data scenarios
const PRODUCTIVITY_SCENARIOS = {
  newAreaAndTopic: {
    name: 'New Area + Topic',
    extractedData: {
      status: 8,
      areas: [
        { area: 'Reading', topics: ['Two Good Men'] },
        { area: 'Exercise', topics: ['Running'] },
      ],
      directHours: 6.5,
    },
    config: {
      areas: [
        { id: '1', name: 'Coding', topics: ['React', 'TypeScript'], hasTopics: true },
      ],
    },
    existingDayData: null,
  },
  existingAreaNewTopic: {
    name: 'Existing Area + New Topic',
    extractedData: {
      status: 7,
      areas: [
        { area: 'Coding', topics: ['Python', 'AI'] },
      ],
      directHours: 8,
    },
    config: {
      areas: [
        { id: '1', name: 'Coding', topics: ['React', 'TypeScript'], hasTopics: true },
      ],
    },
    existingDayData: null,
  },
  allExisting: {
    name: 'All Existing (No Creation Steps)',
    extractedData: {
      status: 9,
      areas: [
        { area: 'Coding', topics: ['React'] },
      ],
      directHours: 10,
    },
    config: {
      areas: [
        { id: '1', name: 'Coding', topics: ['React', 'TypeScript'], hasTopics: true },
      ],
    },
    existingDayData: null,
  },
  scoreOnly: {
    name: 'Score Only (No Areas)',
    extractedData: {
      status: 6,
      areas: [],
      directHours: 4,
    },
    config: {
      areas: [],
    },
    existingDayData: null,
  },
}

const TRAVEL_SCENARIOS = {
  multiplePlans: {
    name: 'Multiple Travel Plans',
    extractedData: {
      travelPlans: [
        {
          id: 'trip-1',
          title: 'Summer Vacation',
          destination: 'Paris, France',
          startDate: '2024-07-15',
          endDate: '2024-07-25',
          note: 'Anniversary trip',
        },
        {
          id: 'trip-2',
          title: 'Business Conference',
          destination: 'New York, USA',
          startDate: '2024-08-10',
          endDate: '2024-08-12',
          note: 'Tech summit',
        },
      ],
    },
    existingDayData: null,
  },
  singlePlan: {
    name: 'Single Travel Plan',
    extractedData: {
      travelPlans: [
        {
          id: 'trip-1',
          title: 'Weekend Getaway',
          destination: 'Lake Tahoe',
          startDate: '2024-06-01',
          endDate: '2024-06-03',
          note: '',
        },
      ],
    },
    existingDayData: null,
  },
  noPlans: {
    name: 'No Travel Plans',
    extractedData: {
      travelPlans: [],
    },
    existingDayData: null,
  },
}

type TestMode = 'full-wizard' | 'productivity-only' | 'travel-only'

export default function WizardDebugPage() {
  const { registry } = usePluginRegistry()
  const [testMode, setTestMode] = useState<TestMode>('full-wizard')
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [productivityScenario, setProductivityScenario] = useState<keyof typeof PRODUCTIVITY_SCENARIOS>('newAreaAndTopic')
  const [travelScenario, setTravelScenario] = useState<keyof typeof TRAVEL_SCENARIOS>('multiplePlans')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  // Build preview data for full wizard
  const buildPreviewData = (): AIPreviewData[] => {
    const data: AIPreviewData[] = []

    if (testMode === 'full-wizard' || testMode === 'productivity-only') {
      const scenario = PRODUCTIVITY_SCENARIOS[productivityScenario]
      data.push({
        pluginId: 'productivity',
        pluginName: 'Productivity',
        pluginIcon: '📊',
        rawData: scenario.extractedData,
        parsedData: scenario.extractedData as Record<string, unknown>,
        hasData: true,
      })
    }

    if (testMode === 'full-wizard' || testMode === 'travel-only') {
      const scenario = TRAVEL_SCENARIOS[travelScenario]
      data.push({
        pluginId: 'travel',
        pluginName: 'Travel',
        pluginIcon: '✈️',
        rawData: scenario.extractedData,
        parsedData: scenario.extractedData as Record<string, unknown>,
        hasData: scenario.extractedData.travelPlans.length > 0,
      })
    }

    return data
  }

  // Render plugin wizard for full wizard mode using registry
  const renderPluginWizard = (
    pluginId: string,
    extractedData: Record<string, unknown>,
    existingData: unknown,
    config: unknown,
    onComplete: (data: Record<string, unknown>) => void,
    onSkip: () => void,
    onUpdateConfig: (config: Record<string, unknown>) => Promise<void>
  ) => {
    const plugin = registry.getPlugin(pluginId)
    if (!plugin?.aiIntegration?.renderWizard) return null

    // Get scenario-specific config/existingData
    let scenarioConfig = config
    let scenarioExistingData = existingData
    if (pluginId === 'productivity') {
      const scenario = PRODUCTIVITY_SCENARIOS[productivityScenario]
      scenarioConfig = scenario.config
      scenarioExistingData = scenario.existingDayData
    } else if (pluginId === 'travel') {
      const scenario = TRAVEL_SCENARIOS[travelScenario]
      scenarioExistingData = scenario.existingDayData
    }

    return plugin.aiIntegration.renderWizard({
      extractedData,
      config: scenarioConfig,
      existingDayData: scenarioExistingData,
      onComplete: (data) => {
        addLog(`${pluginId} completed: ${JSON.stringify(data)}`)
        onComplete(data as Record<string, unknown>)
      },
      onSkip: () => {
        addLog(`${pluginId} skipped`)
        onSkip()
      },
      onUpdateConfig: async (cfg) => {
        addLog(`${pluginId} config update: ${JSON.stringify(cfg)}`)
        await onUpdateConfig(cfg as Record<string, unknown>)
      },
    })
  }

  // Direct standalone wizard testing
  const [standaloneWizardOpen, setStandaloneWizardOpen] = useState<'productivity' | 'travel' | null>(null)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">AI Wizard Debug</h1>
        <p className="text-white/60">Test and refine the AI wizard flows with different scenarios</p>

        {/* Test Mode Selection */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
          <h2 className="font-semibold">Test Mode</h2>
          <div className="flex gap-2">
            {(['full-wizard', 'productivity-only', 'travel-only'] as TestMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setTestMode(mode)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  testMode === mode
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {mode.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Scenario Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Productivity Scenarios */}
          {(testMode === 'full-wizard' || testMode === 'productivity-only') && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <span>📊</span> Productivity Scenario
              </h2>
              <div className="space-y-2">
                {Object.entries(PRODUCTIVITY_SCENARIOS).map(([key, scenario]) => (
                  <button
                    key={key}
                    onClick={() => setProductivityScenario(key as keyof typeof PRODUCTIVITY_SCENARIOS)}
                    className={`w-full px-4 py-3 rounded-lg text-sm text-left transition-all ${
                      productivityScenario === key
                        ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-medium">{scenario.name}</div>
                    <div className="text-xs text-white/40 mt-1">
                      {scenario.extractedData.areas?.length || 0} areas, 
                      Score: {scenario.extractedData.status || 'none'}
                    </div>
                  </button>
                ))}
              </div>

              {/* Standalone Test */}
              <button
                onClick={() => setStandaloneWizardOpen('productivity')}
                className="w-full px-4 py-2 rounded-lg text-sm bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-all"
              >
                Test Productivity Wizard Standalone
              </button>
            </div>
          )}

          {/* Travel Scenarios */}
          {(testMode === 'full-wizard' || testMode === 'travel-only') && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <span>✈️</span> Travel Scenario
              </h2>
              <div className="space-y-2">
                {Object.entries(TRAVEL_SCENARIOS).map(([key, scenario]) => (
                  <button
                    key={key}
                    onClick={() => setTravelScenario(key as keyof typeof TRAVEL_SCENARIOS)}
                    className={`w-full px-4 py-3 rounded-lg text-sm text-left transition-all ${
                      travelScenario === key
                        ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300'
                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-medium">{scenario.name}</div>
                    <div className="text-xs text-white/40 mt-1">
                      {scenario.extractedData.travelPlans.length} travel plans
                    </div>
                  </button>
                ))}
              </div>

              {/* Standalone Test */}
              <button
                onClick={() => setStandaloneWizardOpen('travel')}
                className="w-full px-4 py-2 rounded-lg text-sm bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition-all"
              >
                Test Travel Wizard Standalone
              </button>
            </div>
          )}
        </div>

        {/* Launch Full Wizard */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <button
            onClick={() => {
              setLogs([])
              setIsWizardOpen(true)
              addLog('Wizard opened')
            }}
            className="w-full px-6 py-4 rounded-xl text-lg font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            🚀 Launch Full Wizard
          </button>
        </div>

        {/* Current Data Preview */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
          <h2 className="font-semibold">Current Test Data</h2>
          <pre className="p-3 rounded-lg bg-black/30 text-xs text-white/70 overflow-x-auto max-h-60 overflow-y-auto">
            {JSON.stringify(buildPreviewData(), null, 2)}
          </pre>
        </div>

        {/* Logs */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Event Logs</h2>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-white/40 hover:text-white/60"
            >
              Clear
            </button>
          </div>
          <div className="p-3 rounded-lg bg-black/30 text-xs text-green-400 font-mono max-h-40 overflow-y-auto">
            {logs.length === 0 ? (
              <span className="text-white/30">No events yet...</span>
            ) : (
              logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Full Wizard Modal */}
      <AIWorkflowWizard
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false)
          addLog('Wizard closed')
        }}
        onComplete={async (confirmedSteps) => {
          addLog(`Wizard completed with ${confirmedSteps.length} plugins`)
          console.log('Confirmed steps:', confirmedSteps)
        }}
        previewData={buildPreviewData()}
        existingDayData={{}}
        pluginConfigs={{
          productivity: PRODUCTIVITY_SCENARIOS[productivityScenario].config,
          travel: {},
        }}
        renderPluginWizard={renderPluginWizard}
        onUpdateConfig={async (pluginId, config) => {
          addLog(`Config update for ${pluginId}: ${JSON.stringify(config)}`)
        }}
      />

      {/* Standalone Plugin Wizard */}
      {standaloneWizardOpen && (() => {
        const plugin = registry.getPlugin(standaloneWizardOpen)
        if (!plugin?.aiIntegration?.renderWizard) return null
        const scenario = standaloneWizardOpen === 'productivity'
          ? PRODUCTIVITY_SCENARIOS[productivityScenario]
          : TRAVEL_SCENARIOS[travelScenario]
        const config = standaloneWizardOpen === 'productivity' ? (scenario as any).config : null
        const scenarioName = scenario.name

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/85 backdrop-blur-xl"
              onClick={() => setStandaloneWizardOpen(null)}
            />
            <div className="relative w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col bg-gradient-to-br from-[#1a1a24] to-[#15151f] border border-white/10 rounded-2xl shadow-2xl">
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-2xl border border-cyan-500/30">
                      {plugin.metadata.icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">{plugin.metadata.name} (Standalone)</h2>
                      <p className="text-sm text-white/50">{scenarioName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStandaloneWizardOpen(null)}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {plugin.aiIntegration.renderWizard({
                  extractedData: scenario.extractedData as any,
                  config,
                  existingDayData: scenario.existingDayData,
                  onComplete: (data) => {
                    addLog(`Standalone ${plugin.metadata.name} completed: ${JSON.stringify(data)}`)
                    setStandaloneWizardOpen(null)
                  },
                  onSkip: () => {
                    addLog(`Standalone ${plugin.metadata.name} skipped`)
                    setStandaloneWizardOpen(null)
                  },
                  onUpdateConfig: async (cfg) => {
                    addLog(`Standalone ${plugin.metadata.name} config update: ${JSON.stringify(cfg)}`)
                  },
                })}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
