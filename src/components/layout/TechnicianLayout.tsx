import { Outlet } from 'react-router'
import { BottomNav, type BottomNavItem } from './BottomNav'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/hooks/useAuth'

const TEAM_COLORS: Record<string, string> = {
  rot: 'bg-team-rot',
  gruen: 'bg-team-gruen',
  blau: 'bg-team-blau',
  gelb: 'bg-team-gelb',
}

const NAV_ITEMS: BottomNavItem[] = [
  { label: 'Aufträge', path: ROUTES.TECHNICIAN.DASHBOARD, icon: '📋' },
  { label: 'Bericht', path: ROUTES.TECHNICIAN.RUECKMELDUNG, icon: '📝' },
  { label: 'Kalender', path: ROUTES.TECHNICIAN.SCHEDULE, icon: '📅' },
]

export function TechnicianLayout() {
  const { user } = useAuth()
  const teamColorClass = user?.team ? TEAM_COLORS[user.team] ?? 'bg-gray-400' : 'bg-gray-400'

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex h-14 items-center gap-3 bg-white px-4 shadow-sm">
        <div className={`h-3 w-3 rounded-full ${teamColorClass}`} />
        <span className="text-sm font-semibold text-gray-900">LUMEN</span>
        <span className="ml-auto text-xs text-gray-500">{user?.fullName}</span>
      </header>

      <main className="flex-1 p-4 pb-20">
        <Outlet />
      </main>

      <BottomNav items={NAV_ITEMS} />
    </div>
  )
}
