import { createContext } from 'react'
import type { UserRole } from '@/types/enums'

export interface AuthUser {
  id: string
  email: string | null
  fullName: string
  role: UserRole
  team: string | null
}

export interface AuthContextType {
  user: AuthUser | null
  role: UserRole | null
  isLoading: boolean
  signOut: () => Promise<void>
  devSetRole: (role: UserRole) => void
}

export const AuthContext = createContext<AuthContextType | null>(null)
