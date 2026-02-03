/**
 * Server-only map of (pluginId, action) -> handler.
 * Import only action modules here so the API route does not pull in React or plugin UI.
 */
import { coreHandlers } from './core-ai-handlers'
import {
  executiveGoalChat,
  generateTasks,
  summarizeProgress,
} from '@goal-chaser/plugin-executive-goal/actions'
import {
  languageTutorChat,
  generateLearning,
  saveProgress,
} from '@goal-chaser/plugin-language-tutor/actions'

type ActionHandler = (payload: unknown) => Promise<unknown>

const pluginHandlers: Record<string, Record<string, ActionHandler>> = {
  _core: coreHandlers as Record<string, ActionHandler>,
  executiveGoal: {
    chat: (p) => executiveGoalChat(p),
    generateTasks: (p) => generateTasks(p),
    summarizeProgress: (p) => summarizeProgress(p),
  },
  languageTutor: {
    chat: (p) => languageTutorChat(p),
    generateLearning: (p) => generateLearning(p),
    saveProgress: (p) => saveProgress(p),
  },
}

export function getPluginActionHandler(
  pluginId: string,
  action: string
): ActionHandler | undefined {
  return pluginHandlers[pluginId]?.[action]
}
