export function AdminDashboard() {
  const stats = [
    { label: 'Offene Aufträge', value: '—', color: 'bg-lumen-primary' },
    { label: 'In Bearbeitung', value: '—', color: 'bg-lumen-secondary' },
    { label: 'Zertifizierung ausstehend', value: '—', color: 'bg-lumen-warning' },
    { label: 'Abgeschlossen (Monat)', value: '—', color: 'bg-lumen-success' },
  ]

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-gray-900">Dashboard</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white p-5 shadow-sm">
            <div className={`mb-3 h-1.5 w-10 rounded-full ${stat.color}`} />
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-base font-semibold text-gray-900">Willkommen bei LUMEN</h3>
        <p className="text-sm text-gray-500">
          Zentrale Betriebsplattform für HMR Nexus Engineering GmbH. Aufträge, Zertifizierungen und
          Personalverwaltung an einem Ort.
        </p>
      </div>
    </div>
  )
}
