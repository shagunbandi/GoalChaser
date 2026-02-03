'use client'

import { FirebaseHealthCheck } from '@/components/features'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'

export default function DebugPage() {
  const { user, signInWithEmail, signOut, isLoading } = useAuth()

  const handleTestSignIn = async () => {
    try {
      await signInWithEmail('test@test.com', 'Test@1234')
    } catch (error) {
      console.error('Sign in failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#1a1a24] to-[#0a0a12] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🔧 Debug Dashboard
          </h1>
          <p className="text-white/60">
            Backup and restore your data
          </p>
        </div>

        {/* Data Management Tools */}
        {user && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Data Management</h2>
            <div className="grid grid-cols-2 gap-4">
              <a
                href="/debug/backup"
                className="p-6 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-center transition-colors group"
              >
                <div className="text-4xl mb-2">💾</div>
                <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 mb-1">
                  Download Backup
                </h3>
                <p className="text-sm text-white/60">
                  Export all your data to JSON
                </p>
              </a>
              
              <a
                href="/debug/restore"
                className="p-6 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-center transition-colors group"
              >
                <div className="text-4xl mb-2">📤</div>
                <h3 className="text-lg font-semibold text-white group-hover:text-green-400 mb-1">
                  Upload & Restore
                </h3>
                <p className="text-sm text-white/60">
                  Restore data from JSON backup
                </p>
              </a>
            </div>
          </Card>
        )}

        {/* Auth Status Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Authentication</h2>
          
          {user ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-medium mb-2">✅ Signed In</p>
                <p className="text-sm text-white/60">Email: {user.email}</p>
                <p className="text-sm text-white/60">UID: {user.uid}</p>
              </div>
              
              <button
                onClick={signOut}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 font-medium mb-2">⚠️ Not Signed In</p>
                <p className="text-sm text-white/60">
                  Sign in to test Firebase access and token management
                </p>
              </div>
              
              <button
                onClick={handleTestSignIn}
                disabled={isLoading}
                className="px-6 py-3 bg-gradient-to-r from-[#007AFF] to-[#AF52DE] hover:from-[#007AFF]/90 hover:to-[#AF52DE]/90 disabled:from-white/10 disabled:to-white/10 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign In with Test Account'}
              </button>
              
              <p className="text-xs text-white/40 text-center">
                Using: test@test.com / Test@1234
              </p>
            </div>
          )}
        </Card>

        {/* Firebase Health Check */}
        {user && <FirebaseHealthCheck />}
      </div>
    </div>
  )
}
