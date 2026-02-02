import { useState, useCallback, useRef, useEffect } from 'react'
import type { ChatMessage, ChatResponse } from '../types/chat.types'

export interface UseChatOptions<TResult = unknown> {
  /** API endpoint to send messages to */
  apiEndpoint: string
  /** Initial welcome message */
  welcomeMessage: string
  /** Build system prompt from context */
  buildSystemPrompt: (context: { todayISO: string; [key: string]: any }) => string
  /** Parse response to extract result */
  parseResponse: (content: string) => TResult | null
  /** Optional context data */
  context?: any
}

export interface UseChatReturn<TResult = unknown> {
  /** Chat messages */
  messages: ChatMessage[]
  /** Current input value */
  input: string
  /** Set input value */
  setInput: (value: string) => void
  /** Loading state */
  isLoading: boolean
  /** Error message */
  error: string | null
  /** Parsed result when done */
  result: TResult | null
  /** Send current input as message */
  sendMessage: () => Promise<void>
  /** Ref for auto-scrolling */
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Hook for managing chat state and API interactions
 * Generic, reusable across all plugins
 */
export function useChat<TResult = unknown>(
  options: UseChatOptions<TResult>
): UseChatReturn<TResult> {
  const {
    apiEndpoint,
    welcomeMessage,
    buildSystemPrompt,
    parseResponse,
    context = {},
  } = options

  const todayISO = getTodayISO()
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { role: 'assistant', content: welcomeMessage },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TResult | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, result, scrollToBottom])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setInput('')
    setError(null)
    const userMessage: ChatMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const nextMessages = [...messages, userMessage]
      const systemPrompt = buildSystemPrompt({ todayISO, ...context })

      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          systemPrompt,
          todayISO,
          context,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed: ${res.status}`)
      }

      const data: ChatResponse<TResult> = await res.json()
      const assistantContent = data.message ?? ''

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantContent }])

      if (data.done && data.result) {
        setResult(data.result)
      } else {
        // Try parsing even if server didn't set done flag
        const parsed = parseResponse(assistantContent)
        if (parsed) {
          setResult(parsed)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, todayISO, context, apiEndpoint, buildSystemPrompt, parseResponse])

  return {
    messages,
    input,
    setInput,
    isLoading,
    error,
    result,
    sendMessage,
    messagesEndRef,
  }
}
