import { useAuth } from '@/hooks/useAuth'

export function TechDashboard() {
  const { user } = useAuth()

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold text-gray-900">Meine Aufträge</h2>
      <p className="mb-6 text-sm text-gray-500">
        Hallo {user?.fullName} — Team {user?.team?.charAt(0).toUpperCase()}
        {user?.team?.slice(1)}
      </p>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <p className="text-center text-sm text-gray-400">
          Keine Aufträge für heute. Aufträge werden ab Sprint 3 angezeigt.
        </p>
      </div>
    </div>
  )
}
