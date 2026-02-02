'use client'

import { useState, useCallback } from 'react'
import { useChat } from '../hooks/useChat'
import { ChatInterface } from './ChatInterface'
import type { AIChatInterfaceProps } from '../types/chat.types'

/**
 * AI-powered chat: wires useChat (API, parsing, state) to ChatInterface (UI).
 * Use ChatInterface directly when you only need to display chat and handle sends via emits.
 */
export function AIChatInterface<TInput = unknown, TResult = unknown>({
  config,
  onSubmit,
  onCancel,
  context = {},
}: AIChatInterfaceProps<TInput, TResult>) {
  const {
    apiEndpoint,
    welcomeMessage,
    buildSystemPrompt,
    parseResponse,
    renderSummary,
    transformResult,
    labels = {},
    styling = {},
  } = config

  const [isCreating, setIsCreating] = useState(false)

  const {
    messages,
    input,
    setInput,
    isLoading,
    error,
    result,
    sendMessage,
    messagesEndRef,
  } = useChat<TResult>({
    apiEndpoint,
    welcomeMessage,
    buildSystemPrompt,
    parseResponse,
    context,
  })

  const handleConfirmResult = useCallback(async () => {
    if (!result) return
    setIsCreating(true)
    try {
      const finalInput = transformResult(result, context)
      await onSubmit(finalInput)
      onCancel()
    } catch (err) {
      console.error('[AIChatInterface] Submit failed:', err)
    } finally {
      setIsCreating(false)
    }
  }, [result, context, transformResult, onSubmit, onCancel])

  return (
    <ChatInterface<TResult>
      messages={messages}
      input={input}
      onInputChange={setInput}
      onSend={sendMessage}
      isLoading={isLoading}
      error={error}
      messagesEndRef={messagesEndRef}
      placeholder="Type your message..."
      assistantLabel="Nitya AI"
      labels={labels}
      styling={{
        primaryColor: styling.primaryColor ?? '#8B5CF6',
        secondaryColor: styling.secondaryColor ?? '#7C3AED',
      }}
      result={result}
      renderResult={result ? (r) => renderSummary(r, context) : undefined}
      onConfirmResult={handleConfirmResult}
      onCancelResult={onCancel}
      isConfirming={isCreating}
    />
  )
}
