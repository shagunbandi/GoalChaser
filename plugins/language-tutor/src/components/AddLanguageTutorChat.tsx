'use client'

import React from 'react'
import { AIChatInterface } from '@goal-chaser/sdk'
import type { PluginChatConfig } from '@goal-chaser/sdk'
import type { LanguageLearningInput, LearningMetadata } from '../types'

const DEFAULT_COLOR = '#8B5CF6'

interface LanguageTutorChatResult {
  knownLanguages: string[]
  targetLanguage: string
  objectives: string
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced'
  endDate: string
}

interface AddLanguageTutorChatProps {
  onSubmit: (learning: LanguageLearningInput) => void | Promise<void>
  onCancel: () => void
  prefilledStartDate?: string
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function parseLearningFromResponse(
  content: string,
): LanguageTutorChatResult | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*"done"\s*:\s*true[\s\S]*\}/)
    if (!jsonMatch) return null
    let raw = jsonMatch[0].trim()
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    const parsed = JSON.parse(raw) as {
      done?: boolean
      learning?: {
        knownLanguages?: unknown
        targetLanguage?: string
        proficiencyLevel?: string
        objectives?: string
        endDate?: string
      }
    }
    if (!parsed.done || !parsed.learning) return null

    const {
      knownLanguages,
      targetLanguage,
      proficiencyLevel,
      objectives,
      endDate,
    } = parsed.learning

    if (!Array.isArray(knownLanguages) || knownLanguages.length === 0)
      return null
    if (!targetLanguage || typeof targetLanguage !== 'string') return null
    if (
      !proficiencyLevel ||
      !['beginner', 'intermediate', 'advanced'].includes(proficiencyLevel)
    )
      return null
    if (!objectives || typeof objectives !== 'string') return null
    if (!endDate || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return null

    return {
      knownLanguages: knownLanguages.map(String),
      targetLanguage: String(targetLanguage),
      proficiencyLevel: proficiencyLevel as
        | 'beginner'
        | 'intermediate'
        | 'advanced',
      objectives: String(objectives),
      endDate: String(endDate),
    }
  } catch {
    return null
  }
}

const chatConfig: PluginChatConfig<
  LanguageLearningInput,
  LanguageTutorChatResult
> = {
  apiEndpoint: '/api/plugin-action',
  pluginAction: { pluginId: 'languageTutor', action: 'chat' },
  welcomeMessage:
    "Hi, I'm Nitya AI, your language learning assistant! Let's set up your language learning journey. What language would you like to learn?",

  buildSystemPrompt: ({ todayISO }: { todayISO: string }) => {
    return `You are Nitya AI, a friendly language learning assistant that helps users set up their language learning journey. Today's date is ${todayISO}. Use this date when the user says "today" or when you suggest a learning period end date.

Your job is to interview the user to understand their language learning goals. Ask follow-up questions to clarify until you have:
1. Known languages: What languages do they already know? (as an array, e.g., ["English", "Hindi"])
2. Target language: What language do they want to learn? (single language as a string)
3. Proficiency level: What's their current level? (beginner, intermediate, or advanced)
4. Objectives: What are their specific learning goals?
5. End date: When do they want to reach their goal? If not mentioned, suggest a reasonable timeline (3-6 months for beginners, use ${todayISO} as reference)

Keep responses warm, encouraging, and concise. When you have enough information to finalize the learning setup, write a final message that summarizes the learning plan. Then output a single JSON block on its own line with no other text before or after it:
{"done":true,"learning":{"knownLanguages":["..."],"targetLanguage":"...","proficiencyLevel":"beginner|intermediate|advanced","objectives":"...","endDate":"YYYY-MM-DD"}}

Rules:
- Only output the JSON block when the interview is complete and you have all required information.
- endDate must be in YYYY-MM-DD format.
- knownLanguages must be an array of strings.
- targetLanguage must be a single string.
- proficiencyLevel must be one of: "beginner", "intermediate", "advanced".
- If the user has not given enough detail, keep asking; do not output the JSON yet.
- Be encouraging and supportive about their language learning journey.`
  },

  parseResponse: (content: string) => {
    return parseLearningFromResponse(content)
  },

  renderSummary: (result: LanguageTutorChatResult, context?: any) => {
    const todayISO = getTodayISO()
    const startDate = context?.prefilledStartDate ?? todayISO
    return (
      <div className="text-sm text-white/70 space-y-1">
        <p>
          <span className="text-white/50">Target:</span> {result.targetLanguage}
        </p>
        <p>
          <span className="text-white/50">Known:</span>{' '}
          {result.knownLanguages.join(', ')}
        </p>
        <p>
          <span className="text-white/50">Level:</span>{' '}
          {result.proficiencyLevel.charAt(0).toUpperCase() +
            result.proficiencyLevel.slice(1)}
        </p>
        <p>
          <span className="text-white/50">Target date:</span> {result.endDate}
        </p>
        <p>
          <span className="text-white/50">Start:</span>{' '}
          {startDate === todayISO ? 'Today' : startDate}
        </p>
        {result.objectives && (
          <p className="text-white/60 mt-2 line-clamp-3">{result.objectives}</p>
        )}
      </div>
    )
  },

  transformResult: (result: LanguageTutorChatResult, context?: any) => {
    const todayISO = getTodayISO()
    const startDate = context?.prefilledStartDate ?? todayISO

    // Initialize metadata with curriculum structure
    const metadata: LearningMetadata = {
      proficiencyLevel: result.proficiencyLevel,
      currentTopic: 'Greetings & Basics', // Start with greetings
      completedTopics: [],
      topicProgress: {},
      problematicWords: [],
      problematicSentences: [],
      masteredConcepts: [],
      topicsNeedReview: [],
    }

    return {
      knownLanguages: result.knownLanguages,
      targetLanguage: result.targetLanguage,
      objectives: result.objectives,
      startDate,
      endDate: result.endDate,
      metadata,
      color: DEFAULT_COLOR,
    }
  },

  labels: {
    send: 'Send',
    create: 'Create Learning',
    cancel: 'Cancel',
  },

  styling: {
    primaryColor: '#8B5CF6',
    secondaryColor: '#7C3AED',
  },
}

export function AddLanguageTutorChat({
  onSubmit,
  onCancel,
  prefilledStartDate,
}: AddLanguageTutorChatProps) {
  return (
    <AIChatInterface
      config={chatConfig}
      onSubmit={onSubmit}
      onCancel={onCancel}
      context={{ prefilledStartDate }}
    />
  )
}
