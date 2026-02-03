import type { Plugin } from '@goal-chaser/sdk'

// Static imports of all plugins (workspace packages)
import StudyPlugin from '@goal-chaser/plugin-study'
import ProductivityPlugin from '@goal-chaser/plugin-productivity'
import FinancePlugin from '@goal-chaser/plugin-finance'
import TravelPlugin from '@goal-chaser/plugin-travel'
import PeriodPlugin from '@goal-chaser/plugin-period'
import ExecutiveGoalPlugin from '@goal-chaser/plugin-executive-goal'
import LanguageTutorPlugin from '@goal-chaser/plugin-language-tutor'

/**
 * Plugin Manifest
 * 
 * This file statically imports and registers all available plugins.
 * To add a new plugin:
 * 1. Import it at the top
 * 2. Add it to the AVAILABLE_PLUGINS array
 * 
 * Note: Calendar and Analytics are core app functionality, not plugins.
 */

export interface PluginManifestEntry {
  plugin: Plugin
  enabled: boolean
}

export const AVAILABLE_PLUGINS: PluginManifestEntry[] = [
  { plugin: StudyPlugin, enabled: true },
  { plugin: ProductivityPlugin, enabled: true },
  { plugin: FinancePlugin, enabled: true },
  { plugin: TravelPlugin, enabled: true },
  { plugin: PeriodPlugin, enabled: true },
  { plugin: ExecutiveGoalPlugin, enabled: true },
  { plugin: LanguageTutorPlugin, enabled: true },
]
