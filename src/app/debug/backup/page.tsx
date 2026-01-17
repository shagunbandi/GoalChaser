'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { getFirestore, collection, getDocs } from 'firebase/firestore'
import { getFirebaseApp } from '@/lib/firebase-service'

interface BackupStats {
  collections: number
  documents: number
  subcollections: number
  size: number
}

export default function BackupPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState<string[]>([])
  const [stats, setStats] = useState<BackupStats>({
    collections: 0,
    documents: 0,
    subcollections: 0,
    size: 0
  })

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const prefix = {
      info: '📝',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type]
    setProgress(prev => [...prev, `${prefix} ${message}`])
  }

  /**
   * Get known subcollections based on the current path
   */
  const getKnownSubcollections = (path: string[], docId: string): string[] => {
    const pathStr = path.join('/')

    // User's goals collection (path: users/{userId}/goals)
    if (pathStr.match(/^users\/[^/]+\/goals$/)) {
      return [
        'days',
        'settings',
        'budgets',
        'sips',
        'travelPlans',
        'addons'
      ]
    }

    // Goal's addons collection (path: users/{userId}/goals/{goalId}/addons)
    if (pathStr.match(/^users\/[^/]+\/goals\/[^/]+\/addons$/)) {
      return [
        'calendar',
        'productivity',
        'study',
        'finance',
        'travel'
      ]
    }

    // Add-on specific subcollections
    if (pathStr.includes('/addons/calendar')) {
      return ['days']
    }
    if (pathStr.includes('/addons/productivity')) {
      return ['days', 'settings']
    }
    if (pathStr.includes('/addons/study')) {
      return ['days', 'settings']
    }
    if (pathStr.includes('/addons/finance')) {
      return ['budgets', 'sips', 'transactions']
    }
    if (pathStr.includes('/addons/travel')) {
      return ['plans']
    }

    // Goal's settings collection (path: users/{userId}/goals/{goalId}/settings)
    if (pathStr.match(/^users\/[^/]+\/goals\/[^/]+\/settings$/)) {
      return ['subjectConfigs', 'addonsConfig']
    }

    return []
  }

  /**
   * Recursively export a collection and all its subcollections
   */
  const exportCollection = async (
    db: any,
    collectionRef: any,
    path: string[] = [],
    currentStats: BackupStats
  ): Promise<any> => {
    const collectionName = collectionRef.id || collectionRef.path.split('/').pop()
    const currentPath = [...path, collectionName]
    
    addLog(`Reading: ${currentPath.join('/')}`)
    currentStats.collections++

    const snapshot = await getDocs(collectionRef)
    const documents: any = {}

    for (const docSnap of snapshot.docs) {
      currentStats.documents++
      const docData = docSnap.data()
      const docId = docSnap.id

      // Store document data
      documents[docId] = {
        _data: docData,
        _subcollections: {},
      }

      // Check for known subcollections
      const subcollectionsToCheck = getKnownSubcollections(currentPath, docId)

      // Export each subcollection
      for (const subCollectionName of subcollectionsToCheck) {
        try {
          // Build path manually to avoid TypeScript issues with spread
          const pathParts = [...currentPath, docId, subCollectionName]
          let subCollectionRef
          
          if (pathParts.length === 3) {
            subCollectionRef = collection(db, pathParts[0], pathParts[1], pathParts[2])
          } else if (pathParts.length === 5) {
            subCollectionRef = collection(db, pathParts[0], pathParts[1], pathParts[2], pathParts[3], pathParts[4])
          } else if (pathParts.length === 7) {
            subCollectionRef = collection(db, pathParts[0], pathParts[1], pathParts[2], pathParts[3], pathParts[4], pathParts[5], pathParts[6])
          } else if (pathParts.length === 9) {
            subCollectionRef = collection(db, pathParts[0], pathParts[1], pathParts[2], pathParts[3], pathParts[4], pathParts[5], pathParts[6], pathParts[7], pathParts[8])
          } else {
            continue // Skip if path is too deep
          }
          
          const subSnapshot = await getDocs(subCollectionRef)
          
          if (!subSnapshot.empty) {
            currentStats.subcollections++
            documents[docId]._subcollections[subCollectionName] = await exportCollection(
              db,
              subCollectionRef,
              [...currentPath, docId],
              currentStats
            )
          }
        } catch (error) {
          // Subcollection doesn't exist or can't be read, skip it
        }
      }
    }

    return documents
  }

  /**
   * Export entire database for the current user
   */
  const exportDatabase = async (db: any, userId: string) => {
    const database: any = {}
    const currentStats = { ...stats }

    addLog(`\nExporting data for user: ${userId}`)

    try {
      // Export user's goals collection (this is what we have access to)
      const goalsRef = collection(db, 'users', userId, 'goals')
      const goalsData = await exportCollection(db, goalsRef, ['users', userId], currentStats)
      
      database.goals = goalsData

      // Try to get user settings if they exist
      try {
        const settingsRef = collection(db, 'users', userId, 'settings')
        const settingsSnapshot = await getDocs(settingsRef)
        if (!settingsSnapshot.empty) {
          const settingsData = await exportCollection(db, settingsRef, ['users', userId], currentStats)
          database.settings = settingsData
        }
      } catch (e) {
        // Settings don't exist, skip
      }

    } catch (error: any) {
      addLog(`Error exporting data: ${error.message}`, 'error')
      throw error
    }

    return database
  }

  /**
   * Download JSON file to user's computer
   */
  const downloadJSON = (data: any, filename: string) => {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Run the backup
   */
  const runBackup = async () => {
    if (!user) {
      addLog('Please sign in first', 'error')
      return
    }

    setIsRunning(true)
    setProgress([])
    setStats({
      collections: 0,
      documents: 0,
      subcollections: 0,
      size: 0
    })

    addLog('🚀 Starting database backup...')

    try {
      const app = getFirebaseApp()
      if (!app) {
        addLog('Firebase not initialized', 'error')
        return
      }

      const db = getFirestore(app)
      addLog('Connected to Firestore', 'success')

      const startTime = Date.now()

      // Export the database
      const database = await exportDatabase(db, user.uid)

      // Add metadata
      const output = {
        _metadata: {
          exportedAt: new Date().toISOString(),
          userId: user.uid,
          userEmail: user.email,
          stats: {
            collections: stats.collections,
            documents: stats.documents,
            subcollections: stats.subcollections,
          },
        },
        data: database,
      }

      // Calculate size
      const json = JSON.stringify(output)
      const sizeInMB = (json.length / 1024 / 1024).toFixed(2)
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)

      // Update final stats
      setStats(prev => ({ ...prev, size: parseFloat(sizeInMB) }))

      addLog('\n✨ Backup completed successfully!', 'success')
      addLog(`Collections: ${stats.collections}`, 'info')
      addLog(`Documents: ${stats.documents}`, 'info')
      addLog(`Subcollections: ${stats.subcollections}`, 'info')
      addLog(`Size: ${sizeInMB} MB`, 'info')
      addLog(`Duration: ${duration}s`, 'info')

      // Download the file
      const filename = `goal-chaser-backup-${new Date().toISOString().split('T')[0]}.json`
      downloadJSON(output, filename)
      
      addLog(`\n💾 Downloaded: ${filename}`, 'success')
      addLog('Store this file safely! You can use it to restore your data if needed.', 'warning')

    } catch (error: any) {
      addLog(`Fatal error: ${error.message}`, 'error')
      console.error(error)
    } finally {
      setIsRunning(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#000000] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#000000] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl mb-4">Authentication Required</h1>
          <p className="text-white/60 mb-4">Please sign in to backup your data</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-[#007AFF] text-white rounded-xl"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000000] via-[#1a1a2e] to-[#16213e] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Database Backup</h1>
          <p className="text-white/60">
            Download a complete backup of your Goal Chaser data
          </p>
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <p className="text-blue-300 text-sm">
              💡 This will export all your goals, days, configurations, budgets, and more to a JSON file.
              Store it safely for backup or migration purposes.
            </p>
          </div>
        </div>

        {/* User Info */}
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#007AFF] flex items-center justify-center text-white font-semibold">
              {user.email?.[0].toUpperCase()}
            </div>
            <div>
              <p className="text-white font-medium">{user.email}</p>
              <p className="text-white/60 text-sm">User ID: {user.uid}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={runBackup}
            disabled={isRunning}
            className={`
              px-8 py-4 rounded-xl font-medium text-lg
              ${isRunning 
                ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                : 'bg-[#007AFF] text-white hover:bg-[#0051D5]'
              }
              transition-colors
            `}
          >
            {isRunning ? '📦 Backing up...' : '💾 Download Backup'}
          </button>

          {stats.size > 0 && (
            <div className="text-white/60 text-sm">
              Last backup: {stats.size.toFixed(2)} MB
            </div>
          )}
        </div>

        {/* Stats */}
        {(stats.collections > 0 || stats.documents > 0) && (
          <div className="mb-6 p-6 bg-white/5 border border-white/10 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Backup Statistics</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/60">Collections:</span> 
                <span className="text-white ml-2 font-semibold">{stats.collections}</span>
              </div>
              <div>
                <span className="text-white/60">Documents:</span> 
                <span className="text-white ml-2 font-semibold">{stats.documents}</span>
              </div>
              <div>
                <span className="text-white/60">Subcollections:</span> 
                <span className="text-white ml-2 font-semibold">{stats.subcollections}</span>
              </div>
              <div>
                <span className="text-white/60">File Size:</span> 
                <span className="text-white ml-2 font-semibold">{stats.size.toFixed(2)} MB</span>
              </div>
            </div>
          </div>
        )}

        {/* Progress Log */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-6 h-[500px] overflow-y-auto">
          <h2 className="text-lg font-semibold text-white mb-4">Backup Log</h2>
          {progress.length === 0 ? (
            <div className="text-white/40 text-sm">
              <p className="mb-4">Click "Download Backup" to start</p>
              <div className="space-y-2 text-xs">
                <p>✓ Your data will be exported to a JSON file</p>
                <p>✓ The file will be downloaded to your computer</p>
                <p>✓ No data will be deleted or modified</p>
                <p>✓ Store the backup file safely</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1 font-mono text-xs">
              {progress.map((line, i) => (
                <div key={i} className="text-white/80">{line}</div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-white/5 text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            ← Back to Home
          </button>
          
          <button
            onClick={() => router.push('/debug/restore')}
            className="px-6 py-3 bg-white/5 text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            Go to Restore Tool
          </button>

          <button
            onClick={() => router.push('/debug/migrate')}
            className="px-6 py-3 bg-white/5 text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            Go to Migration Tool
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60">
          <h3 className="text-white font-semibold mb-2">📚 About Backups</h3>
          <ul className="space-y-1 list-disc list-inside">
            <li>Backups include all your goals, calendar entries, budgets, SIPs, and configurations</li>
            <li>The file format is standard JSON and can be inspected with any text editor</li>
            <li>Recommended: Back up before running migrations or major updates</li>
            <li>Store backups securely - they contain your personal data</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
