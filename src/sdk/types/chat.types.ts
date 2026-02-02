/**
 * Chat Integration Types
 * Types for plugin-provided chat interfaces (e.g., AI-powered goal creation)
 */

/**
 * A single message in a chat conversation
 */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Response from a chat API call
 */
export interface ChatResponse<TResult = unknown> {
  /** The assistant's message to display */
  message: string
  /** Whether the conversation is complete */
  done?: boolean
  /** Structured result data (if done=true) */
  result?: TResult
}

/**
 * Configuration for a chat integration
 * Plugins provide this to customize the chat behavior
 */
export interface PluginChatConfig<TInput = unknown, TResult = unknown> {
  /**
   * API endpoint to send chat messages to
   * Relative path (e.g., '/api/ai/my-plugin-chat')
   */
  apiEndpoint: string

  /**
   * Welcome message shown when chat starts
   */
  welcomeMessage: string

  /**
   * Build the system prompt for the AI
   * @param context Context data to help build the prompt
   */
  buildSystemPrompt: (context: {
    todayISO: string
    [key: string]: any
  }) => string

  /**
   * Parse the assistant's response to extract structured data
   * @param content Raw assistant response content
   * @returns Parsed result or null if not ready
   */
  parseResponse: (content: string) => TResult | null

  /**
   * Render the summary view when chat is complete
   * @param result The parsed result data
   * @param context Additional context (e.g., prefilled data)
   * @returns React node to display
   */
  renderSummary: (result: TResult, context?: any) => React.ReactNode

  /**
   * Transform the result into the final input for submission
   * @param result Parsed result from chat
   * @param context Additional context (e.g., prefilled data)
   * @returns Final data to submit
   */
  transformResult: (result: TResult, context?: any) => TInput

  /**
   * Optional: Customize button labels
   */
  labels?: {
    send?: string
    create?: string
    cancel?: string
  }

  /**
   * Optional: Customize colors and styling
   */
  styling?: {
    primaryColor?: string
    secondaryColor?: string
  }
}

/**
 * Props for the ChatInterface component
 */
export interface ChatInterfaceProps<TInput = unknown, TResult = unknown> {
  /** Chat configuration provided by the plugin */
  config: PluginChatConfig<TInput, TResult>
  /** Callback when user completes the chat and submits */
  onSubmit: (input: TInput) => void | Promise<void>
  /** Callback when user cancels */
  onCancel: () => void
  /** Optional context data passed to config functions */
  context?: any
}
