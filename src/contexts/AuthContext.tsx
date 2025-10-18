import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ data: any; error: string | null }>
  signIn: (email: string, password: string) => Promise<{ data: any; error: string | null }>
  signOut: () => Promise<void>
  resendVerification: (email: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper function to convert Supabase auth errors to user-friendly messages
const getAuthErrorMessage = (error: AuthError): string => {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password. Please check your credentials and try again.'
    case 'Email not confirmed':
      return 'Please check your email and click the verification link before signing in.'
    case 'User already registered':
      return 'An account with this email already exists. Please sign in instead.'
    case 'Password should be at least 6 characters':
      return 'Password must be at least 6 characters long.'
    case 'Invalid email':
      return 'Please enter a valid email address.'
    case 'Too many requests':
      return 'Too many login attempts. Please wait a few minutes before trying again.'
    case 'Signup is disabled':
      return 'New account registration is currently disabled. Please contact support.'
    default:
      return error.message || 'An unexpected error occurred. Please try again.'
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) {
        return { data: null, error: getAuthErrorMessage(error) }
      }

      return { data, error: null }
    } catch {
      return { data: null, error: 'An unexpected error occurred. Please try again.' }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { data: null, error: getAuthErrorMessage(error) }
      }

      return { data, error: null }
    } catch {
      return { data: null, error: 'An unexpected error occurred. Please try again.' }
    }
  }

  const resendVerification = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      })

      if (error) {
        return { error: getAuthErrorMessage(error) }
      }

      return { error: null }
    } catch {
      return { error: 'Failed to resend verification email. Please try again.' }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resendVerification
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}