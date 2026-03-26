import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/config/routes'
import type { UserRole } from '@/types/enums'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { devSetRole } = useAuth()

  const handleDevLogin = (role: UserRole) => {
    devSetRole(role)
    const routes: Record<UserRole, string> = {
      admin: ROUTES.ADMIN.DASHBOARD,
      technician: ROUTES.TECHNICIAN.DASHBOARD,
      contractor: ROUTES.CONTRACTOR.DASHBOARD,
    }
    navigate(routes[role])
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-lumen-primary">
            <span className="text-2xl font-bold text-white">L</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">LUMEN</h1>
          <p className="mt-1 text-sm text-gray-500">Nexus Engineering Operations</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              // Auth will be implemented in Sprint 2
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-lumen-primary focus:ring-1 focus:ring-lumen-primary focus:outline-none"
                placeholder="name@nexus-engineering.de"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-lumen-primary focus:ring-1 focus:ring-lumen-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled
              className="w-full rounded-lg bg-lumen-primary px-4 py-2.5 text-sm font-medium text-white opacity-50"
            >
              Anmelden (Sprint 2)
            </button>
          </form>

          {/* Dev-only role switcher */}
          {import.meta.env.DEV && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <p className="mb-3 text-center text-xs font-medium text-gray-400">
                DEV: Quick Access
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => handleDevLogin('admin')}
                  className="w-full rounded-lg bg-lumen-primary/10 px-4 py-2 text-sm font-medium text-lumen-primary hover:bg-lumen-primary/20"
                >
                  Admin (Jarl)
                </button>
                <button
                  onClick={() => handleDevLogin('technician')}
                  className="w-full rounded-lg bg-team-rot/10 px-4 py-2 text-sm font-medium text-team-rot hover:bg-team-rot/20"
                >
                  Techniker (Team Rot)
                </button>
                <button
                  onClick={() => handleDevLogin('contractor')}
                  className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Externer Mitarbeiter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
