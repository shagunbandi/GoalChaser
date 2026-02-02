'use client'

import React from 'react'
import { AIChatInterface } from '@/sdk'
import type { PluginChatConfig } from '@/sdk'
import type { ExecutiveGoalInput } from '../types'

const DEFAULT_COLOR = '#8B5CF6'

interface ExecutiveGoalChatResult {
  title: string
  plan: string
  endDate: string
}

interface AddExecutiveGoalChatProps {
  onSubmit: (goal: ExecutiveGoalInput) => void | Promise<void>
  onCancel: () => void
  prefilledStartDate?: string
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function parseGoalFromResponse(content: string): ExecutiveGoalChatResult | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*"done"\s*:\s*true[\s\S]*\}/)
    if (!jsonMatch) return null
    let raw = jsonMatch[0].trim()
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    const parsed = JSON.parse(raw) as {
      done?: boolean
      goal?: { title?: string; plan?: string; endDate?: string }
    }
    if (!parsed.done || !parsed.goal?.title || !parsed.goal?.endDate) return null
    const planText = parsed.goal.plan ?? ''
    if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.goal.endDate)) return null
    return {
      title: String(parsed.goal.title).trim(),
      plan: planText.trim() || parsed.goal.title,
      endDate: parsed.goal.endDate,
    }
  } catch {
    return null
  }
}

const chatConfig: PluginChatConfig<ExecutiveGoalInput, ExecutiveGoalChatResult> = {
  apiEndpoint: '/api/ai/executive-goal-chat',
  welcomeMessage:
    "Hi, I'm Nitya AI. What would you like to build or achieve? Tell me about your goal and we'll shape it together.",

  buildSystemPrompt: ({ todayISO }: { todayISO: string }) => {
    return `You are Nitya AI, a friendly assistant that helps users define executive goals. Today's date is ${todayISO}. Use this date when the user says "today" or when you suggest a deadline (e.g. "3 months from today" or "by end of quarter").

Your job is to interview the user to understand what they want to build or achieve. Ask follow-up questions to clarify until you have:
1. A clear, concise title for the goal
2. A plan (description with phases, e.g. Phase 1: ..., Phase 2: ...) for how to achieve the goal
3. An end date: ask if they have a deadline; if not, suggest a reasonable one based on scope (use ${todayISO} as reference)

Keep responses warm and concise. When you have enough information to finalize the goal, write a final message that summarizes the goal and the phased plan. Then output a single JSON block on its own line with no other text before or after it:
{"done":true,"goal":{"title":"...","plan":"...","endDate":"YYYY-MM-DD"}}

Rules:
- Only output the JSON block when the interview is complete and you have title, plan (with phase plan), and endDate.
- endDate must be in YYYY-MM-DD format.
- plan should include the phase plan (e.g. "Phase 1: Discovery. Phase 2: Build. Phase 3: Launch.").
- If the user has not given enough detail, keep asking; do not output the JSON yet.`
  },

  parseResponse: (content: string) => {
    return parseGoalFromResponse(content)
  },

  renderSummary: (result: ExecutiveGoalChatResult, context?: any) => {
    const todayISO = getTodayISO()
    const startDate = context?.prefilledStartDate ?? todayISO
    return (
      <div className="text-sm text-white/70 space-y-1">
        <p>
          <span className="text-white/50">Title:</span> {result.title}
        </p>
        <p>
          <span className="text-white/50">Deadline:</span> {result.endDate}
        </p>
        <p>
          <span className="text-white/50">Start:</span>{' '}
          {startDate === todayISO ? 'Today' : startDate}
        </p>
        {result.plan && (
          <p className="text-white/60 mt-2 line-clamp-3">{result.plan}</p>
        )}
      </div>
    )
  },

  transformResult: (result: ExecutiveGoalChatResult, context?: any) => {
    const todayISO = getTodayISO()
    const startDate = context?.prefilledStartDate ?? todayISO
    return {
      title: result.title,
      plan: result.plan || undefined,
      startDate,
      endDate: result.endDate,
      color: DEFAULT_COLOR,
    }
  },

  labels: {
    send: 'Send',
    create: 'Create goal',
    cancel: 'Cancel',
  },

  styling: {
    primaryColor: '#8B5CF6',
    secondaryColor: '#7C3AED',
  },
}

export function AddExecutiveGoalChat({
  onSubmit,
  onCancel,
  prefilledStartDate,
}: AddExecutiveGoalChatProps) {
  return (
    <AIChatInterface
      config={chatConfig}
      onSubmit={onSubmit}
      onCancel={onCancel}
      context={{ prefilledStartDate }}
    />
  )
}
