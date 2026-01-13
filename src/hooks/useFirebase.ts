'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import type { DayDetails, SubjectConfig } from '@/types'
import { logger } from '@/lib/logger'
import {
  initFirebase,
  loadDayDetailsFromFirebase,
  saveDayDetailsToFirebase,
  loadSubjectConfigsFromFirebase,
  saveSubjectConfigsToFirebase,
  getStorageKey,
  loadFromStorage,
  saveToStorage,
} from '@/services'

// ============ Main Hook ============
interface UseFirebaseReturn {
  dayDetails: Record<string, DayDetails>
  subjectConfigs: SubjectConfig[]
  isLoading: boolean
  error: string | null
  isUsingFirebase: boolean
  updateDayDetails: (
    date: string,
    details: Partial<DayDetails>,
  ) => Promise<void>
  addSubjectConfig: (name: string) => Promise<void>
  removeSubjectConfig: (id: string) => Promise<void>
  updateSubjectConfig: (id: string, name: string) => Promise<void>
  toggleSubjectHasTopics: (id: string) => Promise<void>
  addTopicToSubject: (subjectId: string, topic: string) => Promise<void>
  removeTopicFromSubject: (subjectId: string, topic: string) => Promise<void>
  updateTopicInSubject: (
    subjectId: string,
    oldTopic: string,
    newTopic: string,
  ) => Promise<void>
  isTopicInUse: (subjectId: string, topic: string) => boolean
}

export function useFirebase(goalId: string): UseFirebaseReturn {
  const { user, isLoading: authLoading } = useAuth()
  const [dayDetails, setDayDetails] = useState<Record<string, DayDetails>>({})
  const [subjectConfigs, setSubjectConfigs] = useState<SubjectConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingFirebase, setIsUsingFirebase] = useState(false)

  // Get user ID for storage
  const userId = user?.uid || 'default_user'

  // Storage keys scoped to user and goal
  const dayDetailsKey = getStorageKey(userId, goalId, 'dayDetails')
  const subjectConfigsKey = getStorageKey(userId, goalId, 'subjectConfigs')

  const normalizeDayDetailsRecord = (
    record: Record<string, DayDetails>,
  ): Record<string, DayDetails> => {
    const normalized: Record<string, DayDetails> = {}
    Object.entries(record).forEach(([iso, details]) => {
      const legacyTravel = (details as unknown as Record<string, unknown>).travel
      const travelPlans = details.travelPlans
        ? [...details.travelPlans]
        : legacyTravel
        ? Array.isArray(legacyTravel)
          ? legacyTravel
          : [legacyTravel]
        : []

      // Support both agendaItems and plannedItems for backward compatibility
      const agendaSource = details.agendaItems || details.plannedItems || []
      const normalizedAgenda =
        agendaSource.map((item) => ({
          ...item,
          subjects: item.subjects || [],
          completed: item.completed || false,
          sequenceId: item.sequenceId || item.recurrenceId || item.id,
        }))

      normalized[iso] = {
        ...details,
        travelPlans,
        agendaItems: normalizedAgenda,
        // Keep plannedItems for backward compatibility
        plannedItems: normalizedAgenda,
      }
    })
    return normalized
  }

  // Load initial data
  useEffect(() => {
    async function loadData() {
      if (!goalId || authLoading) {
        if (!authLoading && !goalId) {
          setIsLoading(false)
        }
        return
      }

      if (!user) {
        setIsLoading(false)
        setDayDetails({})
        setSubjectConfigs([])
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        await initFirebase()

        const loadedDayDetails = await loadDayDetailsFromFirebase(userId, goalId)
        const loadedSubjectConfigs = await loadSubjectConfigsFromFirebase(
          userId,
          goalId,
        )

        if (loadedDayDetails !== null && loadedSubjectConfigs !== null) {
          setIsUsingFirebase(true)
          const normalized = normalizeDayDetailsRecord(loadedDayDetails)
          
          setDayDetails(normalized)
          setSubjectConfigs(loadedSubjectConfigs)

          saveToStorage(dayDetailsKey, normalized)
          saveToStorage(subjectConfigsKey, loadedSubjectConfigs)
        } else {
          setIsUsingFirebase(false)
          const localData = normalizeDayDetailsRecord(loadFromStorage(dayDetailsKey, {}))
          setDayDetails(localData)
          setSubjectConfigs(loadFromStorage(subjectConfigsKey, []))
        }
      } catch (err) {
        logger.error('Load failed', err)
        setError('Using offline mode')
        setIsUsingFirebase(false)

        setDayDetails(normalizeDayDetailsRecord(loadFromStorage(dayDetailsKey, {})))
        setSubjectConfigs(loadFromStorage(subjectConfigsKey, []))
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [goalId, userId, authLoading, user, dayDetailsKey, subjectConfigsKey])

  // Update day details
  const updateDayDetails = useCallback(
    async (date: string, updates: Partial<DayDetails>) => {
      let savedDetails: DayDetails | null = null

      // Use functional setState to always get the latest state
      setDayDetails((prevState) => {
        const currentDetails = prevState[date] || {
          status: null,
          subject: '',
          topic: '',
          subjects: [],
          note: '',
          directHours: 0,
          agendaItems: [],
          plannedItems: [], // backward compatibility
          travelPlans: [],
        }

        const newDetails: DayDetails = {
          ...currentDetails,
          ...updates,
        }

        savedDetails = newDetails

        const updated = {
          ...prevState,
          [date]: newDetails,
        }

        // Save to localStorage
        saveToStorage(dayDetailsKey, updated)

        return updated
      })

      // Wait for state update to complete
      await new Promise(resolve => setTimeout(resolve, 0))

      // Save to Firebase (runs after state update)
      if (isUsingFirebase && user && savedDetails) {
        const success = await saveDayDetailsToFirebase(user.uid, goalId, date, savedDetails, updates)
        if (!success) {
          logger.error('Save failed')
        }
      }
    },
    [isUsingFirebase, user, goalId, dayDetailsKey],
  )

  // Add subject config
  const addSubjectConfig = useCallback(
    async (name: string) => {
      if (!name.trim()) return
      if (
        subjectConfigs.some(
          (s) => s.name.toLowerCase() === name.trim().toLowerCase(),
        )
      )
        return

      const newConfig: SubjectConfig = {
        id: `subject_${Date.now()}`,
        name: name.trim(),
        topics: [],
      }

      const newConfigs = [...subjectConfigs, newConfig]
      setSubjectConfigs(newConfigs)
      saveToStorage(subjectConfigsKey, newConfigs)

      if (isUsingFirebase && user) {
        await saveSubjectConfigsToFirebase(user.uid, goalId, newConfigs)
      }
    },
    [subjectConfigs, isUsingFirebase, user, goalId, subjectConfigsKey],
  )

  // Remove subject config
  const removeSubjectConfig = useCallback(
    async (id: string) => {
      const newConfigs = subjectConfigs.filter((s) => s.id !== id)
      setSubjectConfigs(newConfigs)
      saveToStorage(subjectConfigsKey, newConfigs)

      if (isUsingFirebase && user) {
        await saveSubjectConfigsToFirebase(user.uid, goalId, newConfigs)
      }
    },
    [subjectConfigs, isUsingFirebase, user, goalId, subjectConfigsKey],
  )

  // Update subject config name
  const updateSubjectConfig = useCallback(
    async (id: string, name: string) => {
      if (!name.trim()) return

      const newConfigs = subjectConfigs.map((s) =>
        s.id === id ? { ...s, name: name.trim() } : s,
      )
      setSubjectConfigs(newConfigs)
      saveToStorage(subjectConfigsKey, newConfigs)

      if (isUsingFirebase && user) {
        await saveSubjectConfigsToFirebase(user.uid, goalId, newConfigs)
      }
    },
    [subjectConfigs, isUsingFirebase, user, goalId, subjectConfigsKey],
  )

  // Toggle subject hasTopics setting
  const toggleSubjectHasTopics = useCallback(
    async (id: string) => {
      const newConfigs = subjectConfigs.map((s) =>
        s.id === id ? { ...s, hasTopics: !(s.hasTopics ?? true) } : s,
      )
      setSubjectConfigs(newConfigs)
      saveToStorage(subjectConfigsKey, newConfigs)

      if (isUsingFirebase && user) {
        await saveSubjectConfigsToFirebase(user.uid, goalId, newConfigs)
      }
    },
    [subjectConfigs, isUsingFirebase, user, goalId, subjectConfigsKey],
  )

  // Add topic to subject
  const addTopicToSubject = useCallback(
    async (subjectId: string, topic: string) => {
      if (!topic.trim()) return

      const subject = subjectConfigs.find((s) => s.id === subjectId)
      if (!subject) return
      if (subject.topics.includes(topic.trim())) return

      const newConfigs = subjectConfigs.map((s) =>
        s.id === subjectId ? { ...s, topics: [...s.topics, topic.trim()] } : s,
      )
      setSubjectConfigs(newConfigs)
      saveToStorage(subjectConfigsKey, newConfigs)

      if (isUsingFirebase && user) {
        await saveSubjectConfigsToFirebase(user.uid, goalId, newConfigs)
      }
    },
    [subjectConfigs, isUsingFirebase, user, goalId, subjectConfigsKey],
  )

  // Remove topic from subject
  const removeTopicFromSubject = useCallback(
    async (subjectId: string, topic: string) => {
      const newConfigs = subjectConfigs.map((s) =>
        s.id === subjectId
          ? { ...s, topics: s.topics.filter((t) => t !== topic) }
          : s,
      )
      setSubjectConfigs(newConfigs)
      saveToStorage(subjectConfigsKey, newConfigs)

      if (isUsingFirebase && user) {
        await saveSubjectConfigsToFirebase(user.uid, goalId, newConfigs)
      }
    },
    [subjectConfigs, isUsingFirebase, user, goalId, subjectConfigsKey],
  )

  // Update topic name in subject (also updates all day entries that reference it)
  const updateTopicInSubject = useCallback(
    async (subjectId: string, oldTopic: string, newTopic: string) => {
      if (!newTopic.trim() || oldTopic === newTopic.trim()) return

      const trimmedNewTopic = newTopic.trim()

      // Get subject name for updating day entries
      const subject = subjectConfigs.find((s) => s.id === subjectId)
      if (!subject) return

      // Check if new topic name already exists in this subject
      if (subject.topics.includes(trimmedNewTopic)) return

      // Update topic in subject config
      const newConfigs = subjectConfigs.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              topics: s.topics.map((t) =>
                t === oldTopic ? trimmedNewTopic : t,
              ),
            }
          : s,
      )
      setSubjectConfigs(newConfigs)
      saveToStorage(subjectConfigsKey, newConfigs)

      // Update all day entries that reference this topic for this subject
      const updatedDayDetails = { ...dayDetails }
      let hasChanges = false

      Object.entries(updatedDayDetails).forEach(([date, details]) => {
        if (details.subjects) {
          const updatedSubjects = details.subjects.map((entry) => {
            if (
              entry.subject === subject.name &&
              entry.topics.includes(oldTopic)
            ) {
              hasChanges = true
              return {
                ...entry,
                topics: entry.topics.map((t) =>
                  t === oldTopic ? trimmedNewTopic : t,
                ),
              }
            }
            return entry
          })
          if (hasChanges) {
            updatedDayDetails[date] = { ...details, subjects: updatedSubjects }
          }
        }
      })

      if (hasChanges) {
        setDayDetails(updatedDayDetails)
        saveToStorage(dayDetailsKey, updatedDayDetails)

        // Save updated day entries to Firebase
        if (isUsingFirebase && user) {
          Object.entries(updatedDayDetails).forEach(async ([date, details]) => {
            await saveDayDetailsToFirebase(user.uid, goalId, date, details)
          })
        }
      }

      if (isUsingFirebase && user) {
        await saveSubjectConfigsToFirebase(user.uid, goalId, newConfigs)
      }
    },
    [
      subjectConfigs,
      dayDetails,
      isUsingFirebase,
      user,
      goalId,
      subjectConfigsKey,
      dayDetailsKey,
    ],
  )

  // Check if a topic is in use in any day entry
  const isTopicInUse = useCallback(
    (subjectId: string, topic: string): boolean => {
      const subject = subjectConfigs.find((s) => s.id === subjectId)
      if (!subject) return false

      // Check all day entries for this topic
      return Object.values(dayDetails).some((details) => {
        if (!details.subjects) return false
        return details.subjects.some(
          (entry) =>
            entry.subject === subject.name && entry.topics.includes(topic),
        )
      })
    },
    [subjectConfigs, dayDetails],
  )

  return {
    dayDetails,
    subjectConfigs,
    isLoading: isLoading || authLoading,
    error,
    isUsingFirebase,
    updateDayDetails,
    addSubjectConfig,
    removeSubjectConfig,
    updateSubjectConfig,
    toggleSubjectHasTopics,
    addTopicToSubject,
    removeTopicFromSubject,
    updateTopicInSubject,
    isTopicInUse,
  }
}
