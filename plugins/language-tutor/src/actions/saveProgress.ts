import OpenAI from 'openai'
import type { LearningMetadata, TopicProgress } from '../types'
import type { QnAData } from '@goal-chaser/sdk'

interface SaveProgressPayload {
  currentMetadata: LearningMetadata
  qnaResults: QnAData
  targetLanguage: string
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced'
  // Curriculum tracking data
  topicTaught?: string
  vocabTaught?: string[]
  grammarCovered?: string[]
  phrasesTaught?: string[]
  lessonDate?: string
}

export interface SaveProgressResult {
  updatedMetadata: LearningMetadata
  suggestions: string[]
  usage?: {
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

/**
 * Analyze quiz results and update learning metadata
 */
export async function saveProgress(payload: unknown): Promise<SaveProgressResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const body = payload as SaveProgressPayload
  const { 
    currentMetadata, 
    qnaResults, 
    targetLanguage, 
    proficiencyLevel,
    topicTaught,
    vocabTaught,
    grammarCovered,
    phrasesTaught,
    lessonDate,
  } = body

  if (!currentMetadata || !qnaResults || !targetLanguage) {
    throw new Error('currentMetadata, qnaResults, and targetLanguage are required')
  }

  // Update curriculum tracking if lesson data is provided
  const updatedTopicProgress = { ...currentMetadata.topicProgress }
  
  if (topicTaught && lessonDate) {
    const existingProgress = updatedTopicProgress[topicTaught] || {
      vocabTaught: [],
      grammarCovered: [],
      phrasesTaught: [],
      lastTaughtDate: lessonDate,
      lessonsCompleted: 0,
    }

    // Merge new content with existing (avoid duplicates)
    const mergeUnique = (existing: string[], newItems: string[] = []) => {
      return Array.from(new Set([...existing, ...newItems]))
    }

    updatedTopicProgress[topicTaught] = {
      vocabTaught: mergeUnique(existingProgress.vocabTaught, vocabTaught),
      grammarCovered: mergeUnique(existingProgress.grammarCovered, grammarCovered),
      phrasesTaught: mergeUnique(existingProgress.phrasesTaught, phrasesTaught),
      lastTaughtDate: lessonDate,
      lessonsCompleted: existingProgress.lessonsCompleted + 1,
    }
  }

  // Extract failed questions for analysis
  const failedQuestions = qnaResults.questions
    .filter((q) => q.answeredCorrectly === false)
    .map((q) => ({
      question: q.question,
      userAnswer: q.options.find((opt) => opt.id === q.userAnswer)?.text || 'No answer',
      correctAnswer: q.options.find((opt) => opt.isCorrect)?.text || 'Unknown',
    }))

  const score = qnaResults.score?.percentage ?? 0

  // If no OpenAI key or simple case, do basic metadata update
  if (failedQuestions.length === 0 && score >= 80) {
    // Excellent performance - no changes needed
    return {
      updatedMetadata: {
        ...currentMetadata,
        topicProgress: updatedTopicProgress,
        lastUpdated: new Date().toISOString(),
      },
      suggestions: score === 100 ? ['Perfect score! Consider advancing to more challenging topics.'] : [],
    }
  }

  // Use AI to analyze failures and update metadata
  const systemPrompt = `You are a language learning progress analyzer. Based on quiz performance, you update the student's learning metadata to track their progress accurately.

Current proficiency level: ${proficiencyLevel}
Language: ${targetLanguage}
Quiz score: ${score}%

Current metadata:
- Problematic words: ${currentMetadata.problematicWords?.join(', ') || 'None'}
- Problematic sentences/patterns: ${currentMetadata.problematicSentences?.join('; ') || 'None'}
- Mastered concepts: ${currentMetadata.masteredConcepts?.join(', ') || 'None'}
- Topics needing review: ${currentMetadata.topicsNeedReview?.join(', ') || 'None'}

Failed questions:
${failedQuestions.map((q, i) => `${i + 1}. Q: "${q.question}"\n   Student answered: "${q.userAnswer}"\n   Correct answer: "${q.correctAnswer}"`).join('\n\n')}

Task: Analyze the failures and update metadata appropriately:
1. For beginners (score <60%): Add specific failed words/patterns to problematic lists
2. For intermediate/advanced: Identify concept gaps and add to topics needing review
3. If score >80%: Remove items from problematic lists if they're showing improvement
4. Provide 2-3 actionable suggestions for the student

Respond ONLY with JSON:
{
  "problematicWords": ["word1", "word2"],
  "problematicSentences": ["pattern1", "pattern2"],
  "masteredConcepts": ["concept1", "concept2"],
  "topicsNeedReview": ["topic1", "topic2"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`

  const userPrompt = `Analyze quiz performance and update metadata. Return JSON only.`

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

  try {
    const parsed = JSON.parse(raw) as {
      problematicWords?: string[]
      problematicSentences?: string[]
      masteredConcepts?: string[]
      topicsNeedReview?: string[]
      suggestions?: string[]
    }

    const usage = completion.usage
    const promptTokens = usage?.prompt_tokens ?? 0
    const completionTokens = usage?.completion_tokens ?? 0
    const totalTokens = usage?.total_tokens ?? 0
    const estimatedCostUsd =
      (promptTokens * 0.15) / 1_000_000 + (completionTokens * 0.6) / 1_000_000

    return {
      updatedMetadata: {
        proficiencyLevel: currentMetadata.proficiencyLevel,
        currentTopic: currentMetadata.currentTopic,
        completedTopics: currentMetadata.completedTopics,
        topicProgress: updatedTopicProgress,
        problematicWords: parsed.problematicWords || currentMetadata.problematicWords || [],
        problematicSentences: parsed.problematicSentences || currentMetadata.problematicSentences || [],
        masteredConcepts: parsed.masteredConcepts || currentMetadata.masteredConcepts || [],
        topicsNeedReview: parsed.topicsNeedReview || currentMetadata.topicsNeedReview || [],
        lastUpdated: new Date().toISOString(),
      },
      suggestions: parsed.suggestions || ['Keep practicing!'],
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCostUsd,
      },
    }
  } catch (error) {
    console.error('[saveProgress] Parse failed:', error, raw)
    
    // Fallback: simple metadata update without AI
    return {
      updatedMetadata: {
        ...currentMetadata,
        topicProgress: updatedTopicProgress,
        lastUpdated: new Date().toISOString(),
      },
      suggestions: ['Continue practicing to improve your score.'],
    }
  }
}
