import { Outlet } from 'react-router'
import { BottomNav, type BottomNavItem } from './BottomNav'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS: BottomNavItem[] = [
  { label: 'Aufträge', path: ROUTES.CONTRACTOR.DASHBOARD, icon: '📋' },
  { label: 'Dokumente', path: ROUTES.CONTRACTOR.DOCUMENTS, icon: '📄' },
  { label: 'Zertifikate', path: ROUTES.CONTRACTOR.CERTIFICATIONS, icon: '✅' },
]

export function ContractorLayout() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex h-14 items-center gap-3 bg-white px-4 shadow-sm">
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
