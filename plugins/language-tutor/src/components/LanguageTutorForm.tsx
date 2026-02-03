import { useState, useEffect } from 'react'
import type {
  LanguageLearning,
  LanguageLearningInput,
  LearningMetadata,
} from '../types'

interface LanguageTutorFormProps {
  initialData?: Partial<LanguageLearning>
  onSubmit: (data: LanguageLearningInput) => void | Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

function getThreeMonthsLater(): string {
  const today = new Date()
  const threeMonths = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)
  return threeMonths.toISOString().split('T')[0]
}

export function LanguageTutorForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: LanguageTutorFormProps) {
  const [targetLanguage, setTargetLanguage] = useState(
    initialData?.targetLanguage || '',
  )
  const [knownLanguagesText, setKnownLanguagesText] = useState(
    initialData?.knownLanguages?.join(', ') || '',
  )
  const [objectives, setObjectives] = useState(initialData?.objectives || '')
  const [startDate, setStartDate] = useState(
    initialData?.startDate || getTodayDate(),
  )
  const [endDate, setEndDate] = useState(
    initialData?.endDate || getThreeMonthsLater(),
  )
  const [proficiencyLevel, setProficiencyLevel] = useState<
    'beginner' | 'intermediate' | 'advanced'
  >(initialData?.metadata?.proficiencyLevel || 'beginner')
  const [color, setColor] = useState(initialData?.color || '#8B5CF6')
  const [note, setNote] = useState(initialData?.note || '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) {
      setTargetLanguage(initialData.targetLanguage || '')
      setKnownLanguagesText(initialData.knownLanguages?.join(', ') || '')
      setObjectives(initialData.objectives || '')
      setStartDate(initialData.startDate || getTodayDate())
      setEndDate(initialData.endDate || getThreeMonthsLater())
      setProficiencyLevel(initialData.metadata?.proficiencyLevel || 'beginner')
      setColor(initialData.color || '#8B5CF6')
      setNote(initialData.note || '')
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!targetLanguage.trim()) {
      setError('Target language is required')
      return
    }

    if (!knownLanguagesText.trim()) {
      setError('At least one known language is required')
      return
    }

    if (!objectives.trim()) {
      setError('Learning objectives are required')
      return
    }

    if (!startDate || !endDate) {
      setError('Start and end dates are required')
      return
    }

    if (startDate > endDate) {
      setError('End date must be after start date')
      return
    }

    setError(null)

    const knownLanguages = knownLanguagesText
      .split(',')
      .map((lang) => lang.trim())
      .filter((lang) => lang !== '')

    const metadata: LearningMetadata = initialData?.metadata
      ? {
          ...initialData.metadata,
          proficiencyLevel,
        }
      : {
          proficiencyLevel,
          currentTopic: 'Greetings & Basics',
          completedTopics: [],
          topicProgress: {},
          problematicWords: [],
          problematicSentences: [],
          masteredConcepts: [],
          topicsNeedReview: [],
        }

    await onSubmit({
      targetLanguage: targetLanguage.trim(),
      knownLanguages,
      objectives: objectives.trim(),
      startDate,
      endDate,
      metadata,
      color,
      note: note.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs text-white/60">Target Language</label>
        <input
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value)}
          placeholder="e.g. Spanish, French, Japanese"
          className="
            w-full rounded-xl border border-white/10 bg-white/5
            px-3 py-2 text-sm text-white placeholder-white/40
            focus:border-[#8B5CF6]/60 focus:outline-none
          "
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/60">
          Known Languages (comma-separated)
        </label>
        <input
          value={knownLanguagesText}
          onChange={(e) => setKnownLanguagesText(e.target.value)}
          placeholder="e.g. English, Hindi"
          className="
            w-full rounded-xl border border-white/10 bg-white/5
            px-3 py-2 text-sm text-white placeholder-white/40
            focus:border-[#8B5CF6]/60 focus:outline-none
          "
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/60">
          Current Proficiency Level
        </label>
        <select
          value={proficiencyLevel}
          onChange={(e) =>
            setProficiencyLevel(
              e.target.value as 'beginner' | 'intermediate' | 'advanced',
            )
          }
          className="
            w-full rounded-xl border border-white/10 bg-white/5
            px-3 py-2 text-sm text-white
            focus:border-[#8B5CF6]/60 focus:outline-none
          "
          disabled={isSubmitting}
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/60">Learning Objectives</label>
        <textarea
          value={objectives}
          onChange={(e) => setObjectives(e.target.value)}
          rows={3}
          placeholder="What do you want to achieve? e.g., Conversational fluency, Travel preparation, Business communication..."
          className="
            w-full rounded-xl border border-white/10 bg-white/5
            px-3 py-2 text-sm text-white placeholder-white/40
            focus:border-[#8B5CF6]/60 focus:outline-none
            resize-none
          "
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-white/60">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="
              w-full rounded-xl border border-white/10 bg-white/5
              px-3 py-2 text-sm text-white placeholder-white/40
              focus:border-[#8B5CF6]/60 focus:outline-none
            "
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-white/60">Target date</label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="
              w-full rounded-xl border border-white/10 bg-white/5
              px-3 py-2 text-sm text-white placeholder-white/40
              focus:border-[#8B5CF6]/60 focus:outline-none
            "
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/60">Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-12 rounded-lg border border-white/10 bg-transparent"
            disabled={isSubmitting}
          />
          <span className="text-xs text-white/50">
            Used to highlight learning days
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/60">Notes (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Additional notes, study preferences, or goals..."
          className="
            w-full rounded-xl border border-white/10 bg-white/5
            px-3 py-2 text-sm text-white placeholder-white/40
            focus:border-[#8B5CF6]/60 focus:outline-none
            resize-none
          "
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="
            px-4 py-2 rounded-xl text-sm font-medium
            bg-white/5 text-white/70 hover:bg-white/10
            transition-all duration-150
          "
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="
            px-4 py-2 rounded-xl text-sm font-medium
            bg-linear-to-r from-[#8B5CF6] to-[#7C3AED]
            text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]
            transition-all duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isSubmitting
            ? 'Saving…'
            : initialData?.id
            ? 'Update Learning'
            : 'Save Learning'}
        </button>
      </div>
    </form>
  )
}
