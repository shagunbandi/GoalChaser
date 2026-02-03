import OpenAI from 'openai'
import type { LearningMetadata } from '../types'

interface GenerateLearningPayload {
  targetLanguage: string
  knownLanguages: string[]
  metadata: LearningMetadata
  date: string
  objectives?: string
}

export interface GenerateLearningResult {
  teachingContent: string
  topicTaught: string
  vocabTaught: string[]
  grammarCovered: string[]
  phrasesTaught: string[]
  qna: {
    questions: Array<{
      question: string
      options: Array<{
        text: string
        isCorrect: boolean
        explanation: string
      }>
    }>
  }
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    estimatedCostUsd: number
  }
}

let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

export async function generateLearning(payload: unknown): Promise<GenerateLearningResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const body = payload as GenerateLearningPayload
  const { targetLanguage, knownLanguages, metadata, date, objectives } = body

  if (!targetLanguage || !knownLanguages || !metadata || !date) {
    throw new Error('targetLanguage, knownLanguages, metadata, and date are required')
  }

  const knownLangsText = knownLanguages.join(', ')
  const proficiencyLevel = metadata.proficiencyLevel || 'beginner'
  const currentTopic = metadata.currentTopic || 'Greetings & Basics'
  const completedTopics = metadata.completedTopics || []
  const topicProgress = metadata.topicProgress || {}

  // Smart context passing: detailed history for current topic, just names for completed
  const currentTopicProgress = topicProgress[currentTopic]
  let topicContextText = ''
  
  if (currentTopicProgress) {
    // Continuing same topic - provide detailed history
    const vocabList = currentTopicProgress.vocabTaught?.join(', ') || 'None yet'
    const grammarList = currentTopicProgress.grammarCovered?.join(', ') || 'None yet'
    const phrasesList = currentTopicProgress.phrasesTaught?.join(', ') || 'None yet'
    
    topicContextText = `
CURRENT TOPIC: "${currentTopic}" (Lesson ${(currentTopicProgress.lessonsCompleted || 0) + 1})
Previously taught in this topic:
- Vocabulary: ${vocabList}
- Grammar: ${grammarList}
- Phrases: ${phrasesList}
Last taught: ${currentTopicProgress.lastTaughtDate}

⚠️ IMPORTANT: Do NOT repeat the above content. Build on it with NEW material.`
  } else {
    // New topic - just show what's been completed before
    topicContextText = `
CURRENT TOPIC: "${currentTopic}" (Lesson 1 - NEW TOPIC)
Previously completed topics: ${completedTopics.length > 0 ? completedTopics.join(', ') : 'None - this is the first topic'}`
  }

  // Build context from metadata
  const problematicWordsText =
    metadata.problematicWords?.length > 0
      ? `Problematic words: ${metadata.problematicWords.slice(0, 10).join(', ')}`
      : 'No problematic words tracked yet.'

  const problematicSentencesText =
    metadata.problematicSentences?.length > 0
      ? `Problematic patterns: ${metadata.problematicSentences.slice(0, 5).join('; ')}`
      : 'No problematic patterns tracked yet.'

  const masteredConceptsText =
    metadata.masteredConcepts?.length > 0
      ? `Mastered concepts: ${metadata.masteredConcepts.join(', ')}`
      : 'No mastered concepts yet.'

  const topicsNeedReviewText =
    metadata.topicsNeedReview?.length > 0
      ? `Topics needing review: ${metadata.topicsNeedReview.join(', ')}`
      : 'No topics flagged for review.'

  const objectivesText = objectives
    ? `\nLearning objectives: ${objectives}`
    : ''

  const systemPrompt = `You are an expert language teacher helping a student learn to SPEAK ${targetLanguage}. The student knows ${knownLangsText} and is at ${proficiencyLevel} level in ${targetLanguage}.

CRITICAL: This tool is designed to help students learn to SPEAK ${targetLanguage}, not read or write it. The student cannot read ${targetLanguage} script yet.

Your task is to create a structured curriculum lesson with teaching content and a quiz.

${topicContextText}

Student's overall progress:
${masteredConceptsText}
${topicsNeedReviewText}
${problematicWordsText}
${problematicSentencesText}${objectivesText}

Instructions:
1. Create teaching content (200-400 words) appropriate for ${proficiencyLevel} level. Focus on topics that need review if any, otherwise introduce new concepts that build on mastered ones.

2. **LANGUAGE RULES** (STRICTLY FOLLOW):
   - Write ALL teaching content ONLY in ${knownLangsText}
   - NEVER write sentences or paragraphs in ${targetLanguage} script
   - When teaching ${targetLanguage} words/phrases:
     * Write them in ROMAN/ENGLISH transliteration (e.g., "namaste" not "नमस्ते")
     * Include pronunciation guides using ${knownLangsText}
     * Provide English/known language translations
     * Example: "The word 'namaste' (nuh-muh-STAY) means 'hello' or 'greetings'"
   
3. TEACHING CONTENT STRUCTURE:
   - Explain grammar concepts in ${knownLangsText}
   - Teach vocabulary with transliterations and pronunciations
   - Provide spoken conversation examples with transliterations
   - Focus on phonetics, pronunciation, and spoken patterns
   - Example: Instead of writing Telugu script, write: "To say 'How are you?', use 'meeru ela unnaru?' (MEE-roo EH-lah OON-nah-roo)"

4. Generate 5 multiple-choice questions to test understanding. Each question must have:
   - 4 options (only one correct)
   - Detailed explanation for EACH option (why it's correct or incorrect)
   - Questions should test the teaching content
   - Questions in ${knownLangsText}, ${targetLanguage} words in transliteration only

5. Adapt difficulty to ${proficiencyLevel} level:
   - Beginner: Basic vocabulary, simple greetings, present tense, basic pronunciation
   - Intermediate: Complex sentences, multiple tenses, idiomatic expressions, conversation flow
   - Advanced: Nuanced grammar, advanced vocabulary, cultural context, natural speech patterns

Respond ONLY with a JSON object in this exact format:
{
  "teachingContent": "The lesson text here IN ${knownLangsText} ONLY with transliterations...",
  "topicTaught": "${currentTopic}",
  "vocabTaught": ["word1 (pronunciation) - meaning", "word2 (pronunciation) - meaning"],
  "grammarCovered": ["grammar concept 1", "grammar concept 2"],
  "phrasesTaught": ["phrase1 (pronunciation) - meaning", "phrase2 (pronunciation) - meaning"],
  "questions": [
    {
      "question": "Question text IN ${knownLangsText}?",
      "options": [
        {"text": "Option A", "isCorrect": false, "explanation": "Why this is incorrect..."},
        {"text": "Option B", "isCorrect": true, "explanation": "Why this is correct..."},
        {"text": "Option C", "isCorrect": false, "explanation": "Why this is incorrect..."},
        {"text": "Option D", "isCorrect": false, "explanation": "Why this is incorrect..."}
      ]
    }
  ]
}

IMPORTANT: Fill vocabTaught, grammarCovered, and phrasesTaught arrays with the specific content you taught in this lesson. This will be used to track progress and avoid repetition in future lessons.`

  const userPrompt = `Generate a ${proficiencyLevel} level ${targetLanguage} lesson for ${date}. The student knows ${knownLangsText}.

TOPIC: "${currentTopic}"
${currentTopicProgress ? `This is a continuation lesson. Build on previously taught content with NEW material.` : `This is the FIRST lesson in this topic. Start with foundational concepts.`}

Focus areas if any:
${topicsNeedReviewText}

Return JSON only with all required fields including vocabTaught, grammarCovered, and phrasesTaught arrays.`

  const openai = getOpenAI()
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0]?.message?.content?.trim() ?? '{}'
  let teachingContent = ''
  let topicTaught = currentTopic
  let vocabTaught: string[] = []
  let grammarCovered: string[] = []
  let phrasesTaught: string[] = []
  let questions: Array<{
    question: string
    options: Array<{ text: string; isCorrect: boolean; explanation: string }>
  }> = []

  try {
    const parsed = JSON.parse(raw) as {
      teachingContent?: string
      topicTaught?: string
      vocabTaught?: string[]
      grammarCovered?: string[]
      phrasesTaught?: string[]
      questions?: Array<{
        question?: string
        options?: Array<{
          text?: string
          isCorrect?: boolean
          explanation?: string
        }>
      }>
    }

    teachingContent = parsed.teachingContent || 'Teaching content could not be generated.'
    topicTaught = parsed.topicTaught || currentTopic
    vocabTaught = Array.isArray(parsed.vocabTaught) ? parsed.vocabTaught : []
    grammarCovered = Array.isArray(parsed.grammarCovered) ? parsed.grammarCovered : []
    phrasesTaught = Array.isArray(parsed.phrasesTaught) ? parsed.phrasesTaught : []

    if (Array.isArray(parsed.questions)) {
      questions = parsed.questions
        .filter((q) => q && q.question && Array.isArray(q.options))
        .map((q, qIdx) => ({
          question: String(q.question),
          options: q.options!
            .filter(
              (opt) =>
                opt &&
                typeof opt.text === 'string' &&
                typeof opt.isCorrect === 'boolean' &&
                typeof opt.explanation === 'string'
            )
            .map((opt, optIdx) => ({
              text: String(opt.text),
              isCorrect: Boolean(opt.isCorrect),
              explanation: String(opt.explanation),
            })),
        }))
        .filter((q) => q.options.length === 4) // Ensure 4 options per question
    }
  } catch (error) {
    console.error('[generateLearning] Parse failed:', error, raw)
    throw new Error('Failed to parse AI response')
  }

  if (questions.length === 0) {
    throw new Error('No valid questions generated')
  }

  const usage = completion.usage
  const promptTokens = usage?.prompt_tokens ?? 0
  const completionTokens = usage?.completion_tokens ?? 0
  const totalTokens = usage?.total_tokens ?? 0
  const estimatedCostUsd =
    (promptTokens * 0.15) / 1_000_000 + (completionTokens * 0.6) / 1_000_000

  return {
    teachingContent,
    topicTaught,
    vocabTaught,
    grammarCovered,
    phrasesTaught,
    qna: { questions },
    usage: {
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCostUsd,
    },
  }
}
