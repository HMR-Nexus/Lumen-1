import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { UserRole } from '@/types/enums'
import { AuthContext, type AuthUser } from './authTypes'

export type { AuthUser, AuthContextType } from './authTypes'

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
    email: null,
    fullName: 'Max Techniker',
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
  const [mockRole, setMockRole] = useState<UserRole>('admin')
  const [isLoading] = useState(false)

  const user = DEV_USERS[mockRole]

  const signOut = useCallback(async () => {
    setMockRole('admin')
  }, [])

  const value = useMemo(
    () => ({
      user,
      role: user.role,
      isLoading,
      signOut,
      devSetRole: setMockRole,
    }),
    [user, isLoading, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
