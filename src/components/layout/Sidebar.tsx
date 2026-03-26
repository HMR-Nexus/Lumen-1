import { NavLink } from 'react-router'
import { ROUTES } from '@/config/routes'

const NAV_ITEMS = [
  { label: 'Dashboard', path: ROUTES.ADMIN.DASHBOARD, icon: '📊' },
  { label: 'Aufträge', path: ROUTES.ADMIN.ORDERS, icon: '📋' },
  { label: 'Zertifizierung', path: ROUTES.ADMIN.CERTIFICATION, icon: '✅' },
  { label: 'Personal', path: ROUTES.ADMIN.PERSONNEL, icon: '👥' },
  { label: 'Material', path: ROUTES.ADMIN.MATERIALS, icon: '📦' },
  { label: 'Einstellungen', path: ROUTES.ADMIN.SETTINGS, icon: '⚙️' },
]

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <div className="h-8 w-8 rounded-lg bg-lumen-primary" />
        <span className="text-xl font-bold text-gray-900">LUMEN</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === ROUTES.ADMIN.DASHBOARD}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-lumen-primary/10 text-lumen-primary'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
