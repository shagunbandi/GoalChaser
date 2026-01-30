import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const LAST_DAYS = 20

interface CompletedTaskInput {
  title: string
  endDate: string
  completionNote?: string
}

interface ProgressSoFarEntry {
  periodLabel: string
  periodStart: string
  periodEnd: string
  summary: string
}

interface GenerateTasksRequest {
  planText: string
  progressSoFar: ProgressSoFarEntry[]
  completedTasks: CompletedTaskInput[]
  date: string
  existingTasksForDay: string[]
  goalStartDate: string
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function getLast20DaysTasks(
  completedTasks: CompletedTaskInput[],
  date: string
): CompletedTaskInput[] {
  const cutoff = addDays(date, -(LAST_DAYS - 1))
  return completedTasks
    .filter((t) => t.endDate >= cutoff && t.endDate <= date)
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
}

/** Find the oldest 20-day block (ending before last-20 window) that has tasks but no summary */
function findUnsummarizedBlock(
  goalStartDate: string,
  date: string,
  completedTasks: CompletedTaskInput[],
  progressSoFar: ProgressSoFarEntry[]
): { periodStart: string; periodEnd: string; periodLabel: string; tasks: CompletedTaskInput[] } | null {
  const last20Start = addDays(date, -(LAST_DAYS - 1))
  let periodStart = goalStartDate
  while (periodStart < last20Start) {
    const periodEnd = addDays(periodStart, LAST_DAYS - 1)
    if (periodEnd >= last20Start) break
    const hasSummary = progressSoFar.some(
      (s) => s.periodStart === periodStart && s.periodEnd === periodEnd
    )
    const periodTasks = completedTasks.filter(
      (t) => t.endDate >= periodStart && t.endDate <= periodEnd
    )
    if (periodTasks.length > 0 && !hasSummary) {
      const idx = Math.floor(
        (new Date(periodStart).getTime() - new Date(goalStartDate).getTime()) /
          (LAST_DAYS * 24 * 60 * 60 * 1000)
      ) + 1
      return {
        periodStart,
        periodEnd,
        periodLabel: `Days ${idx * LAST_DAYS - LAST_DAYS + 1}-${idx * LAST_DAYS}`,
        tasks: periodTasks,
      }
    }
    periodStart = addDays(periodStart, LAST_DAYS)
  }
  return null
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

    const body = (await request.json()) as GenerateTasksRequest
    const {
      planText,
      progressSoFar = [],
      completedTasks = [],
      date,
      existingTasksForDay = [],
      goalStartDate,
    } = body

    if (!planText || !date || !goalStartDate) {
      return NextResponse.json(
        { error: 'planText, date, goalStartDate required' },
        { status: 400 }
      )
    }

    const sortedCompleted = [...completedTasks].sort((a, b) =>
      b.endDate.localeCompare(a.endDate)
    )
    const last20 = getLast20DaysTasks(sortedCompleted, date)
    const unsummarized = findUnsummarizedBlock(
      goalStartDate,
      date,
      sortedCompleted,
      progressSoFar
    )

    let newSummary: ProgressSoFarEntry | null = null
    let summarizeUsage: { promptTokens: number; completionTokens: number; totalTokens: number; estimatedCostUsd: number } | undefined
    if (unsummarized && unsummarized.tasks.length > 0) {
      const base = new URL(request.url).origin
      const summarizeRes = await fetch(
        `${base}/api/ai/summarize-executive-progress`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tasks: unsummarized.tasks,
            periodLabel: unsummarized.periodLabel,
            periodStart: unsummarized.periodStart,
            periodEnd: unsummarized.periodEnd,
          }),
        }
      )
      if (summarizeRes.ok) {
        const data = await summarizeRes.json()
        newSummary = {
          periodLabel: data.periodLabel,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          summary: data.summary || '',
        }
        if (data.usage) {
          summarizeUsage = data.usage
        }
      }
    }

    const progressText =
      progressSoFar.length === 0 && !newSummary
        ? 'No prior progress summaries.'
        : [
            ...progressSoFar.map(
              (s) => `[${s.periodLabel}] ${s.summary}`
            ),
            ...(newSummary ? [`[${newSummary.periodLabel}] ${newSummary.summary}`] : []),
          ].join('\n\n')

    const last20Text =
      last20.length === 0
        ? 'No completed tasks in the last 20 days.'
        : last20
            .map(
              (t) =>
                `- "${t.title}" (${t.endDate}): ${(t.completionNote || 'No note').slice(0, 250)}`
            )
            .join('\n')

    const existingText =
      existingTasksForDay.length === 0
        ? 'None'
        : existingTasksForDay.map((t) => `"${t}"`).join(', ')

    const systemPrompt = `You suggest concrete next tasks for an executive goal in phase order (Phase 1 before Phase 2, etc.).

Prefer suggesting Phase 1 tasks until progress shows Phase 1 is substantially complete; only then suggest Phase 2. Phase 1 (or any phase) may take longer than originally planned—e.g. 30, 40, 60 or more days—so keep suggesting Phase 1 tasks for as long as they are still the logical next steps based on what's been done. Move to Phase 2 only when the progress summaries and completed tasks indicate Phase 1 is done or nearly done, not based on calendar days. If the user struggled somewhere (see completion notes), suggest follow-up or adjustment within the same phase first.

Given the goal's plan, progress so far (summaries + last 20 days of completed tasks with completion notes), and the date, suggest 3-5 tasks for that date. If there are existing tasks for the day, suggest additional ones (no duplicates). Label each task with "Phase 1", "Phase 2", etc. to match the plan.

For each task, include a short "howToAchieve" (1-2 sentences) that gives the user clear direction on how to accomplish it—e.g. concrete steps, where to look, or what to do first. This helps the user know how to get started.

Respond ONLY with a JSON object: { "tasks": [ { "title": "...", "phase": "Phase 1" or "Phase 2" etc., "howToAchieve": "1-2 sentences on how to achieve this task" } ] }.`

    const userPrompt = `Goal plan:
${planText}

Progress summaries (older than last 20 days):
${progressText}

Last 20 days of completed tasks (with completion notes):
${last20Text}

Date to suggest tasks for: ${date}
Existing tasks for that day: ${existingText}

Return JSON: { "tasks": [ { "title": "...", "phase": "Phase 1" or "Phase 2" etc., "howToAchieve": "1-2 sentences on how to achieve this task" } ] }`

    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? '{}'
    let tasks: { title: string; phase?: string; howToAchieve?: string }[] = []
    try {
      const parsed = JSON.parse(raw) as {
        tasks?: { title?: string; phase?: string; howToAchieve?: string }[]
      }
      if (Array.isArray(parsed.tasks)) {
        tasks = parsed.tasks
          .filter((t) => t && typeof t.title === 'string' && t.title.trim())
          .map((t) => ({
            title: String(t.title).trim(),
            phase: t.phase,
            howToAchieve: typeof t.howToAchieve === 'string' ? t.howToAchieve.trim() : undefined,
          }))
      }
    } catch {
      console.error('[generate-executive-tasks] Parse failed:', raw)
    }

    const usage = completion.usage
    const promptTokens = usage?.prompt_tokens ?? 0
    const completionTokens = usage?.completion_tokens ?? 0
    const totalTokens = usage?.total_tokens ?? 0
    const estimatedCostUsd =
      (promptTokens * 0.15) / 1_000_000 + (completionTokens * 0.6) / 1_000_000

    const genUsage = { promptTokens, completionTokens, totalTokens, estimatedCostUsd }
    const totalPromptTokens = promptTokens + (summarizeUsage?.promptTokens ?? 0)
    const totalCompletionTokens = completionTokens + (summarizeUsage?.completionTokens ?? 0)
    const totalEstimatedCostUsd =
      estimatedCostUsd + (summarizeUsage?.estimatedCostUsd ?? 0)

    const response: {
      newSummary: ProgressSoFarEntry | null
      tasks: { title: string; phase?: string; howToAchieve?: string }[]
      usage: { promptTokens: number; completionTokens: number; totalTokens: number; estimatedCostUsd: number }
      totalUsage: { promptTokens: number; completionTokens: number; totalTokens: number; estimatedCostUsd: number }
      summarizeUsage?: { promptTokens: number; completionTokens: number; totalTokens: number; estimatedCostUsd: number }
      promptsUsed?: { system: string; user: string }
    } = {
      newSummary,
      tasks,
      usage: genUsage,
      totalUsage: {
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        totalTokens: totalPromptTokens + totalCompletionTokens,
        estimatedCostUsd: totalEstimatedCostUsd,
      },
      promptsUsed: { system: systemPrompt, user: userPrompt },
    }

    if (newSummary && summarizeUsage) {
      response.summarizeUsage = summarizeUsage
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[generate-executive-tasks] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
