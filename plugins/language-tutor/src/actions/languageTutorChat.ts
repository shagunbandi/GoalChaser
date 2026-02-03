import OpenAI from 'openai'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatPayload {
  messages: ChatMessage[]
  systemPrompt?: string
  todayISO: string
  context?: Record<string, unknown>
}

interface ChatResultLearning {
  knownLanguages: string[]
  targetLanguage: string
  objectives: string
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced'
  endDate: string
}

export interface LanguageTutorChatResult {
  message: string
  done?: boolean
  result?: ChatResultLearning
  learning?: ChatResultLearning
}

let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

function buildSystemPrompt(todayISO: string): string {
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
}

function parseLearningFromResponse(content: string): ChatResultLearning | null {
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
    
    const { knownLanguages, targetLanguage, proficiencyLevel, objectives, endDate } = parsed.learning
    
    // Validate required fields
    if (!Array.isArray(knownLanguages) || knownLanguages.length === 0) return null
    if (!targetLanguage || typeof targetLanguage !== 'string') return null
    if (!proficiencyLevel || !['beginner', 'intermediate', 'advanced'].includes(proficiencyLevel)) return null
    if (!objectives || typeof objectives !== 'string') return null
    if (!endDate || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return null
    
    return {
      knownLanguages: knownLanguages.map(String),
      targetLanguage: String(targetLanguage),
      proficiencyLevel: proficiencyLevel as 'beginner' | 'intermediate' | 'advanced',
      objectives: String(objectives),
      endDate: String(endDate),
    }
  } catch {
    return null
  }
}

export async function languageTutorChat(payload: unknown): Promise<LanguageTutorChatResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const body = payload as ChatPayload
  const { messages, systemPrompt: clientSystemPrompt, todayISO } = body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new Error('messages array is required')
  }

  if (!todayISO || typeof todayISO !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(todayISO)) {
    throw new Error('todayISO is required (YYYY-MM-DD)')
  }

  const openai = getOpenAI()
  const systemPrompt = clientSystemPrompt || buildSystemPrompt(todayISO)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ],
    temperature: 0.7,
    max_tokens: 800,
  })

  const content = completion.choices[0]?.message?.content?.trim() ?? ''
  const learning = parseLearningFromResponse(content)
  const messageText = content.replace(/\{[\s\S]*"done"\s*:\s*true[\s\S]*\}/, '').trim() || content

  const response: LanguageTutorChatResult = { message: messageText }
  if (learning) {
    response.done = true
    response.result = learning
    response.learning = learning
  }
  return response
}
