import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { insforge } from '@/lib/insforge'

export type AuthUser = {
  id: string
  email?: string
  name?: string
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<{ requiresVerification: boolean }>
  verifyEmail: (email: string, otp: string) => Promise<void>
  resendVerificationEmail: (email: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export class AuthActionError extends Error {
  code?: string
  statusCode?: number

  constructor(message: string, options: { code?: string; statusCode?: number } = {}) {
    super(message)
    this.name = 'AuthActionError'
    this.code = options.code
    this.statusCode = options.statusCode
  }
}

function normalizeUser(user: any): AuthUser | null {
  if (!user?.id) return null

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? user.profile?.name ?? user.profile?.display_name,
  }
}

function getAuthErrorDetails(error: any): { message: string; code?: string; statusCode?: number } {
  return {
    message: error?.message || 'Authentication failed',
    code: error?.code,
    statusCode: error?.statusCode ?? error?.status,
  }
}

function isVerificationRequiredError(error: any) {
  const { message, code, statusCode } = getAuthErrorDetails(error)
  const normalizedMessage = message.toLowerCase()
  const normalizedCode = code?.toLowerCase()

  return (
    statusCode === 403 ||
    normalizedCode === 'auth_need_verification' ||
    normalizedCode === 'auth_email_not_verified' ||
    normalizedMessage.includes('verify') ||
    normalizedMessage.includes('verification')
  )
}

export function isEmailVerificationRequiredError(error: unknown) {
  return error instanceof AuthActionError && error.code === 'EMAIL_VERIFICATION_REQUIRED'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const { data, error } = await insforge.auth.getCurrentUser()
    setUser(error ? null : normalizeUser(data?.user))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function hydrateAuth() {
      try {
        const { data, error } = await insforge.auth.getCurrentUser()
        if (cancelled) return
        setUser(error ? null : normalizeUser(data?.user))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    hydrateAuth()

    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await insforge.auth.signInWithPassword({ email, password })
    if (error) {
      const details = getAuthErrorDetails(error)

      if (isVerificationRequiredError(error)) {
        throw new AuthActionError('Please verify your email before signing in.', {
          ...details,
          code: 'EMAIL_VERIFICATION_REQUIRED',
        })
      }

      throw new AuthActionError(details.message, details)
    }
    setUser(normalizeUser(data?.user))
  }, [])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await insforge.auth.signUp({
      email,
      password,
      name,
      redirectTo: window.location.origin,
    })

    if (error) throw new Error(error.message)

    const requiresVerification = Boolean(data?.requireEmailVerification)
    if (!requiresVerification && (data?.accessToken || data?.user)) {
      setUser(normalizeUser(data?.user))
    }

    return { requiresVerification }
  }, [])

  const verifyEmail = useCallback(async (email: string, otp: string) => {
    const { data, error } = await insforge.auth.verifyEmail({ email, otp })

    if (error) {
      const details = getAuthErrorDetails(error)
      const normalizedMessage = details.message.toLowerCase()

      if (normalizedMessage.includes('expired')) {
        throw new AuthActionError('That code has expired. Send a new code and try again.', details)
      }

      if (normalizedMessage.includes('invalid') || normalizedMessage.includes('wrong')) {
        throw new AuthActionError('That code is not correct. Check the email and try again.', details)
      }

      if (normalizedMessage.includes('already') && normalizedMessage.includes('verified')) {
        await refreshUser()
        throw new AuthActionError('That email is already verified. Try signing in.', details)
      }

      throw new AuthActionError(details.message || 'We could not verify that code. Try again.', details)
    }

    setUser(normalizeUser(data?.user))
  }, [refreshUser])

  const resendVerificationEmail = useCallback(async (email: string) => {
    const { error } = await insforge.auth.resendVerificationEmail({
      email,
      redirectTo: window.location.origin,
    })

    if (error) {
      const details = getAuthErrorDetails(error)
      const normalizedMessage = details.message.toLowerCase()

      if (normalizedMessage.includes('already') && normalizedMessage.includes('verified')) {
        throw new AuthActionError('That email is already verified. Try signing in.', details)
      }

      throw new AuthActionError(details.message || 'We could not send a new code. Try again soon.', details)
    }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await insforge.auth.signOut()
    if (error) throw new Error(error.message)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    signIn,
    signUp,
    verifyEmail,
    resendVerificationEmail,
    signOut,
    refreshUser,
  }), [user, loading, signIn, signUp, verifyEmail, resendVerificationEmail, signOut, refreshUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return value
}
