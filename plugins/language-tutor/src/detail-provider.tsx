'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { PluginDetailProvider, QnAData } from '@goal-chaser/sdk'
import { NotesField, QnAComponent } from '@goal-chaser/sdk'
import type {
  LanguageTutorDayData,
  LanguageLearning,
  LanguageLearningInput,
} from './types'
import { GenerateLearningModal } from './components/GenerateLearningModal'
import type { GenerateLearningResult } from './actions'

interface LanguageTutorDetailContext {
  onEditLearning?: (learning: LanguageLearning) => void | Promise<void>
  onDeleteLearning?: (learningId: string) => void | Promise<void>
  onAddLearning?: (learning: LanguageLearningInput) => void | Promise<void>
  selectedDate?: string
  allLearnings?: LanguageLearning[]
  userId?: string
  goalId?: string
  loadAllLearnings?: () => Promise<LanguageLearning[]>
}

function EmptyLearningState({
  date,
  notes,
  onAddLearning,
  onSaveNotes,
}: {
  date: string
  notes: string
  onAddLearning?: (learning: LanguageLearningInput) => void | Promise<void>
  onSaveNotes: (notes: string) => void | Promise<void>
}) {
  return (
    <div className="space-y-6">
      <NotesField
        value={notes}
        onSave={onSaveNotes}
        label="Learning Notes"
        placeholder="Notes about your learning session..."
        icon="📝"
        accentColor="#8B5CF6"
        resetKey={date}
      />

      <div className="text-center text-white/40 py-8">
        <div className="text-4xl mb-2">🎓</div>
        <p>No learning content for this day</p>
        {onAddLearning && (
          <p className="text-sm text-white/50 mt-2">
            Create a learning first, then generate content
          </p>
        )}
      </div>
    </div>
  )
}

function LearningDayView({
  date,
  learning,
  data,
  notes,
  onSaveNotes,
  onUpdate,
  onEditLearning,
  userId,
  goalId,
}: {
  date: string
  learning: LanguageLearning
  data: LanguageTutorDayData
  notes: string
  onSaveNotes: (notes: string) => void | Promise<void>
  onUpdate: (updates: Partial<LanguageTutorDayData>) => Promise<void>
  onEditLearning?: (learning: LanguageLearning) => void | Promise<void>
  userId?: string
  goalId?: string
}) {
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [generateLoading, setGenerateLoading] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [generatedContent, setGeneratedContent] =
    useState<GenerateLearningResult | null>(null)

  const hasContent = !!(data.teachingContent || data.qna)

  const runGenerateLearning = async () => {
    setGenerateModalOpen(true)
    setGenerateLoading(true)
    setGenerateError(null)
    setGeneratedContent(null)

    try {
      const res = await fetch('/api/plugin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pluginId: 'languageTutor',
          action: 'generateLearning',
          payload: {
            targetLanguage: learning.targetLanguage,
            knownLanguages: learning.knownLanguages,
            metadata: learning.metadata,
            date,
            objectives: learning.objectives,
          },
        }),
      })

      const result = await res.json().catch(() => ({}))
      if (!res.ok) {
        setGenerateError(result.error || `Request failed: ${res.status}`)
        return
      }

      setGeneratedContent(result)
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : 'Something went wrong',
      )
    } finally {
      setGenerateLoading(false)
    }
  }

  const handleAcceptGenerated = async () => {
    if (!generatedContent) return

    // Convert generated QnA to SDK format
    const qna: QnAData = {
      questions: generatedContent.qna.questions.map((q, qIdx) => ({
        id: `q-${date}-${qIdx}`,
        question: q.question,
        options: q.options.map((opt, optIdx) => ({
          id: `opt-${qIdx}-${optIdx}`,
          text: opt.text,
          isCorrect: opt.isCorrect,
          explanation: opt.explanation,
        })),
      })),
    }

    await onUpdate({
      teachingContent: generatedContent.teachingContent,
      qna,
      learningId: learning.id,
      topicTaught: generatedContent.topicTaught,
      vocabTaught: generatedContent.vocabTaught,
      grammarCovered: generatedContent.grammarCovered,
      phrasesTaught: generatedContent.phrasesTaught,
    })

    // Update AI usage if needed
    if (generatedContent.usage && onEditLearning) {
      const prev = learning.aiUsage
      const newUsage = generatedContent.usage
      await onEditLearning({
        ...learning,
        aiUsage: {
          totalPromptTokens:
            (prev?.totalPromptTokens ?? 0) + newUsage.promptTokens,
          totalCompletionTokens:
            (prev?.totalCompletionTokens ?? 0) + newUsage.completionTokens,
          totalTokens: (prev?.totalTokens ?? 0) + newUsage.totalTokens,
          estimatedCostUsd:
            (prev?.estimatedCostUsd ?? 0) + newUsage.estimatedCostUsd,
          lastUpdated: new Date().toISOString(),
        },
      })
    }

    setGenerateModalOpen(false)
  }

  const handleSaveProgress = async () => {
    if (!data.qna) return

    try {
      const res = await fetch('/api/plugin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pluginId: 'languageTutor',
          action: 'saveProgress',
          payload: {
            currentMetadata: learning.metadata,
            qnaResults: data.qna,
            targetLanguage: learning.targetLanguage,
            proficiencyLevel: learning.metadata.proficiencyLevel,
            // Pass curriculum data for progress tracking
            topicTaught: data.topicTaught,
            vocabTaught: data.vocabTaught,
            grammarCovered: data.grammarCovered,
            phrasesTaught: data.phrasesTaught,
            lessonDate: date,
          },
        }),
      })

      const result = await res.json()
      if (res.ok && result.updatedMetadata && onEditLearning) {
        await onEditLearning({
          ...learning,
          metadata: result.updatedMetadata,
        })

        // Show success message if suggestions
        if (result.suggestions && result.suggestions.length > 0) {
          alert(`Progress saved!\n\n${result.suggestions.join('\n')}`)
        }
      }
    } catch (err) {
      console.error('Failed to save progress:', err)
      alert('Failed to save progress')
    }
  }

  const handleQnAChange = async (updatedQnA: QnAData) => {
    await onUpdate({ qna: updatedQnA })
  }

  return (
    <div className="space-y-6">
      {/* Notes */}
      <NotesField
        value={notes}
        onSave={onSaveNotes}
        label="Learning Notes"
        placeholder="Notes about your learning session..."
        icon="📝"
        accentColor="#8B5CF6"
        resetKey={date}
      />

      {/* Learning Info Card */}
      <div
        className="rounded-2xl border border-white/10 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${
            learning.color || '#8B5CF6'
          }15, ${learning.color || '#8B5CF6'}05)`,
        }}
      >
        <div className="px-4 py-3 border-b border-white/10 bg-white/2">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{
                backgroundColor: `${learning.color || '#8B5CF6'}40`,
              }}
            >
              🎓
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold text-white/90">
                {learning.targetLanguage}
              </h4>
              <p className="text-xs text-white/50">
                {learning.metadata.proficiencyLevel} • Known:{' '}
                {learning.knownLanguages.join(', ')}
              </p>
            </div>
          </div>
        </div>

        {learning.metadata && (
          <div className="px-4 py-3 space-y-2 text-xs">
            {/* Current Topic */}
            <div className="text-violet-400 font-medium">
              📖 Current Topic: {learning.metadata.currentTopic || 'Not set'}
            </div>

            {/* Completed Topics */}
            {learning.metadata.completedTopics &&
              learning.metadata.completedTopics.length > 0 && (
                <div className="text-blue-400">
                  ✓ Completed:{' '}
                  {learning.metadata.completedTopics.slice(0, 3).join(', ')}
                  {learning.metadata.completedTopics.length > 3 && '...'}
                </div>
              )}

            {/* Mastered Concepts */}
            {learning.metadata.masteredConcepts &&
              learning.metadata.masteredConcepts.length > 0 && (
                <div className="text-green-400">
                  ✓ Mastered:{' '}
                  {learning.metadata.masteredConcepts.slice(0, 3).join(', ')}
                  {learning.metadata.masteredConcepts.length > 3 && '...'}
                </div>
              )}

            {/* Topics Need Review */}
            {learning.metadata.topicsNeedReview &&
              learning.metadata.topicsNeedReview.length > 0 && (
                <div className="text-amber-400">
                  ⚠ Review:{' '}
                  {learning.metadata.topicsNeedReview.slice(0, 3).join(', ')}
                  {learning.metadata.topicsNeedReview.length > 3 && '...'}
                </div>
              )}
          </div>
        )}
      </div>

      {/* Curriculum Progress Details */}
      {learning.metadata?.topicProgress &&
        Object.keys(learning.metadata.topicProgress).length > 0 && (
          <details className="rounded-xl border border-white/10 bg-white/2 overflow-hidden">
            <summary className="px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors">
              <span className="text-sm font-medium text-white/80">
                📊 Curriculum Progress (
                {Object.keys(learning.metadata.topicProgress).length} topics)
              </span>
            </summary>
            <div className="px-4 pb-4 space-y-3 max-h-96 overflow-y-auto">
              {Object.entries(learning.metadata.topicProgress).map(
                ([topic, progress]) => (
                  <div
                    key={topic}
                    className="border-l-2 border-violet-500/30 pl-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-white/90">
                        {topic}
                      </h4>
                      <span className="text-xs text-white/50">
                        {progress.lessonsCompleted} lesson
                        {progress.lessonsCompleted !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {progress.vocabTaught &&
                        progress.vocabTaught.length > 0 && (
                          <div>
                            <span className="text-violet-400 font-medium">
                              Vocabulary ({progress.vocabTaught.length}):
                            </span>
                            <div className="text-white/60 mt-1 pl-2">
                              {progress.vocabTaught
                                .slice(0, 10)
                                .map((word, i) => (
                                  <div key={i}>• {word}</div>
                                ))}
                              {progress.vocabTaught.length > 10 && (
                                <div className="text-white/40 italic">
                                  ... and {progress.vocabTaught.length - 10}{' '}
                                  more
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      {progress.grammarCovered &&
                        progress.grammarCovered.length > 0 && (
                          <div>
                            <span className="text-blue-400 font-medium">
                              Grammar:
                            </span>
                            <div className="text-white/60 mt-1 pl-2">
                              {progress.grammarCovered.map((grammar, i) => (
                                <div key={i}>• {grammar}</div>
                              ))}
                            </div>
                          </div>
                        )}

                      {progress.phrasesTaught &&
                        progress.phrasesTaught.length > 0 && (
                          <div>
                            <span className="text-green-400 font-medium">
                              Phrases ({progress.phrasesTaught.length}):
                            </span>
                            <div className="text-white/60 mt-1 pl-2">
                              {progress.phrasesTaught
                                .slice(0, 5)
                                .map((phrase, i) => (
                                  <div key={i}>• {phrase}</div>
                                ))}
                              {progress.phrasesTaught.length > 5 && (
                                <div className="text-white/40 italic">
                                  ... and {progress.phrasesTaught.length - 5}{' '}
                                  more
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      <div className="text-white/40 text-xs pt-2">
                        Last taught:{' '}
                        {new Date(progress.lastTaughtDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </details>
        )}

      {/* Teaching Content */}
      {data.teachingContent && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
            📚 Today's Lesson
            {data.topicTaught && (
              <span className="text-xs text-white/50 font-normal">
                • {data.topicTaught}
              </span>
            )}
          </h3>
          <div className="rounded-xl border border-white/10 bg-white/2 p-4">
            <div className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
              {data.teachingContent}
            </div>
          </div>

          {/* Show what was taught today */}
          {(data.vocabTaught?.length ||
            data.grammarCovered?.length ||
            data.phrasesTaught?.length) && (
            <div className="rounded-xl border border-white/10 bg-white/2 p-3 text-xs space-y-2">
              <div className="text-white/50 font-medium mb-2">
                📝 Today's Content:
              </div>

              {data.vocabTaught && data.vocabTaught.length > 0 && (
                <div>
                  <span className="text-violet-400">Vocabulary:</span>{' '}
                  <span className="text-white/70">
                    {data.vocabTaught.slice(0, 5).join(', ')}
                  </span>
                  {data.vocabTaught.length > 5 && (
                    <span className="text-white/40">
                      {' '}
                      +{data.vocabTaught.length - 5} more
                    </span>
                  )}
                </div>
              )}

              {data.grammarCovered && data.grammarCovered.length > 0 && (
                <div>
                  <span className="text-blue-400">Grammar:</span>{' '}
                  <span className="text-white/70">
                    {data.grammarCovered.join(', ')}
                  </span>
                </div>
              )}

              {data.phrasesTaught && data.phrasesTaught.length > 0 && (
                <div>
                  <span className="text-green-400">Phrases:</span>{' '}
                  <span className="text-white/70">
                    {data.phrasesTaught.slice(0, 3).join(', ')}
                  </span>
                  {data.phrasesTaught.length > 3 && (
                    <span className="text-white/40">
                      {' '}
                      +{data.phrasesTaught.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* QnA Quiz */}
      {data.qna && data.qna.questions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
            ❓ Quiz
          </h3>
          <QnAComponent
            data={data.qna}
            onChange={handleQnAChange}
            accentColor={learning.color || '#8B5CF6'}
          />

          {/* Quiz Completion Message */}
          {data.qna.score &&
            data.qna.score.total === data.qna.questions.length && (
              <div className="rounded-xl border border-white/10 bg-white/2 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {data.qna.score.percentage >= 80
                      ? '🎉'
                      : data.qna.score.percentage >= 60
                      ? '👍'
                      : '💪'}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white/90">
                      Quiz Complete!
                    </p>
                    <p className="text-xs text-white/60">
                      You scored {data.qna.score.correct}/{data.qna.score.total}{' '}
                      ({data.qna.score.percentage}%)
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {userId && goalId && (
          <button
            onClick={runGenerateLearning}
            className="
              px-4 py-2 rounded-xl text-sm font-medium
              bg-linear-to-r from-[#8B5CF6] to-[#7C3AED]
              text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]
              transition-all duration-150
            "
          >
            {hasContent ? 'Regenerate Content' : 'Generate for Today'}
          </button>
        )}

        {/* Show Save Progress button if quiz has been attempted */}
        {data.qna && data.qna.score && data.qna.score.total > 0 && (
          <button
            onClick={handleSaveProgress}
            className="
              px-4 py-2 rounded-xl text-sm font-medium
              bg-white/10 hover:bg-white/15
              text-white/80 transition-all duration-150
            "
          >
            💾 Save Progress
          </button>
        )}
      </div>

      {/* Generate Modal */}
      {generateModalOpen && (
        <GenerateLearningModal
          open={generateModalOpen}
          onClose={() => setGenerateModalOpen(false)}
          learning={learning}
          date={date}
          teachingContent={generatedContent?.teachingContent}
          questionCount={generatedContent?.qna.questions.length}
          isLoading={generateLoading}
          error={generateError}
          onAccept={handleAcceptGenerated}
          onRegenerate={runGenerateLearning}
          lastUsage={generatedContent?.usage}
        />
      )}
    </div>
  )
}

export class LanguageTutorDetailProvider
  implements PluginDetailProvider<LanguageTutorDayData>
{
  renderDetail(
    data: LanguageTutorDayData | null,
    date: string,
    onUpdate: (updates: Partial<LanguageTutorDayData>) => Promise<void>,
    context?: LanguageTutorDetailContext,
  ): ReactNode {
    const notes = data?.notes || ''
    const learningsForDay = (context?.allLearnings || []).filter(
      (l) => date >= l.startDate && date <= l.endDate,
    )

    const handleSaveNotes = async (newNotes: string) => {
      await onUpdate({ notes: newNotes })
    }

    // If no learnings for this day, show empty state
    if (learningsForDay.length === 0) {
      return (
        <EmptyLearningState
          date={date}
          notes={notes}
          onAddLearning={context?.onAddLearning}
          onSaveNotes={handleSaveNotes}
        />
      )
    }

    // For now, show the first learning (could be extended to support multiple)
    const learning = learningsForDay[0]
    const dayData: LanguageTutorDayData = data || {
      notes: '',
      teachingContent: '',
    }

    return (
      <LearningDayView
        date={date}
        learning={learning}
        data={dayData}
        notes={notes}
        onSaveNotes={handleSaveNotes}
        onUpdate={onUpdate}
        onEditLearning={context?.onEditLearning}
        userId={context?.userId}
        goalId={context?.goalId}
      />
    )
  }
}
