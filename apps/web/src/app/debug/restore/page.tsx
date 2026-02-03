'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore'
import { getFirebaseApp } from '@/lib/firebase-service'

interface RestoreStats {
  collections: number
  documents: number
  subcollections: number
  errors: number
}

interface BackupData {
  _metadata?: {
    exportedAt: string
    userId?: string
    userEmail?: string
    stats?: any
  }
  data?: {
    goals?: any
    settings?: any
  }
  goals?: any
  settings?: any
}

export default function RestorePage() {
  console.log('[RestorePage] 🎯 Component rendering')
  
  const { user, isLoading: authLoading } = useAuth()
  console.log('[RestorePage] 👤 Auth state:', { user: user?.email || 'null', authLoading })
  
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [backupData, setBackupData] = useState<BackupData | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState<string[]>([])
  const [stats, setStats] = useState<RestoreStats>({
    collections: 0,
    documents: 0,
    subcollections: 0,
    errors: 0
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
   * Handle file selection
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[RestorePage] 📁 File select triggered')
    const file = event.target.files?.[0]
    if (!file) {
      console.log('[RestorePage] ⚠️ No file selected')
      return
    }

    console.log('[RestorePage] 📄 File selected:', file.name, file.size, 'bytes')

    if (!file.name.endsWith('.json')) {
      console.log('[RestorePage] ❌ Invalid file type:', file.name)
      addLog('Please select a JSON file', 'error')
      return
    }

    setSelectedFile(file)
    addLog(`Selected file: ${file.name}`, 'info')

    // Read and parse the file
    console.log('[RestorePage] 📖 Starting to read file...')
    const reader = new FileReader()
    reader.onload = (e) => {
      console.log('[RestorePage] ✅ File read complete, parsing JSON...')
      try {
        const json = JSON.parse(e.target?.result as string)
        console.log('[RestorePage] ✅ JSON parsed successfully, keys:', Object.keys(json))
        setBackupData(json)
        
        // Show metadata if available
        if (json._metadata) {
          console.log('[RestorePage] 📋 Metadata found:', json._metadata)
          addLog(`Backup from: ${json._metadata.exportedAt}`, 'info')
          if (json._metadata.userEmail) {
            addLog(`Original user: ${json._metadata.userEmail}`, 'info')
          }
        }
        
        addLog('Backup file loaded successfully', 'success')
      } catch (error: any) {
        console.error('[RestorePage] ❌ Failed to parse JSON:', error)
        addLog(`Failed to parse JSON: ${error.message}`, 'error')
        setSelectedFile(null)
      }
    }
    reader.onerror = (error) => {
      console.error('[RestorePage] ❌ File reader error:', error)
      addLog('Failed to read file', 'error')
    }
    reader.readAsText(file)
  }

  /**
   * Restore a collection recursively
   */
  const restoreCollection = async (
    db: any,
    collectionData: any,
    path: string[],
    currentStats: RestoreStats,
    batch: any,
    batchCount: { count: number }
  ) => {
    console.log('[RestorePage] 📦 Restoring collection at path:', path.join('/'))
    console.log('[RestorePage] 📊 Number of documents in collection:', Object.keys(collectionData).length)
    
    let currentBatch = batch

    for (const [docId, docData] of Object.entries(collectionData)) {
      if (typeof docData !== 'object' || !docData) continue

      const data = (docData as any)._data || {}
      const subcollections = (docData as any)._subcollections || {}
      
      console.log('[RestorePage] 📄 Processing document:', docId, 'at', path.join('/'))

      try {
        // Build document reference
        const docPath = [...path, docId]
        let docRef
        
        if (docPath.length === 2) {
          docRef = doc(db, docPath[0], docPath[1])
        } else if (docPath.length === 4) {
          docRef = doc(db, docPath[0], docPath[1], docPath[2], docPath[3])
        } else if (docPath.length === 6) {
          docRef = doc(db, docPath[0], docPath[1], docPath[2], docPath[3], docPath[4], docPath[5])
        } else if (docPath.length === 8) {
          docRef = doc(db, docPath[0], docPath[1], docPath[2], docPath[3], docPath[4], docPath[5], docPath[6], docPath[7])
        } else if (docPath.length === 10) {
          docRef = doc(db, docPath[0], docPath[1], docPath[2], docPath[3], docPath[4], docPath[5], docPath[6], docPath[7], docPath[8], docPath[9])
        } else {
          addLog(`Skipping document with unsupported path depth: ${docPath.join('/')}`, 'warning')
          continue
        }

        // Add to batch
        currentBatch.set(docRef, {
          ...data,
          restoredAt: new Date().toISOString()
        })
        batchCount.count++
        currentStats.documents++

        // Commit batch if it's getting large (500 is Firestore limit)
        if (batchCount.count >= 450) {
          await currentBatch.commit()
          addLog(`Committed batch of ${batchCount.count} documents`, 'info')
          currentBatch = writeBatch(db)
          batchCount.count = 0
        }

        // Restore subcollections
        for (const [subCollectionName, subCollectionData] of Object.entries(subcollections)) {
          if (typeof subCollectionData !== 'object') continue
          
          currentStats.subcollections++
          currentBatch = await restoreCollection(
            db,
            subCollectionData,
            [...docPath, subCollectionName],
            currentStats,
            currentBatch,
            batchCount
          )
        }
      } catch (error: any) {
        addLog(`Failed to restore ${path.join('/')}/${docId}: ${error.message}`, 'error')
        currentStats.errors++
      }
    }

    return currentBatch
  }

  /**
   * Restore the database
   */
  const runRestore = async () => {
    console.log('[RestorePage] 🚀 Restore button clicked')
    
    if (!user) {
      console.log('[RestorePage] ❌ No user found')
      addLog('Please sign in first', 'error')
      return
    }

    if (!backupData) {
      console.log('[RestorePage] ❌ No backup data found')
      addLog('Please select a backup file first', 'error')
      return
    }

    console.log('[RestorePage] ⚠️ Showing confirmation dialog...')
    if (!window.confirm('⚠️ WARNING: This will overwrite existing data. Are you sure you want to restore?')) {
      console.log('[RestorePage] 🚫 User cancelled restore')
      return
    }

    console.log('[RestorePage] ✅ User confirmed, starting restore...')
    setIsRunning(true)
    setProgress([])
    setStats({
      collections: 0,
      documents: 0,
      subcollections: 0,
      errors: 0
    })

    addLog('🚀 Starting database restoration...')
    console.log('[RestorePage] 📊 Backup data structure:', Object.keys(backupData))

    try {
      console.log('[RestorePage] 🔥 Getting Firebase app...')
      const app = getFirebaseApp()
      if (!app) {
        console.error('[RestorePage] ❌ Firebase app is null')
        addLog('Firebase not initialized', 'error')
        return
      }
      console.log('[RestorePage] ✅ Firebase app initialized')

      console.log('[RestorePage] 📊 Getting Firestore instance...')
      const db = getFirestore(app)
      console.log('[RestorePage] ✅ Got Firestore instance')
      addLog('Connected to Firestore', 'success')

      const startTime = Date.now()
      const currentStats = { ...stats }

      // Get data from backup (support both formats)
      console.log('[RestorePage] 📋 Extracting data from backup...')
      const dataToRestore = backupData.data || backupData
      const goalsData = dataToRestore.goals
      const settingsData = dataToRestore.settings
      
      console.log('[RestorePage] 📊 Data to restore:', {
        hasGoals: !!goalsData,
        hasSettings: !!settingsData,
        goalsCount: goalsData ? Object.keys(goalsData).length : 0,
        settingsCount: settingsData ? Object.keys(settingsData).length : 0
      })

      if (!goalsData && !settingsData) {
        console.error('[RestorePage] ❌ No data found in backup')
        addLog('No data found in backup file', 'error')
        return
      }

      // Create initial batch
      let batch = writeBatch(db)
      const batchCount = { count: 0 }

      // Restore goals
      if (goalsData) {
        addLog('\nRestoring goals...')
        currentStats.collections++
        batch = await restoreCollection(
          db,
          goalsData,
          ['users', user.uid, 'goals'],
          currentStats,
          batch,
          batchCount
        )
      }

      // Restore settings
      if (settingsData) {
        addLog('\nRestoring settings...')
        currentStats.collections++
        batch = await restoreCollection(
          db,
          settingsData,
          ['users', user.uid, 'settings'],
          currentStats,
          batch,
          batchCount
        )
      }

      // Commit final batch
      if (batchCount.count > 0) {
        await batch.commit()
        addLog(`Committed final batch of ${batchCount.count} documents`, 'info')
      }

      setStats(currentStats)

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)

      addLog('\n✨ Restoration complete!', 'success')
      addLog(`Collections: ${currentStats.collections}`, 'info')
      addLog(`Documents: ${currentStats.documents}`, 'info')
      addLog(`Subcollections: ${currentStats.subcollections}`, 'info')
      addLog(`Errors: ${currentStats.errors}`, currentStats.errors > 0 ? 'warning' : 'info')
      addLog(`Duration: ${duration}s`, 'info')

      if (currentStats.errors === 0) {
        addLog('\n🎉 All data restored successfully!', 'success')
        addLog('You can now refresh your app to see the restored data.', 'info')
      } else {
        addLog('\n⚠️ Restoration completed with some errors. Check the log above.', 'warning')
      }

    } catch (error: any) {
      addLog(`Fatal error: ${error.message}`, 'error')
      console.error(error)
    } finally {
      setIsRunning(false)
    }
  }

  if (authLoading) {
    console.log('[RestorePage] ⏳ Showing loading state - authLoading is true')
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#000000] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }
  
  console.log('[RestorePage] ✅ Auth loading complete, rendering main content')

  if (!user) {
    console.log('[RestorePage] 🚫 No user, showing auth required screen')
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#000000] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl mb-4">Authentication Required</h1>
          <p className="text-white/60 mb-4">Please sign in to restore your data</p>
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
  
  console.log('[RestorePage] ✅ User authenticated, showing restore interface')

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000000] via-[#1a1a2e] to-[#16213e] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Database Restore</h1>
          <p className="text-white/60">
            Upload and restore your Goal Chaser data from a backup file
          </p>
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-300 text-sm font-semibold mb-2">
              ⚠️ WARNING: This will overwrite your current data!
            </p>
            <p className="text-red-300 text-sm">
              Make sure to backup your current data before restoring. The restoration process will add/update documents but won't delete existing data.
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
              <p className="text-white/60 text-sm">Data will be restored to this account</p>
            </div>
          </div>
        </div>

        {/* File Selection */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="flex gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRunning}
              className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📁 Select Backup File
            </button>

            {selectedFile && (
              <div className="flex-1 flex items-center px-4 py-4 bg-white/5 border border-white/10 rounded-xl">
                <span className="text-white/80 text-sm truncate">{selectedFile.name}</span>
                <span className="ml-auto text-white/60 text-xs">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Restore Button */}
        {backupData && (
          <div className="mb-6">
            <button
              onClick={runRestore}
              disabled={isRunning || !selectedFile}
              className={`
                w-full px-8 py-4 rounded-xl font-medium text-lg
                ${isRunning 
                  ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                  : 'bg-red-500 text-white hover:bg-red-600'
                }
                transition-colors
              `}
            >
              {isRunning ? '⏳ Restoring...' : '🔄 Restore Data'}
            </button>
          </div>
        )}

        {/* Stats */}
        {(stats.documents > 0 || stats.errors > 0) && (
          <div className="mb-6 p-6 bg-white/5 border border-white/10 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Restoration Statistics</h2>
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
                <span className="text-white/60">Errors:</span> 
                <span className={`ml-2 font-semibold ${stats.errors > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {stats.errors}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Progress Log */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-6 h-[500px] overflow-y-auto">
          <h2 className="text-lg font-semibold text-white mb-4">Restoration Log</h2>
          {progress.length === 0 ? (
            <div className="text-white/40 text-sm">
              <p className="mb-4">Select a backup file to begin</p>
              <div className="space-y-2 text-xs">
                <p>1. Click "Select Backup File" and choose your JSON backup</p>
                <p>2. Review the file information</p>
                <p>3. Click "Restore Data" to begin restoration</p>
                <p>4. Wait for the process to complete</p>
                <p className="text-red-400 mt-4">⚠️ This will overwrite existing data!</p>
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
            onClick={() => router.push('/debug')}
            className="px-6 py-3 bg-white/5 text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            Go to Debug Dashboard
          </button>
          
          <button
            onClick={() => router.push('/debug/backup')}
            className="px-6 py-3 bg-white/5 text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            Go to Backup Tool
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60">
          <h3 className="text-white font-semibold mb-2">📚 About Restoration</h3>
          <ul className="space-y-1 list-disc list-inside">
            <li>Restoration will write/update documents in your current account</li>
            <li>Existing documents with the same IDs will be overwritten</li>
            <li>Documents not in the backup will remain unchanged</li>
            <li>The process uses batched writes for better performance</li>
            <li>A timestamp is added to each document (restoredAt field)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
