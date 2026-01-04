import { getTestFirestore } from '../helpers/firebase-setup'
import { doc, setDoc } from 'firebase/firestore'

export interface SeedSubjectConfigOptions {
  userId: string
  goalId: string
  subject: string
  topics?: string[]
}

/**
 * Seeds a subject configuration for a goal.
 * This creates the subject in the subjectConfigs collection so it appears in the UI.
 */
export async function seedSubjectConfig(options: SeedSubjectConfigOptions): Promise<void> {
  const db = getTestFirestore()
  const { userId, goalId, subject, topics = [] } = options

  const configDocRef = doc(db, 'users', userId, 'goals', goalId, 'subjectConfigs', subject)
  
  await setDoc(configDocRef, {
    subject,
    topics,
    updatedAt: new Date().toISOString(),
  })
}

/**
 * Seeds multiple subject configurations at once.
 */
export async function seedMultipleSubjectConfigs(
  userId: string,
  goalId: string,
  configs: Array<{ subject: string; topics?: string[] }>
): Promise<void> {
  for (const config of configs) {
    await seedSubjectConfig({
      userId,
      goalId,
      subject: config.subject,
      topics: config.topics,
    })
  }
}

