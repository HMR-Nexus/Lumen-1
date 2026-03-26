import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { UserRole } from '@/types/enums'
import { AuthContext, type AuthUser } from './authTypes'
import { authService } from '@/services/authService'
import { supabase } from '@/lib/supabase'

export type { AuthUser, AuthContextType } from './authTypes'

// ── Dev-only mock users ──────────────────────────────────────
const DEV_USERS: Record<UserRole, AuthUser> = {
  admin: {
    id: 'dev-admin',
    email: 'admin@nexus-engineering.de',
    fullName: 'Jarl Admin',
    role: 'admin',
    team: null,
  },
  technician: {
    id: 'dev-tech',
    email: 'tech@nexus-engineering.de',
    fullName: 'Max Müller',
    role: 'technician',
    team: 'rot',
  },
  contractor: {
    id: 'dev-contractor',
    email: 'contractor@external.de',
    fullName: 'Hans Extern',
    role: 'contractor',
    team: null,
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDevMode, setIsDevMode] = useState(false)

  // ── Bootstrap: check existing session on mount ──
  useEffect(() => {
    let mounted = true

    async function initAuth() {
      try {
        const profile = await authService.getCurrentUser()
        if (mounted) setUser(profile)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT' || !session) {
        if (!isDevMode) setUser(null)
        return
      }

      if (event === 'TOKEN_REFRESHED') {
        const profile = await authService.getCurrentUser()
        if (mounted && !isDevMode && profile) setUser(profile)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [isDevMode])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const result = await authService.signInWithEmail(email, password)
    if (result.user) {
      setUser(result.user)
      setIsDevMode(false)
    }
    return { error: result.error }
  }, [])

  const signOut = useCallback(async () => {
    if (isDevMode) {
      setUser(null)
      setIsDevMode(false)
      return
    }
    await authService.signOut()
    setUser(null)
  }, [isDevMode])

  const resetPassword = useCallback(async (email: string) => {
    return authService.resetPassword(email)
  }, [])

  const devSetRole = useCallback((role: UserRole) => {
    setUser(DEV_USERS[role])
    setIsDevMode(true)
    setIsLoading(false)
  }, [])

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isLoading,
      signInWithEmail,
      signOut,
      resetPassword,
      devSetRole,
    }),
    [user, isLoading, signInWithEmail, signOut, resetPassword, devSetRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
