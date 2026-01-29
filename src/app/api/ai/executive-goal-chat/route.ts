import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ExecutiveGoalChatRequest {
  messages: ChatMessage[]
  todayISO: string
}

interface ExecutiveGoalChatResponse {
  message: string
  done?: boolean
  goal?: {
    title: string
    plan: string
    endDate: string
  }
}

let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

function buildSystemPrompt(todayISO: string): string {
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
}

function parseGoalFromResponse(content: string): ExecutiveGoalChatResponse['goal'] | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*"done"\s*:\s*true[\s\S]*\}/)
    if (!jsonMatch) return null
    let raw = jsonMatch[0].trim()
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    const parsed = JSON.parse(raw) as { done?: boolean; goal?: { title?: string; plan?: string; endDate?: string } }
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

export async function POST(
  request: NextRequest
): Promise<NextResponse<ExecutiveGoalChatResponse | { error: string }>> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const body = (await request.json()) as ExecutiveGoalChatRequest
    const { messages, todayISO } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages array is required' },
        { status: 400 }
      )
    }

    if (!todayISO || typeof todayISO !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(todayISO)) {
      return NextResponse.json(
        { error: 'todayISO is required (YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    const openai = getOpenAI()
    const systemPrompt = buildSystemPrompt(todayISO)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ],
      temperature: 0.6,
      max_tokens: 800,
    })

    const content = completion.choices[0]?.message?.content?.trim() ?? ''
    const goal = parseGoalFromResponse(content)
    const messageText = content.replace(/\{[\s\S]*"done"\s*:\s*true[\s\S]*\}/, '').trim() || content

    const response: ExecutiveGoalChatResponse = {
      message: messageText,
    }
    if (goal) {
      response.done = true
      response.goal = goal
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[executive-goal-chat] Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
