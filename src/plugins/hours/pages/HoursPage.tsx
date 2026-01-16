/**
 * Hours Plugin Page
 */

'use client'

import type { PluginPageProps } from '@/sdk'
import { HoursView } from '../components'
import { useGoalData } from '@/hooks/useGoalData'
import { useRouter } from 'next/navigation'

export default function HoursPage({ context, params, year = new Date().getFullYear() }: PluginPageProps) {
  const goalId = params.id
  const router = useRouter()

  const {
    goal,
    isLoading,
    todayISO,
    pluginData,
    pluginConfigs,
    handleUpdateData,
    updateConfig,
  } = useGoalData(goalId, year)
  
  // Extract hours-specific data
  const hoursData = pluginData?.['hours'] || {}
  const subjectConfigs = (pluginConfigs?.['hours'] as any)?.subjects || []
  
  // Wrapper functions for hours-specific updates
  const handleUpdateDetails = async (iso: string, updates: any) => {
    await handleUpdateData('hours', iso, updates)
  }
  
  const handleAddSubject = (name: string) => {
    const newSubject = { id: `subject_${Date.now()}`, name, topics: [], hasTopics: true }
    updateConfig('hours', { subjects: [...subjectConfigs, newSubject] })
  }
  
  const handleRemoveSubject = (id: string) => {
    updateConfig('hours', { subjects: subjectConfigs.filter((s: any) => s.id !== id) })
  }
  
  const handleUpdateSubject = (id: string, name: string) => {
    updateConfig('hours', { subjects: subjectConfigs.map((s: any) => s.id === id ? { ...s, name } : s) })
  }
  
  const handleToggleHasTopics = (id: string) => {
    updateConfig('hours', { subjects: subjectConfigs.map((s: any) => s.id === id ? { ...s, hasTopics: !(s.hasTopics ?? true) } : s) })
  }
  
  const handleAddTopic = (subjectId: string, topic: string) => {
    updateConfig('hours', { subjects: subjectConfigs.map((s: any) => s.id === subjectId ? { ...s, topics: [...(s.topics || []), topic] } : s) })
  }
  
  const handleRemoveTopic = (subjectId: string, topic: string) => {
    updateConfig('hours', { subjects: subjectConfigs.map((s: any) => s.id === subjectId ? { ...s, topics: (s.topics || []).filter((t: string) => t !== topic) } : s) })
  }
  
  const handleUpdateTopic = (subjectId: string, oldTopic: string, newTopic: string) => {
    updateConfig('hours', { subjects: subjectConfigs.map((s: any) => s.id === subjectId ? { ...s, topics: (s.topics || []).map((t: string) => t === oldTopic ? newTopic : t) } : s) })
  }
  
  const isTopicInUse = (subjectId: string, topic: string) => {
    return Object.values(hoursData).some((details: any) => 
      details?.subjects?.some((subj: any) => subj.subject === subjectConfigs.find((s: any) => s.id === subjectId)?.name && subj.topics?.includes(topic))
    )
  }

  const handleJumpToDay = (iso: string) => {
    // Update URL with selected date
    const url = new URL(window.location.href)
    url.searchParams.set('date', iso)
    window.history.replaceState({}, '', url.toString())
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Goal not found</div>
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-6 space-y-4">
      <HoursView
        year={year}
        todayISO={todayISO}
        dayDetails={hoursData}
        subjectConfigs={subjectConfigs}
        maxHours={14}
        onPrevYear={() => router.push(`/goal/${goalId}/hours/${year - 1}`)}
        onNextYear={() => router.push(`/goal/${goalId}/hours/${year + 1}`)}
        onUpdateDay={handleUpdateDetails}
        onJumpToDay={handleJumpToDay}
        initialSelectedDay={null}
        onAddSubject={handleAddSubject}
        onRemoveSubject={handleRemoveSubject}
        onUpdateSubject={handleUpdateSubject}
        onToggleHasTopics={handleToggleHasTopics}
        onAddTopic={handleAddTopic}
        onRemoveTopic={handleRemoveTopic}
        onUpdateTopic={handleUpdateTopic}
        isTopicInUse={isTopicInUse}
      />
    </main>
  )
}
