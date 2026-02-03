import React from 'react'
import type { Plugin, PluginQuickStats, PluginPeriodInsights } from '@goal-chaser/sdk'
import { generateDateRange, buildPluginUrl } from '@goal-chaser/sdk'
import { getLanguageTutorDayCustomization } from './calendar-utils'
import { LanguageTutorDataProvider } from './data-provider'
import { LanguageTutorDetailProvider } from './detail-provider'
import LanguageTutorPage from './pages/LanguageTutorPage'
import type { LanguageTutorDayData } from './types'
import { languageTutorChat, generateLearning, saveProgress } from './actions'
import {
  countTotalLessons,
  countTotalQuizzes,
  calculateAverageScore,
  calculateLearningStreak,
  countLessonsInPeriod,
  calculateAverageScoreInPeriod,
  buildScoreBreakdown,
} from './insights-utils'

export const LanguageTutorPlugin: Plugin = {
  id: 'languageTutor',
  
  metadata: { 
    name: 'Language Tutor', 
    icon: '🎓', 
    description: 'AI-powered language learning with adaptive progress tracking', 
    version: '1.0.0', 
    isPrimary: false 
  },
  
  routes: [
    { 
      path: '{year}', 
      component: LanguageTutorPage, 
      requiresYear: true 
    }
  ],
  
  dataProvider: new LanguageTutorDataProvider(),
  
  detailProvider: new LanguageTutorDetailProvider(),

  handlers: {
    chat: (payload) => languageTutorChat(payload),
    generateLearning: (payload) => generateLearning(payload),
    saveProgress: (payload) => saveProgress(payload),
  },

  // Calendar integration
  calendar: {
    getCalendarBackground: (data) => {
      const dayData = data as LanguageTutorDayData | null
      if (!dayData) return null
      
      const customization = getLanguageTutorDayCustomization('', dayData, false)
      if (!customization) return null
      
      return {
        backgroundColor: customization.backgroundColor,
        style: customization.style,
      }
    },
    
    getDaySummary: (date, data, context) => {
      const dayData = data as LanguageTutorDayData | null
      if (!dayData) return null
      
      const hasTeaching = !!dayData.teachingContent
      const hasQnA = !!dayData.qna && dayData.qna.questions.length > 0
      
      if (!hasTeaching && !hasQnA) return null

      const dateObj = new Date(date)
      const year = dateObj.getFullYear()
      const month = dateObj.getMonth() + 1
      const url = context?.goalId
        ? buildPluginUrl({
            goalId: context.goalId,
            pluginId: 'languageTutor',
            year,
            month,
            date,
          })
        : undefined

      // If has QnA with score, show score
      if (hasQnA && dayData.qna?.score) {
        const { correct, total, percentage } = dayData.qna.score
        const emoji = percentage >= 80 ? '🌟' : percentage >= 60 ? '👍' : '📖'
        
        return {
          color: percentage >= 80 ? '#22C55E' : percentage >= 60 ? '#FBBF24' : '#8B5CF6',
          hasData: true,
          summary: {
            type: 'stats',
            title: 'Language Learning',
            subtitle: dayData.teachingContent?.substring(0, 50) + '...' || 'Lesson completed',
            icon: emoji,
            badge: `${percentage}%`,
            gradient: { from: '#8B5CF6', to: '#7C3AED' },
            stats: [
              { label: 'Quiz Score', value: `${correct}/${total}`, icon: '📊', color: '#8B5CF6' },
              { label: 'Percentage', value: `${percentage}%`, icon: emoji, color: '#7C3AED' },
            ],
            actions: [{ label: 'View Details', url, variant: 'primary' as const }],
          },
        }
      }

      // If only teaching content
      if (hasTeaching) {
        return {
          color: '#8B5CF6',
          hasData: true,
          summary: {
            type: 'stats',
            title: 'Language Learning',
            subtitle: 'Lesson available',
            icon: '📚',
            badge: 'New',
            gradient: { from: '#8B5CF6', to: '#7C3AED' },
            stats: [
              { label: 'Content', value: 'Teaching', icon: '📚', color: '#8B5CF6' },
              { label: 'Quiz', value: hasQnA ? 'Yes' : 'No', icon: '❓', color: '#7C3AED' },
            ],
            actions: [{ label: 'Start Learning', url, variant: 'primary' as const }],
          },
        }
      }

      return null
    },
  },

  // Insights integration
  insights: {
    getQuickStats: (allData) => {
      const totalLessons = countTotalLessons(allData)
      const totalQuizzes = countTotalQuizzes(allData)
      const avgScore = calculateAverageScore(allData)
      const todayISO = new Date().toISOString().split('T')[0]
      const streak = calculateLearningStreak(allData, todayISO)
      
      const stats: PluginQuickStats = {
        metrics: [
          {
            label: 'Total Lessons',
            value: totalLessons,
            subtitle: 'All-time',
            icon: '📚',
            color: '#8B5CF6',
          },
          {
            label: 'Quizzes Taken',
            value: totalQuizzes,
            subtitle: 'Completed',
            icon: '❓',
            color: '#7C3AED',
          },
          {
            label: 'Avg Score',
            value: avgScore > 0 ? `${avgScore}%` : 'N/A',
            subtitle: 'All quizzes',
            icon: avgScore >= 80 ? '🌟' : avgScore >= 60 ? '👍' : '📖',
            color: avgScore >= 80 ? '#22C55E' : avgScore >= 60 ? '#FBBF24' : '#6D28D9',
          },
          {
            label: 'Current Streak',
            value: streak,
            subtitle: `day${streak !== 1 ? 's' : ''}`,
            icon: '🔥',
            color: '#A78BFA',
          },
        ],
      }
      
      return stats
    },
    
    getPeriodInsights: (startDate, endDate, data) => {
      const dates = generateDateRange(startDate, endDate)
      
      const lessonsInPeriod = countLessonsInPeriod(data)
      const avgScore = calculateAverageScoreInPeriod(data)
      const quizzesTaken = Object.values(data).filter(
        (day) => day.qna && day.qna.score && day.qna.score.total > 0
      ).length
      
      const insights: PluginPeriodInsights = {
        summary: [
          {
            label: 'Lessons',
            value: lessonsInPeriod,
            subtitle: 'In this period',
            icon: '📚',
            color: '#8B5CF6',
          },
          {
            label: 'Learning Days',
            value: `${Math.round((lessonsInPeriod / dates.length) * 100)}%`,
            subtitle: 'Of period',
            icon: '📅',
            color: '#7C3AED',
          },
          {
            label: 'Quizzes',
            value: quizzesTaken,
            subtitle: 'Completed',
            icon: '❓',
            color: '#6D28D9',
          },
          {
            label: 'Avg Score',
            value: avgScore > 0 ? `${avgScore}%` : 'N/A',
            subtitle: 'This period',
            icon: avgScore >= 80 ? '🌟' : avgScore >= 60 ? '👍' : '📖',
            color: avgScore >= 80 ? '#22C55E' : avgScore >= 60 ? '#FBBF24' : '#A78BFA',
          },
        ],
        breakdown: buildScoreBreakdown(data),
      }
      
      return insights
    },
    
    defaultTimeRanges: [
      { label: 'Last 30 days', days: 30, id: 'last-30' },
      { label: 'Last 90 days', days: 90, id: 'last-90' },
      { label: 'Last 6 months', days: 180, id: 'last-180' },
      { label: 'Last year', days: 365, id: 'last-365' },
    ],
  },
}

export default LanguageTutorPlugin
