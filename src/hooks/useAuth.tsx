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
  signOut: () => Promise<void>
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

  const signInWithGoogle = async () => {
    try {
      setError(null)
      setIsLoading(true)
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error('Error signing in with Google:', err)
      setError('Failed to sign in with Google')
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
        signOut,
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
        w-full max-w-sm mx-auto
        px-6 py-4
        bg-white/[0.05] hover:bg-white/[0.1]
        border border-white/[0.1] hover:border-white/[0.2]
        rounded-2xl
        text-white font-medium
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        group
        shadow-[0_4px_24px_-1px_rgba(0,0,0,0.2)]
        hover:shadow-[0_8px_40px_-1px_rgba(0,0,0,0.3)]
      "
    >
      {isSigningIn ? (
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <svg
          className="w-6 h-6 group-hover:scale-110 transition-transform duration-200"
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
