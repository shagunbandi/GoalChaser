'use client'

import { useState, useEffect } from 'react'

export interface QnAOption {
  id: string
  text: string
  isCorrect: boolean
  explanation: string
}

export interface QnAQuestion {
  id: string
  question: string
  options: QnAOption[]
  userAnswer?: string | null
  answeredCorrectly?: boolean | null
}

export interface QnAScore {
  correct: number
  total: number
  percentage: number
}

export interface QnAData {
  questions: QnAQuestion[]
  score?: QnAScore
}

export interface QnAComponentProps {
  data: QnAData
  onChange?: (updatedData: QnAData) => void
  accentColor?: string
  readonly?: boolean
}

export function QnAComponent({
  data,
  onChange,
  accentColor = '#8B5CF6',
  readonly = false,
}: QnAComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [localData, setLocalData] = useState<QnAData>(data)

  useEffect(() => {
    setLocalData(data)
  }, [data])

  const currentQuestion = localData.questions[currentQuestionIndex]
  const totalQuestions = localData.questions.length

  if (!currentQuestion || totalQuestions === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        <p>No questions available</p>
      </div>
    )
  }

  const handleSelectOption = (optionId: string) => {
    if (readonly || currentQuestion.userAnswer) return

    const selectedOption = currentQuestion.options.find(
      (opt) => opt.id === optionId,
    )
    if (!selectedOption) return

    const updatedQuestions = localData.questions.map((q, idx) => {
      if (idx === currentQuestionIndex) {
        return {
          ...q,
          userAnswer: optionId,
          answeredCorrectly: selectedOption.isCorrect,
        }
      }
      return q
    })

    const answeredQuestions = updatedQuestions.filter(
      (q) => q.userAnswer !== undefined && q.userAnswer !== null,
    )
    const correctAnswers = answeredQuestions.filter(
      (q) => q.answeredCorrectly === true,
    ).length
    const totalAnswered = answeredQuestions.length

    const updatedData: QnAData = {
      questions: updatedQuestions,
      score: {
        correct: correctAnswers,
        total: totalAnswered,
        percentage:
          totalAnswered > 0
            ? Math.round((correctAnswers / totalAnswered) * 100)
            : 0,
      },
    }

    setLocalData(updatedData)
    if (onChange) {
      onChange(updatedData)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const isAnswered =
    currentQuestion.userAnswer !== undefined &&
    currentQuestion.userAnswer !== null
  const selectedOption = currentQuestion.options.find(
    (opt) => opt.id === currentQuestion.userAnswer,
  )

  return (
    <div
      className="rounded-2xl border border-white/10 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${accentColor}10, transparent)`,
      }}
    >
      {/* Header with score */}
      <div className="px-4 py-3 border-b border-white/10 bg-white/2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/70">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
        </div>
        {localData.score && (
          <div className="text-sm font-semibold" style={{ color: accentColor }}>
            Score: {localData.score.correct}/{localData.score.total} (
            {localData.score.percentage}%)
          </div>
        )}
      </div>

      {/* Question */}
      <div className="p-6 space-y-4">
        <h3 className="text-base font-semibold text-white/90 leading-relaxed">
          {currentQuestion.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option) => {
            const isSelected = currentQuestion.userAnswer === option.id
            const showResult = isAnswered
            const isCorrectAnswer = option.isCorrect

            let bgColor = 'bg-white/[0.03]'
            let borderColor = 'border-white/10'
            let hoverBg = 'hover:bg-white/[0.06]'
            let textColor = 'text-white/80'

            if (showResult) {
              if (isSelected) {
                if (isCorrectAnswer) {
                  bgColor = 'bg-green-500/20'
                  borderColor = 'border-green-500/50'
                  textColor = 'text-green-400'
                } else {
                  bgColor = 'bg-red-500/20'
                  borderColor = 'border-red-500/50'
                  textColor = 'text-red-400'
                }
              } else if (isCorrectAnswer) {
                bgColor = 'bg-green-500/10'
                borderColor = 'border-green-500/30'
              }
              hoverBg = ''
            }

            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                disabled={readonly || isAnswered}
                className={`
                  w-full text-left px-4 py-3 rounded-xl border transition-all
                  ${bgColor} ${borderColor} ${hoverBg}
                  ${
                    readonly || isAnswered ? 'cursor-default' : 'cursor-pointer'
                  }
                  flex items-center gap-3
                `}
              >
                {/* Radio button */}
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                    ${
                      isSelected ? `border-[${accentColor}]` : 'border-white/30'
                    }
                  `}
                >
                  {isSelected && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                  )}
                </div>

                {/* Option text */}
                <span className={`text-sm ${textColor}`}>{option.text}</span>

                {/* Result indicator */}
                {showResult && (
                  <div className="ml-auto shrink-0">
                    {isSelected && isCorrectAnswer && (
                      <span className="text-green-400 text-lg">✓</span>
                    )}
                    {isSelected && !isCorrectAnswer && (
                      <span className="text-red-400 text-lg">✗</span>
                    )}
                    {!isSelected && isCorrectAnswer && (
                      <span className="text-green-400/60 text-xs">Correct</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {isAnswered && selectedOption && (
          <div
            className="mt-4 p-4 rounded-xl border"
            style={{
              backgroundColor: selectedOption.isCorrect
                ? 'rgba(34, 197, 94, 0.1)'
                : 'rgba(239, 68, 68, 0.1)',
              borderColor: selectedOption.isCorrect
                ? 'rgba(34, 197, 94, 0.3)'
                : 'rgba(239, 68, 68, 0.3)',
            }}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg shrink-0">
                {selectedOption.isCorrect ? '✓' : 'ℹ️'}
              </span>
              <div>
                <p
                  className={`text-sm font-medium mb-1 ${
                    selectedOption.isCorrect ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {selectedOption.isCorrect ? 'Correct!' : 'Incorrect'}
                </p>
                <p className="text-sm text-white/70 leading-relaxed">
                  {selectedOption.explanation}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-6 pb-6 flex items-center justify-between gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium transition-all
            ${
              currentQuestionIndex === 0
                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                : 'bg-white/10 hover:bg-white/15 text-white/80'
            }
          `}
        >
          ← Previous
        </button>

        <div className="flex gap-2">
          {localData.questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`
                w-8 h-8 rounded-lg text-xs font-medium transition-all
                ${
                  idx === currentQuestionIndex
                    ? 'bg-white/20 text-white'
                    : q.userAnswer
                    ? q.answeredCorrectly
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }
              `}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentQuestionIndex === totalQuestions - 1}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium transition-all
            ${
              currentQuestionIndex === totalQuestions - 1
                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                : 'bg-white/10 hover:bg-white/15 text-white/80'
            }
          `}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
