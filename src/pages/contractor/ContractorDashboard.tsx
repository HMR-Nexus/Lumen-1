import { useAuth } from '@/hooks/useAuth'

export function ContractorDashboard() {
  const { user } = useAuth()

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold text-gray-900">Meine Aufträge</h2>
      <p className="mb-6 text-sm text-gray-500">Willkommen, {user?.fullName}</p>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <p className="text-center text-sm text-gray-400">
          Keine zugewiesenen Aufträge. Aufträge werden ab Sprint 3 angezeigt.
        </p>
      </div>
    </div>
  )
}
