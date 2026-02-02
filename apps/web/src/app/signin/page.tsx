'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { SignInView } from '@/components/features/home'

export default function SignInPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  // Show sign in view if not authenticated
  if (isLoading || user) {
    return null // Or a loading spinner
  }

  return <SignInView />
}
