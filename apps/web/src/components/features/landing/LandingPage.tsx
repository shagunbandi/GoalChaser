'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'

const ROTATING_WORDS = ['Goals', 'Habits', 'Streaks'] as const

export function LandingPage() {
  const router = useRouter()
  const [currentWord, setCurrentWord] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [isTyping, setIsTyping] = useState(true)

  // Build the text to type (only the rotating part)
  const textToType = `Your ${ROTATING_WORDS[currentWord]},`

  // Typing animation effect
  useEffect(() => {
    if (!isTyping) return

    let currentIndex = 0
    setDisplayedText('')

    const typingInterval = setInterval(() => {
      if (currentIndex < textToType.length) {
        setDisplayedText(textToType.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        clearInterval(typingInterval)
        setIsTyping(false)
        // Wait a bit before starting to rotate words
        setTimeout(() => {
          setCurrentWord((prev) => (prev + 1) % ROTATING_WORDS.length)
          setIsTyping(true)
        }, 2000)
      }
    }, 50) // Typing speed: 50ms per character

    return () => clearInterval(typingInterval)
  }, [currentWord, textToType, isTyping])

  // Cursor blink animation
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 530) // Blink every 530ms
    return () => clearInterval(cursorInterval)
  }, [])

  return (
    <div className="min-h-screen">
      <div className="glass-background">
        <div className="orb-1" />
        <div className="orb-2" />
      </div>
      <div className="noise-overlay" />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a12]/70 border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-gradient">
              Nitya
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/signin')}
                className="px-6 py-2 text-sm font-medium glass-button rounded-xl"
              >
                Sign In
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="text-gradient">
                {displayedText}
                <span className={`inline-block w-0.5 h-[1em] bg-gradient-to-b from-[#007AFF] to-[#AF52DE] ml-1 align-middle ${showCursor ? 'opacity-100' : 'opacity-0'}`} style={{ transition: 'opacity 0.1s' }}>
                  |
                </span>
              </span>
              <br />
              <span className="text-white/90">Tracked with </span>
              <span className="text-gradient">Nitya</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/60 mb-12 leading-relaxed">
              Nitya is your personal diary for goals, streaks, and daily tracking.
              Build lasting habits, maintain your streaks, and watch your progress
              unfold. Start your journey with Nitya today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/signin')}
                className="px-8 py-4 text-lg font-semibold glass-button-accent rounded-2xl w-full sm:w-auto"
              >
                Get Started
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white/90 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-white/50">
              Powerful features to help you stay on track
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card hover glow="blue" className="p-8">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-white/90 mb-2">
                Personal Diary
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Your daily personal diary with calendar view. Write notes, track
                activities, and see your journey unfold day by day. Every entry
                is part of your eternal story.
              </p>
            </Card>

            {/* Productivity */}
            <Card hover glow="purple" className="p-8">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-white/90 mb-2">
                Productivity Tracking
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Rate your productivity across different areas of life. Track
                trends and identify patterns to optimize your performance.
              </p>
            </Card>

            {/* Study Hours */}
            <Card hover glow="cyan" className="p-8">
              <div className="text-4xl mb-4">⏱️</div>
              <h3 className="text-xl font-semibold text-white/90 mb-2">
                Study Hours
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Track time spent on different subjects or topics. Monitor your
                learning progress and maintain consistent study habits.
              </p>
            </Card>

            {/* Finance */}
            <Card hover glow="blue" className="p-8">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-white/90 mb-2">
                Finance Management
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Track expenses, income, and budgets. Plan SIPs and monitor your
                financial health with detailed analytics.
              </p>
            </Card>

            {/* Travel */}
            <Card hover glow="purple" className="p-8">
              <div className="text-4xl mb-4">✈️</div>
              <h3 className="text-xl font-semibold text-white/90 mb-2">
                Travel Planning
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Plan and track your travels. Keep notes about destinations,
                itineraries, and experiences.
              </p>
            </Card>

            {/* Analytics */}
            <Card hover glow="cyan" className="p-8">
              <div className="text-4xl mb-4">🔥</div>
              <h3 className="text-xl font-semibold text-white/90 mb-2">
                Streak Tracking
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Build and maintain streaks for your goals. Track your consistency,
                celebrate milestones, and stay motivated with visual progress
                indicators.
              </p>
            </Card>
          </div>
        </section>

        {/* AI Feature */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <Card className="p-12 md:p-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-5xl mb-6">🤖</div>
                <h2 className="text-3xl md:text-4xl font-bold text-white/90 mb-4">
                  Smart Notes, Smarter Tracking
                </h2>
                <p className="text-lg text-white/60 mb-6 leading-relaxed">
                  Write your daily notes in plain English. Our AI understands
                  what you mean and automatically organizes everything—no forms,
                  no spreadsheets, just write.
                </p>
              </div>
              <div>
                <Card className="p-6">
                  <ul className="space-y-4 text-white/70">
                    <li className="flex items-start gap-3">
                      <span className="text-2xl">✨</span>
                      <span className="flex-1">Automatic data extraction from notes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl">🚀</span>
                      <span className="flex-1">Works across all plugins simultaneously</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl">✅</span>
                      <span className="flex-1">Review and confirm before saving</span>
                    </li>
                  </ul>
                </Card>
              </div>
            </div>
          </Card>
        </section>

        {/* About Nitya Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white/90 mb-4">
              Why Nitya?
            </h2>
            <p className="text-xl text-white/50">
              Eternal progress, lasting habits, forever tracking
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card hover className="p-8">
              <h3 className="text-xl font-semibold text-white/90 mb-4">
                Your Eternal Journey
              </h3>
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                Nitya means eternal. Your goals, your progress, your personal diary—
                all preserved forever. Every day you track, every streak you build,
                every goal you achieve becomes part of your eternal story.
              </p>
              <div className="flex flex-wrap gap-2 mt-6">
                <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/70 border border-white/10">
                  Forever Yours
                </span>
                <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/70 border border-white/10">
                  Lasting Habits
                </span>
                <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/70 border border-white/10">
                  Eternal Progress
                </span>
              </div>
            </Card>

            <Card hover className="p-8">
              <h3 className="text-xl font-semibold text-white/90 mb-4">
                Goals, Streaks & Tracking
              </h3>
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                Set meaningful goals, build unbreakable streaks, and track your
                daily progress. Your personal diary captures it all—from productivity
                scores to study hours, from finances to travel. Everything in one
                place, forever.
              </p>
              <div className="flex flex-wrap gap-2 mt-6">
                <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/70 border border-white/10">
                  Daily Tracking
                </span>
                <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/70 border border-white/10">
                  Streak Building
                </span>
                <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/70 border border-white/10">
                  Goal Achievement
                </span>
              </div>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <Card className="p-12 md:p-16 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white/90 mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
              Join thousands of users who are already tracking their goals and
              building better habits with Nitya.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/signin')}
                className="px-10 py-4 text-lg font-semibold glass-button-accent rounded-2xl w-full sm:w-auto"
              >
                Sign Up Free
              </button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}
