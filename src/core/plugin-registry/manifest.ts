import type { Plugin } from '@/sdk'

// Static imports of all plugins
// Note: Calendar and Analytics are NOT plugins - they're part of the core app
import StudyPlugin from '@/plugins/study/plugin'
import ProductivityPlugin from '@/plugins/productivity/plugin'
import FinancePlugin from '@/plugins/finance/plugin'
import TravelPlugin from '@/plugins/travel/plugin'
import PeriodPlugin from '@/plugins/period/plugin'

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
]
