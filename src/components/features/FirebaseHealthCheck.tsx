'use client'

import { useState, useEffect } from 'react'
import { checkFirebaseAccess, refreshAuthToken, type FirebaseDiagnostics } from '@/lib/firebase-diagnostics'
import { Card } from '@/components/ui/Card'

export function FirebaseHealthCheck() {
  const [diagnostics, setDiagnostics] = useState<FirebaseDiagnostics | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const runCheck = async () => {
    setIsChecking(true)
    try {
      const result = await checkFirebaseAccess()
      setDiagnostics(result)
    } catch (error) {
      console.error('Error checking Firebase access:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleRefreshToken = async () => {
    setIsRefreshing(true)
    try {
      const success = await refreshAuthToken()
      if (success) {
        // Re-run the check after refreshing
        await runCheck()
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    runCheck()
  }, [])

  if (!diagnostics) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white/60">Checking Firebase access...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Firebase Health Check</h3>
        <button
          onClick={runCheck}
          disabled={isChecking}
          className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors disabled:opacity-50"
        >
          {isChecking ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-3 text-sm">
        {/* Mode */}
        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <span className="text-white/60">Mode</span>
          <span className="font-medium text-white">
            {diagnostics.usingEmulator ? '🧪 Emulator' : '🌐 Production'}
          </span>
        </div>

        {/* Authentication Status */}
        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <span className="text-white/60">Authentication</span>
          <span className={`font-medium ${diagnostics.isAuthenticated ? 'text-green-400' : 'text-red-400'}`}>
            {diagnostics.isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
          </span>
        </div>

        {diagnostics.isAuthenticated && (
          <>
            {/* User Email */}
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Email</span>
              <span className="font-medium text-white truncate ml-4 max-w-[200px]">
                {diagnostics.email}
              </span>
            </div>

            {/* Token Status */}
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Token Status</span>
              <span className={`font-medium ${diagnostics.isTokenExpired ? 'text-red-400' : 'text-green-400'}`}>
                {diagnostics.isTokenExpired ? '❌ Expired' : '✅ Valid'}
              </span>
            </div>

            {/* Token Expiration */}
            {!diagnostics.isTokenExpired && (
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-white/60">Expires In</span>
                <span className="font-medium text-white">
                  {diagnostics.tokenExpiresIn}
                </span>
              </div>
            )}

            {/* Firestore Access */}
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Firestore Access</span>
              <span className={`font-medium ${diagnostics.firestoreAccessWorking ? 'text-green-400' : 'text-red-400'}`}>
                {diagnostics.firestoreAccessWorking ? '✅ Working' : '❌ Failed'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Error Message */}
      {diagnostics.error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">⚠️ {diagnostics.error}</p>
        </div>
      )}

      {/* Recommendations */}
      {diagnostics.isTokenExpired && (
        <div className="mt-4 space-y-3">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-400">
              💡 Your authentication token has expired. Try refreshing it or sign out and sign in again.
            </p>
          </div>
          <button
            onClick={handleRefreshToken}
            disabled={isRefreshing}
            className="w-full px-4 py-2 bg-gradient-to-r from-[#007AFF] to-[#AF52DE] hover:from-[#007AFF]/90 hover:to-[#AF52DE]/90 disabled:from-white/10 disabled:to-white/10 text-white font-medium rounded-lg transition-all disabled:cursor-not-allowed"
          >
            {isRefreshing ? 'Refreshing Token...' : 'Refresh Token'}
          </button>
        </div>
      )}

      {!diagnostics.isAuthenticated && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-400">
            💡 Please sign in to check your Firestore access.
          </p>
        </div>
      )}

      {diagnostics.isAuthenticated && !diagnostics.isTokenExpired && diagnostics.firestoreAccessWorking && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400">
            ✅ All systems operational! Your Firebase access is working correctly.
          </p>
        </div>
      )}
    </Card>
  )
}
