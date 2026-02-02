'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { ExecutiveGoalInput } from '../types'

const DEFAULT_COLOR = '#8B5CF6'
const WELCOME_MESSAGE =
  "Hi, I'm Nitya AI. What would you like to build or achieve? Tell me about your goal and we'll shape it together."

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AddExecutiveGoalChatProps {
  onSubmit: (goal: ExecutiveGoalInput) => void | Promise<void>
  onCancel: () => void
  prefilledStartDate?: string
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function AddExecutiveGoalChat({
  onSubmit,
  onCancel,
  prefilledStartDate,
}: AddExecutiveGoalChatProps) {
  const todayISO = getTodayISO()
  const startDate = prefilledStartDate ?? todayISO

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { role: 'assistant', content: WELCOME_MESSAGE },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doneGoal, setDoneGoal] = useState<{
    title: string
    plan: string
    endDate: string
  } | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, doneGoal, scrollToBottom])

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
      const res = await fetch('/api/ai/executive-goal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          todayISO,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed: ${res.status}`)
      }

      const data = await res.json()
      const assistantContent = data.message ?? ''

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantContent }])

      if (data.done && data.goal) {
        setDoneGoal({
          title: data.goal.title,
          plan: data.goal.plan ?? '',
          endDate: data.goal.endDate,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, todayISO])

  const handleCreateGoal = useCallback(async () => {
    if (!doneGoal) return
    setIsCreating(true)
    setError(null)
    try {
      await onSubmit({
        title: doneGoal.title,
        plan: doneGoal.plan || undefined,
        startDate,
        endDate: doneGoal.endDate,
        color: DEFAULT_COLOR,
      })
      onCancel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal')
    } finally {
      setIsCreating(false)
    }
  }, [doneGoal, startDate, onSubmit, onCancel])

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
                ${msg.role === 'user'
                  ? 'bg-[#8B5CF6]/30 text-white'
                  : 'bg-white/[0.06] text-white/90 border border-white/10'
                }
              `}
            >
              {msg.role === 'assistant' && (
                <span className="text-xs text-white/50 block mb-1">Nitya AI</span>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm bg-white/[0.06] text-white/70 border border-white/10">
              <span className="text-xs text-white/50 block mb-1">Nitya AI</span>
              <span className="animate-pulse">...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Done: read-only summary + Create goal */}
        {doneGoal && !isCreating && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
            <h4 className="text-sm font-medium text-white/80">Summary</h4>
            <div className="text-sm text-white/70 space-y-1">
              <p>
                <span className="text-white/50">Title:</span> {doneGoal.title}
              </p>
              <p>
                <span className="text-white/50">Deadline:</span> {doneGoal.endDate}
              </p>
              <p>
                <span className="text-white/50">Start:</span>{' '}
                {startDate === todayISO ? 'Today' : startDate}
              </p>
              {doneGoal.plan && (
                <p className="text-white/60 mt-2 line-clamp-3">{doneGoal.plan}</p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.05] text-white/70 hover:bg-white/[0.1] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateGoal}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all disabled:opacity-50"
              >
                Create goal
              </button>
            </div>
          </div>
        )}

        {isCreating && (
          <div className="text-sm text-white/50">Creating goal...</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input - hide when done and showing summary */}
      {!doneGoal && (
        <div className="flex gap-2 pt-4 border-t border-white/5 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type your message..."
            className="
              flex-1 rounded-xl border border-white/10 bg-white/5
              px-3 py-2.5 text-sm text-white placeholder-white/40
              focus:border-[#8B5CF6]/60 focus:outline-none
            "
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="
              px-4 py-2.5 rounded-xl text-sm font-medium
              bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED]
              text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]
              transition-all disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Send
          </button>
        </div>
      )}
    </div>
  )
}
