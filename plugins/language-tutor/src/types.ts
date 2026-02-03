// Language Tutor Plugin Types
import type { PluginDayData, ActivityItem, QnAData } from '@goal-chaser/sdk'

/** Progress tracking for a specific curriculum topic */
export interface TopicProgress {
  /** Vocabulary words taught in this topic (with transliterations) */
  vocabTaught: string[]
  /** Grammar concepts covered in this topic */
  grammarCovered: string[]
  /** Phrases/sentences taught in this topic */
  phrasesTaught: string[]
  /** Date when this topic was last taught */
  lastTaughtDate: string
  /** Number of lessons completed in this topic */
  lessonsCompleted: number
}

/** Adaptive learning metadata that evolves based on user's progress */
export interface LearningMetadata {
  /** Current proficiency level */
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced'
  
  /** Current topic being taught */
  currentTopic: string
  /** Topics that have been completed */
  completedTopics: string[]
  /** Detailed progress per topic */
  topicProgress: Record<string, TopicProgress>
  
  /** Words the user struggles with */
  problematicWords: string[]
  /** Sentences or grammar patterns the user finds difficult */
  problematicSentences: string[]
  /** Concepts the user has mastered */
  masteredConcepts: string[]
  /** Topics that need review */
  topicsNeedReview: string[]
  /** Last updated timestamp */
  lastUpdated?: string
}

/** Language learning entity (goal-level) */
export interface LanguageLearning extends ActivityItem {
  /** Languages the user already knows */
  knownLanguages: string[]
  /** Target language to learn */
  targetLanguage: string
  /** Learning objectives and goals */
  objectives: string
  /** Start date of learning period */
  startDate: string
  /** End date of learning period */
  endDate: string
  /** Adaptive metadata tracking progress */
  metadata: LearningMetadata
  /** Optional color for visual identification */
  color?: string
  /** Optional notes */
  note?: string
  /** AI usage tracking */
  aiUsage?: {
    totalPromptTokens: number
    totalCompletionTokens: number
    totalTokens: number
    estimatedCostUsd: number
    lastUpdated: string
  }
}

/** Input for creating/updating a learning */
export interface LanguageLearningInput {
  knownLanguages: string[]
  targetLanguage: string
  objectives: string
  startDate: string
  endDate: string
  metadata?: LearningMetadata
  color?: string
  note?: string
}

/** Day-level plugin data: teaching content + QnA + notes */
export interface LanguageTutorDayData extends PluginDayData {
  /** AI-generated teaching content for the day */
  teachingContent?: string
  /** Quiz questions and answers */
  qna?: QnAData
  /** Optional notes about the learning session */
  notes?: string
  /** Reference to the parent learning ID */
  learningId?: string
  /** Topic taught on this day */
  topicTaught?: string
  /** Vocabulary taught on this day (for curriculum tracking) */
  vocabTaught?: string[]
  /** Grammar concepts covered on this day */
  grammarCovered?: string[]
  /** Phrases taught on this day */
  phrasesTaught?: string[]
}
