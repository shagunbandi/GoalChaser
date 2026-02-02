'use client'

import { AuthForm } from '@/hooks/useAuth'

export function SignInView() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-background">
        <div className="orb-1" />
        <div className="orb-2" />
      </div>
      <div className="noise-overlay" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold tracking-tight text-gradient mb-3">
            Nitya
          </h1>
          <p className="text-white/50 text-base">
            Track your progress, achieve your dreams
          </p>
        </div>

        {/* Sign In Card */}
        <div className="relative bg-white/[0.02] backdrop-blur-[40px] rounded-3xl border border-white/[0.06] p-8 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.2)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-t-3xl" />

          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-white/90 mb-1">
              Welcome Back
            </h2>
            <p className="text-white/50 text-sm">
              Sign in to sync your goals across devices
            </p>
          </div>

          <AuthForm />

          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <p className="text-white/40 text-xs text-center">
              By signing in, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-white/50 text-xs">Analytics</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">📅</div>
            <p className="text-white/50 text-xs">Calendar</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">☁️</div>
            <p className="text-white/50 text-xs">Cloud Sync</p>
          </div>
        </div>
      </div>
    </div>
  )
}

