import { useAuth } from '@/hooks/useAuth'

export function TechDashboard() {
  const { user } = useAuth()

  return (
    <div>
      <h2 className="mb-1 font-display text-lg font-bold text-gf-text">Meine Aufträge</h2>
      <p className="mb-6 text-sm text-gf-text-muted">
        Hallo {user?.fullName} — Team {user?.team?.charAt(0).toUpperCase()}
        {user?.team?.slice(1)}
      </p>

      <div className="rounded-xl border border-gf-border bg-gf-card p-5">
        <p className="text-center text-sm text-gf-text-muted">
          Keine Aufträge für heute. Aufträge werden ab Sprint 3 angezeigt.
        </p>
      </div>
    </div>
  )
}
