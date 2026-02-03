'use client'

import type { ChatInterfaceProps } from '../types/chat.types'

/**
 * Presentational chat UI: displays messages and input, emits events only.
 * No API or AI logic – use AIChatInterface or wire useChat + ChatInterface for AI.
 */
export function ChatInterface<TResult = unknown>({
  messages,
  input,
  onInputChange,
  onSend,
  isLoading = false,
  error = null,
  messagesEndRef,
  placeholder = 'Type your message...',
  assistantLabel = 'Nitya AI',
  labels = {},
  styling = {},
  result = null,
  renderResult,
  onConfirmResult,
  onCancelResult,
  isConfirming = false,
}: ChatInterfaceProps<TResult>) {
  const primaryColor = styling.primaryColor ?? '#8B5CF6'
  const secondaryColor = styling.secondaryColor ?? '#7C3AED'
  const sendLabel = labels.send ?? 'Send'
  const createLabel = labels.create ?? 'Create'
  const cancelLabel = labels.cancel ?? 'Cancel'

  return (
    <div className="flex flex-col h-full min-h-[320px] max-h-[70vh]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[85%] rounded-2xl px-4 py-2.5 text-sm
                ${
                  msg.role === 'user'
                    ? 'text-white'
                    : 'bg-white/[0.06] text-white/90 border border-white/10'
                }
              `}
              style={
                msg.role === 'user'
                  ? { backgroundColor: `${primaryColor}30` }
                  : undefined
              }
            >
              {msg.role === 'assistant' && (
                <span className="text-xs text-white/50 block mb-1">{assistantLabel}</span>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm bg-white/[0.06] text-white/70 border border-white/10">
              <span className="text-xs text-white/50 block mb-1">{assistantLabel}</span>
              <span className="animate-pulse">...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Result Summary (slot for parent/AI layer) */}
        {result != null && renderResult && !isConfirming && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
            <h4 className="text-sm font-medium text-white/80">Summary</h4>
            {renderResult(result)}
            {onConfirmResult != null && onCancelResult != null && (
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onCancelResult}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.05] text-white/70 hover:bg-white/[0.1] transition-colors"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={onConfirmResult}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
                  style={{
                    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                    boxShadow: `0 0 20px ${primaryColor}30`,
                  }}
                >
                  {createLabel}
                </button>
              </div>
            )}
          </div>
        )}

        {isConfirming && <div className="text-sm text-white/50">Creating...</div>}

        <div ref={messagesEndRef} />
      </div>

      {/* Input – hide when showing result */}
      {result == null && (
        <div className="flex gap-2 pt-4 border-t border-white/5 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
            placeholder={placeholder}
            className="
              flex-1 rounded-xl border border-white/10 bg-white/5
              px-3 py-2.5 text-sm text-white placeholder-white/40
              focus:outline-none
            "
            style={{ borderColor: `${primaryColor}60` }}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!input.trim() || isLoading}
            className="
              px-4 py-2.5 rounded-xl text-sm font-medium
              text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed
            "
            style={{
              background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
              boxShadow: `0 0 20px ${primaryColor}30`,
            }}
          >
            {sendLabel}
          </button>
        </div>
      )}
    </div>
  )
}
