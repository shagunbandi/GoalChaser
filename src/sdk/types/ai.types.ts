/**
 * AI Integration Types
 * Types for AI-powered data extraction from natural language notes
 */

import type { ReactNode } from 'react'

/**
 * Field types that AI can extract from text
 */
export type AIFieldType =
  | 'number'
  | 'string'
  | 'boolean'
  | 'select'
  | 'multi-select'
  | 'date'
  | 'time'
  | 'currency'
  | 'array'

/**
 * Single field definition for AI extraction
 */
export interface AIInputField {
  /** Field identifier (e.g., 'status', 'hours') */
  key: string
  /** Data type for this field */
  type: AIFieldType
  /** Human-readable label */
  label: string
  /** Description for AI to understand what this field represents */
  aiHint: string
  /** Whether this field is required */
  required?: boolean
  /** Validation constraints */
  validation?: {
    min?: number
    max?: number
    options?: Array<{ value: string; label: string }>
  }
  /** For array types, describe the item structure */
  itemSchema?: {
    fields: AIInputField[]
  }
}

/**
 * Schema that a plugin exposes for AI extraction
 */
export interface PluginAISchema {
  /** Plugin identifier */
  pluginId: string
  /** Description of what this plugin tracks (for AI context) */
  description: string
  /** Fields that can be extracted */
  fields: AIInputField[]
  /** Few-shot examples to help AI understand the format */
  examples?: Array<{
    input: string
    output: Record<string, unknown>
  }>
}

/**
 * Result from AI extraction for a single plugin
 */
export interface AIExtractionResult {
  /** Plugin identifier */
  pluginId: string
  /** Extracted data (keys match field keys from schema) */
  data: Record<string, unknown>
  /** Optional confidence score (0-1) */
  confidence?: number
}

/**
 * Request payload for AI extraction API
 */
export interface AIExtractRequest {
  /** User's notes/text to extract data from */
  notes: string
  /** Date for which data is being extracted (ISO format) */
  date: string
  /** Goal ID */
  goalId: string
  /** List of enabled plugin IDs to extract data for */
  enabledPlugins: string[]
  /** Plugin configs (keyed by plugin ID) for dynamic schema generation */
  pluginConfigs?: Record<string, unknown>
}

/**
 * Response from AI extraction API
 */
export interface AIExtractResponse {
  /** Extraction results for each plugin */
  results: AIExtractionResult[]
  /** Whether extraction was successful */
  success: boolean
  /** Error message if extraction failed */
  error?: string
}

/**
 * Plugin AI integration interface
 * Plugins implement this to support AI-powered data extraction
 */
export interface PluginAIIntegration<TDayData = unknown, TConfig = unknown> {
  /**
   * Get the schema describing what data this plugin can extract from text
   * @param config Plugin configuration (for dynamic options like categories)
   */
  getSchema: (config: TConfig | null) => PluginAISchema

  /**
   * Parse AI-extracted data into plugin's data format
   * @param extracted Raw data extracted by AI
   * @param existingData Current day data (for merging)
   * @param config Plugin configuration
   */
  parseAIData: (
    extracted: Record<string, unknown>,
    existingData: TDayData | null,
    config: TConfig | null
  ) => Partial<TDayData>

  /**
   * Optional: Render a preview/edit UI for extracted data before saving
   * If not provided, a generic preview will be shown
   * @param data Parsed data to preview/edit
   * @param onChange Callback when user edits the data
   * @param config Plugin configuration
   * @deprecated Use renderWizard for multi-step flows
   */
  renderPreview?: (
    data: Partial<TDayData>,
    onChange: (data: Partial<TDayData>) => void,
    config: TConfig | null
  ) => ReactNode

  /**
   * Optional: Render a complete wizard flow for reviewing/editing extracted data
   * This allows plugins to implement multi-step flows (e.g., create area first, then add topic)
   * If not provided, falls back to renderPreview or generic preview
   * @param props Wizard props including data, config, and callbacks
   */
  renderWizard?: (props: AIWizardFlowProps<TDayData, TConfig>) => ReactNode
}

/**
 * Props passed to plugin's wizard flow component
 */
export interface AIWizardFlowProps<TDayData = unknown, TConfig = unknown> {
  /** Parsed data extracted by AI */
  extractedData: Partial<TDayData>
  /** Current plugin configuration */
  config: TConfig | null
  /** Existing day data (for reference) */
  existingDayData: TDayData | null
  /** Callback when wizard completes - pass final data to save */
  onComplete: (data: Partial<TDayData>) => void
  /** Callback to skip this plugin */
  onSkip: () => void
  /** Callback to update plugin config (e.g., add new area) */
  onUpdateConfig: (config: Partial<TConfig>) => Promise<void>
}

/**
 * Data structure for AI preview modal
 * Represents extracted data for a single plugin ready for preview
 */
export interface AIPreviewData {
  /** Plugin identifier */
  pluginId: string
  /** Plugin display name */
  pluginName: string
  /** Plugin icon (emoji) */
  pluginIcon: string
  /** Raw data from AI extraction */
  rawData: Record<string, unknown>
  /** Parsed data in plugin's format */
  parsedData: Record<string, unknown>
  /** Whether this plugin has any extracted data */
  hasData: boolean
}
