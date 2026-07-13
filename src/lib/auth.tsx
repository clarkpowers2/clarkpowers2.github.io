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
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function normalizeUser(user: any): AuthUser | null {
  if (!user?.id) return null

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? user.profile?.name ?? user.profile?.display_name,
  }
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
    if (error) throw new Error(error.message)
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
    if (data?.accessToken || data?.user) {
      setUser(normalizeUser(data?.user))
    }

    return { requiresVerification }
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
    signOut,
    refreshUser,
  }), [user, loading, signIn, signUp, signOut, refreshUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return value
}
