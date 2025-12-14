'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import Image from 'next/image'
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User,
} from 'firebase/auth'
import { initializeApp, getApps } from 'firebase/app'

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

// ============ Auth Context Types ============
interface AuthContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============ Auth Provider ============
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const clearError = () => setError(null)

  const signInWithGoogle = async () => {
    try {
      setError(null)
      setIsLoading(true)
      await signInWithPopup(auth, googleProvider)
    } catch (err: unknown) {
      console.error('Error signing in with Google:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null)
      setIsLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err: unknown) {
      console.error('Error signing in with email:', err)
      // Parse Firebase error codes for user-friendly messages
      const firebaseError = err as { code?: string }
      let errorMessage = 'Failed to sign in'
      if (firebaseError.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email'
      } else if (firebaseError.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password'
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address'
      } else if (firebaseError.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password'
      } else if (firebaseError.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later'
      }
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      setError(null)
      setIsLoading(true)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update display name if provided
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName })
      }
    } catch (err: unknown) {
      console.error('Error signing up with email:', err)
      // Parse Firebase error codes for user-friendly messages
      const firebaseError = err as { code?: string }
      let errorMessage = 'Failed to create account'
      if (firebaseError.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists'
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address'
      } else if (firebaseError.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters'
      }
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      await firebaseSignOut(auth)
    } catch (err) {
      console.error('Error signing out:', err)
      setError('Failed to sign out')
      throw err
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ============ useAuth Hook ============
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// ============ Google Sign-In Button Component ============
export function GoogleSignInButton() {
  const { signInWithGoogle, isLoading } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleSignIn = async () => {
    setIsSigningIn(true)
    try {
      await signInWithGoogle()
    } catch {
      // Error is already handled in the hook
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading || isSigningIn}
      className="
        flex items-center justify-center gap-3
        w-full
        px-6 py-3.5
        bg-white/5 hover:bg-white/10
        border border-white/10 hover:border-white/20
        rounded-xl
        text-white font-medium
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        group
      "
    >
      {isSigningIn ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <svg
          className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
          viewBox="0 0 24 24"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      <span>{isSigningIn ? 'Signing in...' : 'Continue with Google'}</span>
    </button>
  )
}

// ============ Email Auth Form Component ============
export function EmailAuthForm() {
  const { signInWithEmail, signUpWithEmail, isLoading, error, clearError } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    
    setIsSubmitting(true)
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password, displayName || undefined)
      }
    } catch {
      // Error is already handled in the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    clearError()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Display Name (only for signup) */}
      {mode === 'signup' && (
        <div>
          <label className="block text-sm font-medium text-white/60 mb-1.5">
            Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="
              w-full px-4 py-3
              bg-white/5
              border border-white/10 rounded-xl
              text-white placeholder-white/30
              focus:outline-none focus:border-[#007AFF]/50
              focus:ring-2 focus:ring-[#007AFF]/20
              transition-all duration-200
            "
          />
        </div>
      )}

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-white/60 mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="
            w-full px-4 py-3
            bg-white/5
            border border-white/10 rounded-xl
            text-white placeholder-white/30
            focus:outline-none focus:border-[#007AFF]/50
            focus:ring-2 focus:ring-[#007AFF]/20
            transition-all duration-200
          "
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-white/60 mb-1.5">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
          required
          minLength={6}
          className="
            w-full px-4 py-3
            bg-white/5
            border border-white/10 rounded-xl
            text-white placeholder-white/30
            focus:outline-none focus:border-[#007AFF]/50
            focus:ring-2 focus:ring-[#007AFF]/20
            transition-all duration-200
          "
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || isSubmitting || !email.trim() || !password.trim()}
        className="
          w-full px-6 py-3.5
          bg-gradient-to-r from-[#007AFF] to-[#AF52DE]
          hover:from-[#007AFF]/90 hover:to-[#AF52DE]/90
          disabled:from-white/10 disabled:to-white/10
          disabled:text-white/30 disabled:cursor-not-allowed
          text-white font-semibold rounded-xl
          shadow-[0_0_20px_rgba(0,122,255,0.3)]
          hover:shadow-[0_0_30px_rgba(0,122,255,0.4)]
          disabled:shadow-none
          transition-all duration-200
        "
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
          </div>
        ) : (
          <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
        )}
      </button>

      {/* Toggle Mode */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={toggleMode}
          className="text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          {mode === 'signin' ? (
            <>Don&apos;t have an account? <span className="text-[#007AFF]">Sign up</span></>
          ) : (
            <>Already have an account? <span className="text-[#007AFF]">Sign in</span></>
          )}
        </button>
      </div>
    </form>
  )
}

// ============ Auth Form (Combined Google + Email) ============
export function AuthForm() {
  return (
    <div className="space-y-6">
      {/* Email/Password Form */}
      <EmailAuthForm />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[#0a0a12] text-white/40">or continue with</span>
        </div>
      </div>

      {/* Google Sign In */}
      <GoogleSignInButton />
    </div>
  )
}

// ============ User Avatar Component ============
interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}

export function UserAvatar({ size = 'md', showName = false }: UserAvatarProps) {
  const { user, signOut } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  if (!user) return null

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  const initials =
    user.displayName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ||
    user.email?.[0]?.toUpperCase() ||
    '?'

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 group"
      >
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={user.displayName || 'User'}
            width={size === 'sm' ? 28 : size === 'md' ? 36 : 48}
            height={size === 'sm' ? 28 : size === 'md' ? 36 : 48}
            className={`${sizeClasses[size]} rounded-full ring-2 ring-white/10 group-hover:ring-white/30 transition-all duration-200`}
          />
        ) : (
          <div
            className={`
              ${sizeClasses[size]} rounded-full
              bg-gradient-to-br from-[#007AFF] to-[#AF52DE]
              flex items-center justify-center
              font-semibold text-white
              ring-2 ring-white/10 group-hover:ring-white/30
              transition-all duration-200
            `}
          >
            {initials}
          </div>
        )}
        {showName && (
          <span className="text-sm text-white/80 group-hover:text-white transition-colors hidden sm:inline">
            {user.displayName || user.email}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div
            className="
              absolute right-0 top-full mt-2 z-50
              w-64 p-2
              bg-[#1a1a24]/95 backdrop-blur-xl
              border border-white/10 rounded-2xl
              shadow-[0_8px_40px_rgba(0,0,0,0.5)]
            "
          >
            {/* User Info */}
            <div className="px-3 py-3 border-b border-white/10 mb-2">
              <p className="text-sm font-medium text-white truncate">
                {user.displayName || 'User'}
              </p>
              <p className="text-xs text-white/50 truncate">{user.email}</p>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={async () => {
                setShowMenu(false)
                await signOut()
              }}
              className="
                w-full flex items-center gap-3 px-3 py-2.5
                text-sm text-white/70 hover:text-white
                hover:bg-white/10 rounded-xl
                transition-all duration-200
              "
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
