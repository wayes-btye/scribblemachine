'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithEmail: (email: string) => Promise<{ error: any }>
  // Development bypass for testing
  devBypassAuth?: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // TODO: Update last login when user signs in
        // Note: Temporarily disabled due to type issues
        if (event === 'SIGNED_IN' && session?.user) {
          // await supabase
          //   .from('users')
          //   .update({ last_login_at: new Date() })
          //   .eq('id', session.user.id)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // Development bypass for testing (only in dev mode)
  const devBypassAuth = async () => {
    if (process.env.NODE_ENV !== 'development' &&
      process.env.NEXT_PUBLIC_ENABLE_DEV_BYPASS !== 'true') return

    try {
      // Use real authentication with actual credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'wayes.appsmate@gmail.com',
        password: 'Test_123!'
      })

      if (error) {
        console.error('Dev bypass auth error:', error)
        throw error
      }

      // Authentication successful - session is automatically set by Supabase
      console.log('Dev bypass successful:', data.user?.email)
    } catch (error) {
      console.error('Failed to authenticate test user:', error)
      throw error
    }
  }

  const value = {
    user,
    session,
    loading,
    signOut,
    signInWithEmail,
    devBypassAuth: (process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_ENABLE_DEV_BYPASS === 'true') ? devBypassAuth : undefined,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}