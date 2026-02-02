import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface TaskForSummary {
  title: string
  endDate: string
  completionNote?: string
}

interface SummarizeRequest {
  tasks: TaskForSummary[]
  periodLabel: string
  periodStart: string
  periodEnd: string
}

let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const body = (await request.json()) as SummarizeRequest
    const { tasks, periodLabel, periodStart, periodEnd } = body

    if (!tasks || !Array.isArray(tasks) || !periodLabel || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'tasks, periodLabel, periodStart, periodEnd required' },
        { status: 400 }
      )
    }

    const taskLines = tasks
      .map(
        (t) =>
          `- "${t.title}" (${t.endDate}): ${(t.completionNote || 'No note').slice(0, 300)}`
      )
      .join('\n')

    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You summarize completed tasks into one short paragraph (2-4 sentences). Capture what was done and how it went (from completion notes). Output only the paragraph, no JSON.',
        },
        {
          role: 'user',
          content: `Summarize these completed tasks for ${periodLabel} (${periodStart} to ${periodEnd}):\n\n${taskLines}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    })

    const summary = completion.choices[0]?.message?.content?.trim() ?? ''
    const usage = completion.usage
    const promptTokens = usage?.prompt_tokens ?? 0
    const completionTokens = usage?.completion_tokens ?? 0
    const totalTokens = usage?.total_tokens ?? 0
    const estimatedCostUsd =
      (promptTokens * 0.15) / 1_000_000 + (completionTokens * 0.6) / 1_000_000

    return NextResponse.json({
      summary,
      periodLabel,
      periodStart,
      periodEnd,
      usage: { promptTokens, completionTokens, totalTokens, estimatedCostUsd },
    })
  } catch (error) {
    console.error('[summarize-executive-progress] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
