import OpenAI from 'openai'

interface TaskForSummary {
  title: string
  endDate: string
  completionNote?: string
}

interface SummarizePayload {
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

export interface SummarizeResult {
  summary: string
  periodLabel: string
  periodStart: string
  periodEnd: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    estimatedCostUsd: number
  }
}

export async function summarizeProgress(payload: unknown): Promise<SummarizeResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const body = payload as SummarizePayload
  const { tasks, periodLabel, periodStart, periodEnd } = body

  if (!tasks || !Array.isArray(tasks) || !periodLabel || !periodStart || !periodEnd) {
    throw new Error('tasks, periodLabel, periodStart, periodEnd required')
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

  return {
    summary,
    periodLabel,
    periodStart,
    periodEnd,
    usage: { promptTokens, completionTokens, totalTokens, estimatedCostUsd },
  }
}
