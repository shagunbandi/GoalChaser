#!/usr/bin/env node

/**
 * Migration script to convert old backup format to new plugin architecture
 *
 * Old structure:
 *   goals/{goalId}/days/{date} - all data mixed together
 *   goals/{goalId}/settings/subjectConfigs - subject configs
 *
 * New structure:
 *   goals/{goalId}/addons/productivity/days/{date} - productivity data
 *   goals/{goalId}/addons/productivity/settings/config - area configs
 *   goals/{goalId}/addons/study/days/{date} - study data
 *   goals/{goalId}/addons/study/settings/config - subject configs
 *   goals/{goalId}/addons/travel/days/{date} - travel data
 *   goals/{goalId}/days/{date} - calendar notes
 */

import fs from 'fs'
import path from 'path'

/**
 * Determine mode based on goal's successCriterion
 * - type: "hours" → study
 * - type: "productivity" → productivity
 * - default → productivity
 */
function determineModeFromGoal(goalData) {
  const successCriterion = goalData._data?.successCriterion

  if (successCriterion?.type === 'hours') {
    return 'study'
  } else if (successCriterion?.type === 'productivity') {
    return 'productivity'
  }

  // Default: if no criterion, assume productivity
  return 'productivity'
}

/**
 * Extract productivity data from old day data
 */
function extractProductivityData(dayData, mode) {
  if (mode !== 'productivity') return null

  const data = {
    status: dayData.status ?? null,
    areas: [], // Will map subjects to areas
    directHours: dayData.directHours || 0, // Preserve directHours
    notes: '', // Productivity-specific notes (if any)
  }

  // Map subjects array to areas array, preserving hours
  if (dayData.subjects && Array.isArray(dayData.subjects)) {
    data.areas = dayData.subjects.map((subj) => ({
      area: subj.subject || subj.name || '',
      topics: subj.topics || [],
      hours: subj.hours || 0, // Preserve hours for each area
    }))
  }

  return data
}

/**
 * Extract study data from old day data
 */
function extractStudyData(dayData, mode) {
  if (mode !== 'study') return null

  const data = {
    subjects: dayData.subjects || [],
    directHours: dayData.directHours || 0,
    notes: dayData.note || '',
  }

  return data
}

/**
 * Extract travel data from old day data
 */
function extractTravelData(dayData) {
  if (!dayData.travelPlans || dayData.travelPlans.length === 0) {
    return null
  }

  // Store travel plans as-is
  return {
    plans: dayData.travelPlans,
  }
}

/**
 * Extract calendar notes from old day data
 */
function extractCalendarData(dayData) {
  const note = dayData.note || ''

  if (!note) return null

  return {
    note: note,
    updatedAt: dayData.updatedAt || new Date().toISOString(),
  }
}

/**
 * Convert old subject configs to new area configs (for productivity)
 */
function convertSubjectConfigsToAreas(subjectConfigs) {
  if (!subjectConfigs || !subjectConfigs.configs) {
    return []
  }

  return subjectConfigs.configs.map((config) => ({
    id: config.id,
    name: config.name,
    topics: config.topics || [],
    hasTopics: config.hasTopics ?? true,
  }))
}

/**
 * Convert old subject configs to new subject configs (for study)
 */
function convertSubjectConfigsToStudy(subjectConfigs) {
  if (!subjectConfigs || !subjectConfigs.configs) {
    return []
  }

  return subjectConfigs.configs.map((config) => ({
    id: config.id,
    name: config.name,
    topics: config.topics || [],
    hasTopics: config.hasTopics ?? true,
  }))
}

/**
 * Migrate a single goal
 */
function migrateGoal(goalId, goalData, globalMode) {
  // Auto-detect mode from goal's successCriterion, or use global mode as fallback
  const mode = determineModeFromGoal(goalData) || globalMode
  const goalName = goalData._data?.name || goalId

  console.log(`\n📦 Migrating goal: ${goalName} (${goalId})`)
  console.log(
    `   Mode: ${mode} (based on successCriterion.type: ${
      goalData._data?.successCriterion?.type || 'none'
    })`,
  )

  const newGoal = {
    _data: goalData._data,
    _subcollections: {
      addons: {},
    },
  }

  // Extract old days and settings
  const oldDays = goalData._subcollections?.days || {}
  const oldSettings = goalData._subcollections?.settings || {}

  // Initialize plugin structures
  const productivityDays = {}
  const studyDays = {}
  const travelDays = {}
  const calendarDays = {}

  // Process each day
  let productivityDayCount = 0
  let studyDayCount = 0
  let travelDayCount = 0
  let calendarDayCount = 0

  Object.entries(oldDays).forEach(([date, dayDoc]) => {
    const dayData = dayDoc._data

    // Extract productivity data
    const productivityData = extractProductivityData(dayData, mode)
    if (
      productivityData &&
      (productivityData.status !== null ||
        productivityData.areas.length > 0 ||
        productivityData.directHours > 0)
    ) {
      productivityDays[date] = {
        _data: productivityData,
        _subcollections: {},
      }
      productivityDayCount++
    }

    // Extract study data
    const studyData = extractStudyData(dayData, mode)
    if (
      studyData &&
      (studyData.subjects.length > 0 || studyData.directHours > 0)
    ) {
      studyDays[date] = {
        _data: studyData,
        _subcollections: {},
      }
      studyDayCount++
    }

    // Extract travel data
    const travelData = extractTravelData(dayData)
    if (travelData) {
      travelDays[date] = {
        _data: travelData,
        _subcollections: {},
      }
      travelDayCount++
    }

    // Extract calendar notes
    const calendarData = extractCalendarData(dayData)
    if (calendarData) {
      calendarDays[date] = {
        _data: calendarData,
        _subcollections: {},
      }
      calendarDayCount++
    }
  })

  console.log(`  ✓ Processed days:`)
  console.log(
    `    - Productivity: ${productivityDayCount} (with hours tracked)`,
  )
  console.log(`    - Study: ${studyDayCount}`)
  console.log(`    - Travel: ${travelDayCount}`)
  console.log(`    - Calendar notes: ${calendarDayCount}`)

  // Create productivity addon structure
  if (productivityDayCount > 0 || mode === 'productivity') {
    newGoal._subcollections.addons.productivity = {
      _data: {},
      _subcollections: {},
    }

    // Add days
    if (productivityDayCount > 0) {
      newGoal._subcollections.addons.productivity._subcollections.days =
        productivityDays
    }

    // Add settings/config
    const subjectConfigs = oldSettings.subjectConfigs?._data
    if (subjectConfigs) {
      const areaConfigs = convertSubjectConfigsToAreas(subjectConfigs)
      newGoal._subcollections.addons.productivity._subcollections.settings = {
        config: {
          _data: {
            areas: areaConfigs,
            updatedAt: subjectConfigs.updatedAt || new Date().toISOString(),
          },
          _subcollections: {},
        },
      }
      console.log(
        `  ✓ Created ${areaConfigs.length} area configs for productivity`,
      )
    }
  }

  // Create study addon structure
  if (studyDayCount > 0 || mode === 'study') {
    newGoal._subcollections.addons.study = {
      _data: {},
      _subcollections: {},
    }

    // Add days
    if (studyDayCount > 0) {
      newGoal._subcollections.addons.study._subcollections.days = studyDays
    }

    // Add settings/config
    const subjectConfigs = oldSettings.subjectConfigs?._data
    if (subjectConfigs) {
      const studyConfigs = convertSubjectConfigsToStudy(subjectConfigs)
      newGoal._subcollections.addons.study._subcollections.settings = {
        config: {
          _data: {
            subjects: studyConfigs, // Study plugin expects 'subjects' key
            updatedAt: subjectConfigs.updatedAt || new Date().toISOString(),
          },
          _subcollections: {},
        },
      }
      console.log(
        `  ✓ Created ${studyConfigs.length} subject configs for study`,
      )
    }
  }

  // Create travel addon structure
  if (travelDayCount > 0) {
    newGoal._subcollections.addons.travel = {
      _data: {},
      _subcollections: {
        days: travelDays,
      },
    }
  }

  // Add calendar days (at goal level, not in addons)
  if (calendarDayCount > 0) {
    newGoal._subcollections.days = calendarDays
  }

  return newGoal
}

/**
 * Main migration function
 */
function migrateBackup(inputPath, outputPath, globalMode = 'productivity') {
  console.log('🚀 Starting migration...')
  console.log(`📂 Input: ${inputPath}`)
  console.log(`📂 Output: ${outputPath}`)
  console.log(`⚙️  Global mode (fallback): ${globalMode}`)
  console.log(
    `ℹ️  Each goal will auto-detect its mode from successCriterion.type`,
  )

  // Read input file
  const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'))

  // Create new backup structure
  const newBackup = {
    _metadata: {
      ...inputData._metadata,
      exportedAt: new Date().toISOString(),
      migratedAt: new Date().toISOString(),
      migratedFrom: path.basename(inputPath),
      migrationGlobalMode: globalMode,
      migrationNote: 'Each goal auto-detects mode from successCriterion.type',
    },
    data: {
      goals: {},
    },
  }

  // Migrate each goal
  const goals = inputData.data?.goals || {}
  Object.entries(goals).forEach(([goalId, goalData]) => {
    newBackup.data.goals[goalId] = migrateGoal(goalId, goalData, globalMode)
  })

  // Write output file
  fs.writeFileSync(outputPath, JSON.stringify(newBackup, null, 2))

  console.log('\n✅ Migration complete!')
  console.log(`📝 Output written to: ${outputPath}`)
}

// CLI
const args = process.argv.slice(2)

if (args.length < 2) {
  console.log(`
Usage: node migrate-old-backup.mjs <input.json> <output.json> [mode]

Arguments:
  input.json   - Path to old backup file
  output.json  - Path to write migrated backup
  mode         - Global fallback mode: 'productivity' or 'study' (default: productivity)
               - Each goal auto-detects its mode from successCriterion.type:
                 * type: "hours" → study plugin
                 * type: "productivity" → productivity plugin
                 * fallback → uses global mode

Examples:
  node migrate-old-backup.mjs old.json new.json
  node migrate-old-backup.mjs mittapallisrilekha.json mittapallisrilekha-migrated.json
`)
  process.exit(1)
}

const [inputPath, outputPath, mode = 'productivity'] = args

try {
  migrateBackup(inputPath, outputPath, mode)
} catch (error) {
  console.error('❌ Migration failed:', error.message)
  console.error(error.stack)
  process.exit(1)
}
