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
 * Props for the presentational ChatInterface (display + emits only, no AI/API)
 */
export interface ChatInterfaceProps<TResult = unknown> {
  /** Messages to display */
  messages: ChatMessage[]
  /** Current input value */
  input: string
  /** Called when input changes */
  onInputChange: (value: string) => void
  /** Called when user sends a message (e.g. Send clicked or Enter) */
  onSend: () => void
  /** Whether a request is in progress */
  isLoading?: boolean
  /** Error message to display */
  error?: string | null
  /** Ref for auto-scrolling to bottom */
  messagesEndRef?: React.RefObject<HTMLDivElement | null>
  /** Placeholder for the input */
  placeholder?: string
  /** Label for assistant messages (e.g. "Nitya AI") */
  assistantLabel?: string
  /** Button/label text */
  labels?: {
    send?: string
    create?: string
    cancel?: string
  }
  /** Colors for user bubbles and buttons */
  styling?: {
    primaryColor?: string
    secondaryColor?: string
  }
  /** When set, show result summary block with Confirm/Cancel (e.g. after AI returns structured result) */
  result?: TResult | null
  /** Render the result summary (used when result is set) */
  renderResult?: (result: TResult) => React.ReactNode
  /** Called when user confirms the result (e.g. Create) */
  onConfirmResult?: () => void
  /** Called when user cancels from result view */
  onCancelResult?: () => void
  /** Whether confirm action is in progress */
  isConfirming?: boolean
}

/**
 * Props for the AI-powered AIChatInterface (uses useChat + ChatInterface)
 */
export interface AIChatInterfaceProps<TInput = unknown, TResult = unknown> {
  /** Chat configuration (API, prompts, parsing, etc.) */
  config: PluginChatConfig<TInput, TResult>
  /** Callback when user completes the chat and submits */
  onSubmit: (input: TInput) => void | Promise<void>
  /** Callback when user cancels */
  onCancel: () => void
  /** Optional context data passed to config functions */
  context?: any
}
