import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import {
  fetchWorkOrder,
  fetchWorkOrderDetail,
  fetchWorkOrderPhotos,
  fetchStateHistory,
  transitionWorkOrderStatus,
  workTypeToDetailTable,
  getPhotoPublicUrl,
} from '@/services/workOrderService'
import { generateCertificatePdf } from '@/services/pdfService'
import type { WorkOrderStatus, WorkType, TeamColor } from '@/types/enums'

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  created: 'Erstellt',
  assigned: 'Zugewiesen',
  in_progress: 'In Bearbeitung',
  executed: 'Ausgeführt',
  rueckmeldung_pending: 'RM ausstehend',
  rueckmeldung_sent: 'RM gesendet',
  internally_certified: 'Int. zertifiziert',
  sent_to_client: 'An Kunden gesendet',
  client_accepted: 'Akzeptiert',
  client_rejected: 'Abgelehnt',
  invoiced: 'Fakturiert',
  paid: 'Bezahlt',
  returned: 'Zurückgegeben',
  cancelled: 'Storniert',
}

const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  created: 'bg-gf-text-muted/20 text-gf-text-muted',
  assigned: 'bg-gf-primary/15 text-gf-primary-dark',
  in_progress: 'bg-gf-accent/15 text-gf-accent',
  executed: 'bg-gf-warning/15 text-amber-700',
  rueckmeldung_pending: 'bg-gf-warning/20 text-amber-700',
  rueckmeldung_sent: 'bg-gf-warning/10 text-amber-600',
  internally_certified: 'bg-gf-success/15 text-emerald-700',
  sent_to_client: 'bg-gf-primary/10 text-gf-primary-dark',
  client_accepted: 'bg-gf-success/20 text-emerald-700',
  client_rejected: 'bg-gf-danger/15 text-rose-700',
  invoiced: 'bg-gf-accent/10 text-purple-700',
  paid: 'bg-gf-success/25 text-emerald-800',
  returned: 'bg-gf-warning/15 text-amber-700',
  cancelled: 'bg-gf-danger/10 text-rose-600',
}

const WORK_TYPE_LABELS: Record<WorkType, string> = {
  soplado: 'Soplado',
  fusion_ap: 'Fusión AP',
  fusion_dp: 'Fusión DP',
  alta: 'Alta',
  nt_installation: 'NT-Installation',
  patchkabel: 'Patchkabel',
}

const TEAM_DOT: Record<TeamColor, string> = {
  rot: 'bg-team-rot',
  gruen: 'bg-team-gruen',
  blau: 'bg-team-blau',
  gelb: 'bg-team-gelb',
}

// Human-readable labels for all wo_detail_* fields
const DETAIL_FIELD_LABELS: Record<string, string> = {
  meters: 'Meter',
  section: 'Abschnitt',
  tube_diameter: 'Rohrdurchmesser',
  result: 'Ergebnis',
  splice_count: 'Spleiß-Anzahl',
  fiber_type: 'Fasertyp',
  fusion_losses: 'Schmelzverluste (dB)',
  has_measurement_cert: 'Meßprotokoll',
  access_type: 'Zugangstyp',
  equipment_installed: 'Installierte Geräte',
  client_signature: 'Kundenunterschrift',
  nt_type: 'NT-Typ',
  serial_number: 'Seriennummer',
  location: 'Standort',
  configuration: 'Konfiguration',
  connected_section: 'Verbundener Abschnitt',
  cable_length: 'Kabellänge (m)',
  connector_type: 'Steckertyp',
  test_result: 'Testergebnis',
}

type PhotoType = 'before' | 'during' | 'after'

const PHOTO_LABELS: Record<PhotoType, string> = {
  before: 'Vorher',
  during: 'Während',
  after: 'Nachher',
}

interface Photo {
  id: string
  storage_path: string
  photo_type: PhotoType
  caption: string | null
}

interface StateEntry {
  id: string
  from_status: WorkOrderStatus | null
  to_status: WorkOrderStatus
  changed_by: string
  notes: string | null
  created_at: string
}

export function WorkOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [order, setOrder] = useState<{
    id: string
    order_number: string
    work_type: WorkType
    status: WorkOrderStatus
    priority: string
    line: string
    address: string | null
    postal_code: string | null
    city: string | null
    internal_notes: string | null
    assigned_date: string | null
    assigned_team: TeamColor | null
    clients: { name: string; code: string } | null
    projects: { name: string; code: string } | null
    operators: { name: string; code: string } | null
  } | null>(null)
  const [detail, setDetail] = useState<Record<string, unknown>>({})
  const [photos, setPhotos] = useState<Photo[]>([])
  const [history, setHistory] = useState<StateEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCertifying, setIsCertifying] = useState(false)
  const [isSendingToClient, setIsSendingToClient] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isReturning, setIsReturning] = useState(false)
  const [isInvoicing, setIsInvoicing] = useState(false)
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showSendToClientModal, setShowSendToClientModal] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [acceptNote, setAcceptNote] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [rejectError, setRejectError] = useState('')
  const [invoiceError, setInvoiceError] = useState('')

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetchWorkOrder(id),
      fetchWorkOrderPhotos(id),
      fetchStateHistory(id),
    ]).then(async ([{ data: orderData, error: orderErr }, { data: photoData }, { data: histData }]) => {
      if (orderErr || !orderData) {
        setError(orderErr ?? 'Auftrag nicht gefunden')
        setIsLoading(false)
        return
      }
      setOrder(orderData as unknown as typeof order)
      setPhotos((photoData ?? []) as Photo[])
      setHistory((histData ?? []) as StateEntry[])

      const table = workTypeToDetailTable(orderData.work_type)
      const { data: detailData } = await fetchWorkOrderDetail(table, id)
      if (detailData) {
        const { id: _i, work_order_id: _w, created_at: _c, ...rest } = detailData as Record<string, unknown>
        void _i; void _w; void _c
        setDetail(rest)
      }
      setIsLoading(false)
    })
  }, [id])

  const reloadOrderAndHistory = useCallback(async () => {
    if (!id) return
    const [{ data: orderData }, { data: histData }] = await Promise.all([
      fetchWorkOrder(id),
      fetchStateHistory(id),
    ])
    if (orderData) setOrder(orderData as unknown as typeof order)
    setHistory((histData ?? []) as StateEntry[])
  }, [id])

  async function handleCertify() {
    if (!id || !user || !order) return
    setIsCertifying(true)
    setError(null)
    const { error } = await transitionWorkOrderStatus(
      id,
      'internally_certified',
      user.id,
      'Intern zertifiziert durch Admin',
    )
    if (error) {
      setError(error)
    } else {
      await reloadOrderAndHistory()
    }
    setIsCertifying(false)
  }

  async function handleSendToClient() {
    if (!id || !user) return
    setIsSendingToClient(true)
    setError(null)
    const { error } = await transitionWorkOrderStatus(
      id,
      'sent_to_client',
      user.id,
      'An Kunden gesendet',
    )
    if (error) {
      setError(error)
    } else {
      await reloadOrderAndHistory()
      setShowSendToClientModal(false)
    }
    setIsSendingToClient(false)
  }

  async function handleClientAccept() {
    if (!id || !user) return
    setIsAccepting(true)
    setError(null)
    const note = acceptNote.trim()
      ? `Vom Kunden akzeptiert: ${acceptNote.trim()}`
      : 'Vom Kunden akzeptiert'
    const { error } = await transitionWorkOrderStatus(id, 'client_accepted', user.id, note)
    if (error) {
      setError(error)
    } else {
      await reloadOrderAndHistory()
      setShowAcceptModal(false)
      setAcceptNote('')
    }
    setIsAccepting(false)
  }

  async function handleClientReject() {
    if (!id || !user) return
    if (!rejectReason.trim()) {
      setRejectError('Bitte Ablehnungsgrund angeben')
      return
    }
    setIsRejecting(true)
    setError(null)
    const { error } = await transitionWorkOrderStatus(
      id,
      'client_rejected',
      user.id,
      `Abgelehnt: ${rejectReason.trim()}`,
    )
    if (error) {
      setError(error)
    } else {
      await reloadOrderAndHistory()
      setShowRejectModal(false)
      setRejectReason('')
      setRejectError('')
    }
    setIsRejecting(false)
  }

  async function handleReturnForRevision() {
    if (!id || !user) return
    setIsReturning(true)
    setError(null)
    const { error } = await transitionWorkOrderStatus(
      id,
      'internally_certified',
      user.id,
      'Zur Überarbeitung zurückgegeben',
    )
    if (error) {
      setError(error)
    } else {
      await reloadOrderAndHistory()
    }
    setIsReturning(false)
  }

  async function handleInvoice() {
    if (!id || !user) return
    if (!invoiceNumber.trim()) {
      setInvoiceError('Bitte Rechnungsnummer angeben')
      return
    }
    setIsInvoicing(true)
    setError(null)
    const { error } = await transitionWorkOrderStatus(
      id,
      'invoiced',
      user.id,
      `Rechnung: ${invoiceNumber.trim()}`,
    )
    if (error) {
      setError(error)
    } else {
      await reloadOrderAndHistory()
      setShowInvoiceModal(false)
      setInvoiceNumber('')
      setInvoiceError('')
    }
    setIsInvoicing(false)
  }

  async function handleMarkPaid() {
    if (!id || !user) return
    setIsMarkingPaid(true)
    setError(null)
    const { error } = await transitionWorkOrderStatus(id, 'paid', user.id, 'Als bezahlt markiert')
    if (error) {
      setError(error)
    } else {
      await reloadOrderAndHistory()
    }
    setIsMarkingPaid(false)
  }

  function handleDownloadPdf() {
    if (!order) return
    generateCertificatePdf(order, detail, photos, history)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gf-border border-t-gf-primary" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="rounded-lg border border-gf-danger/30 bg-gf-danger/10 px-4 py-3 text-sm text-rose-700">
        {error ?? 'Auftrag nicht gefunden'}
      </div>
    )
  }

  // Show detail section whenever a record was fetched (even if all fields are null)
  const hasDetail = Object.keys(detail).length > 0
  const photosByType = (type: PhotoType) => photos.filter((p) => p.photo_type === type)

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/orders')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gf-border text-gf-text-muted hover:border-gf-primary hover:text-gf-primary transition-colors"
          >
            ←
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold text-gf-text">{order.order_number}</h2>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                {STATUS_LABELS[order.status]}
              </span>
            </div>
            <p className="text-sm text-gf-text-muted">{WORK_TYPE_LABELS[order.work_type]} · Linie {order.line}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(['internally_certified', 'sent_to_client', 'client_accepted', 'invoiced', 'paid'] as WorkOrderStatus[]).includes(order.status) && (
            <button
              onClick={handleDownloadPdf}
              className="shrink-0 rounded-lg border border-gf-border px-3 py-1.5 text-xs font-medium text-gf-text-muted hover:border-gf-primary hover:text-gf-primary transition-colors"
            >
              📄 PDF
            </button>
          )}
          <button
            onClick={() => navigate(`/admin/orders/${id}/edit`)}
            className="shrink-0 rounded-lg border border-gf-border px-3 py-1.5 text-xs font-medium text-gf-text-muted hover:border-gf-primary hover:text-gf-primary transition-colors"
          >
            Bearbeiten
          </button>
        </div>
      </div>

      {/* Certification banner */}
      {order.status === 'rueckmeldung_sent' && (
        <div className="rounded-xl border border-gf-warning/40 bg-gf-warning/10 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-amber-700">Rückmeldung liegt vor</p>
              <p className="text-sm text-amber-600">Technische Daten und Fotos geprüft? Intern zertifizieren.</p>
            </div>
            <button
              disabled={isCertifying}
              onClick={handleCertify}
              className="shrink-0 rounded-lg bg-gf-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isCertifying ? 'Wird zertifiziert…' : '✓ Interne Zertifizierung'}
            </button>
          </div>
        </div>
      )}

      {/* LUM-015: Send to client */}
      {order.status === 'internally_certified' && (
        <div className="rounded-xl border border-gf-success/40 bg-gf-success/10 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-emerald-700">Intern zertifiziert ✓ — Bereit zum Versand an Kunden</p>
              <p className="text-xs text-emerald-600">Dieser Auftrag kann jetzt an den Kunden weitergeleitet werden.</p>
            </div>
            <button
              onClick={() => setShowSendToClientModal(true)}
              className="shrink-0 rounded-lg bg-gf-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              📤 An Kunden senden
            </button>
          </div>
        </div>
      )}

      {/* LUM-017: Client accept/reject */}
      {order.status === 'sent_to_client' && (
        <div className="rounded-xl border border-gf-primary/30 bg-gf-primary/10 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gf-primary-dark">An Kunden gesendet — Warten auf Rückmeldung</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAcceptModal(true)}
                className="shrink-0 rounded-lg bg-gf-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                ✅ Akzeptiert
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="shrink-0 rounded-lg bg-gf-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                ❌ Abgelehnt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LUM-017: Client rejected */}
      {order.status === 'client_rejected' && (() => {
        const rejEntry = [...history].reverse().find((e) => e.to_status === 'client_rejected')
        const reason = rejEntry?.notes?.replace(/^Abgelehnt:\s*/, '') ?? 'Kein Grund angegeben'
        return (
          <div className="rounded-xl border border-gf-danger/40 bg-gf-danger/10 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-rose-700">Vom Kunden abgelehnt</p>
                <p className="text-sm text-rose-600">{reason}</p>
              </div>
              <button
                disabled={isReturning}
                onClick={handleReturnForRevision}
                className="shrink-0 rounded-lg bg-gf-warning px-4 py-2 text-sm font-semibold text-amber-900 hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isReturning ? 'Wird gesendet…' : '🔄 Zur Überarbeitung senden'}
              </button>
            </div>
          </div>
        )
      })()}

      {/* LUM-018: Invoice */}
      {order.status === 'client_accepted' && (
        <div className="rounded-xl border border-gf-success/40 bg-gf-success/10 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-emerald-700">Vom Kunden akzeptiert ✓</p>
              <p className="text-xs text-emerald-600">Bereit zur Fakturierung.</p>
            </div>
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="shrink-0 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              🧾 Fakturieren
            </button>
          </div>
        </div>
      )}

      {/* LUM-018: Invoiced */}
      {order.status === 'invoiced' && (
        <div className="rounded-xl border border-purple-300 bg-purple-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-purple-700">Fakturiert</p>
              <p className="text-xs text-purple-600">Rechnung wurde gestellt — warten auf Zahlung.</p>
            </div>
            <button
              disabled={isMarkingPaid}
              onClick={handleMarkPaid}
              className="shrink-0 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isMarkingPaid ? 'Wird gespeichert…' : '💳 Als bezahlt markieren'}
            </button>
          </div>
        </div>
      )}

      {/* LUM-018: Paid */}
      {order.status === 'paid' && (
        <div className="rounded-xl border border-emerald-400 bg-emerald-100 px-4 py-3">
          <p className="font-semibold text-emerald-800">✅ Bezahlt — Auftrag abgeschlossen</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-gf-danger/30 bg-gf-danger/10 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Order info */}
      <div className="rounded-xl border border-gf-border bg-gf-card p-5">
        <h3 className="mb-4 font-display text-sm font-semibold text-gf-text">Auftragsdaten</h3>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-gf-text-muted">Kunde</p>
            <p className="font-medium text-gf-text">{order.clients?.name ?? '—'} ({order.clients?.code ?? '—'})</p>
          </div>
          <div>
            <p className="text-xs text-gf-text-muted">Projekt</p>
            <p className="font-medium text-gf-text">{order.projects?.code ?? '—'} – {order.projects?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gf-text-muted">Betreiber</p>
            <p className="font-medium text-gf-text">{order.operators?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gf-text-muted">Team</p>
            <div className="flex items-center gap-1.5">
              {order.assigned_team && (
                <span className={`h-2 w-2 rounded-full ${TEAM_DOT[order.assigned_team]}`} />
              )}
              <span className="font-medium capitalize text-gf-text">{order.assigned_team ?? '—'}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gf-text-muted">Priorität</p>
            <p className="font-medium capitalize text-gf-text">{order.priority}</p>
          </div>
          {order.assigned_date && (
            <div>
              <p className="text-xs text-gf-text-muted">Einsatzdatum</p>
              <p className="font-medium text-gf-text">
                {new Date(order.assigned_date).toLocaleDateString('de-DE')}
              </p>
            </div>
          )}
          {(order.address || order.city) && (
            <div className="col-span-2 sm:col-span-3">
              <p className="text-xs text-gf-text-muted">Adresse</p>
              <p className="font-medium text-gf-text">
                {[order.address, order.postal_code, order.city].filter(Boolean).join(', ')}
              </p>
            </div>
          )}
          {order.internal_notes && (
            <div className="col-span-2 sm:col-span-3">
              <p className="text-xs text-gf-text-muted">Interne Notizen</p>
              <p className="font-medium text-gf-text">{order.internal_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Rückmeldung technical data */}
      {hasDetail && (
        <div className="rounded-xl border border-gf-primary/30 bg-gf-card p-5">
          <h3 className="mb-1 font-display text-sm font-semibold text-gf-text">
            Rückmeldung — {WORK_TYPE_LABELS[order.work_type]}
          </h3>
          <p className="mb-4 text-xs text-gf-text-muted">Vom Techniker eingetragene Daten</p>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            {Object.entries(detail).map(([key, value]) => {
              const label = DETAIL_FIELD_LABELS[key] ?? key.replace(/_/g, ' ')
              const isEmpty = value === null || value === undefined || value === ''
              return (
                <div key={key}>
                  <p className="text-xs capitalize text-gf-text-muted">{label}</p>
                  <p className={`font-medium ${isEmpty ? 'text-gf-text-muted' : 'text-gf-text'}`}>
                    {isEmpty
                      ? '—'
                      : typeof value === 'boolean'
                        ? value ? 'Ja ✓' : 'Nein ✗'
                        : String(value)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Technician notes — extracted from rueckmeldung_sent history entry */}
      {(() => {
        const rmEntry = history.find((e) => e.to_status === 'rueckmeldung_sent')
        if (!rmEntry?.notes || rmEntry.notes === 'Rückmeldung gesendet') return null
        return (
          <div className="rounded-xl border border-gf-border bg-gf-card p-5">
            <h3 className="mb-2 font-display text-sm font-semibold text-gf-text">Notizen vom Techniker</h3>
            <p className="text-sm text-gf-text">{rmEntry.notes}</p>
          </div>
        )
      })()}

      {/* Photos */}
      {photos.length > 0 && (
        <div className="rounded-xl border border-gf-border bg-gf-card p-5">
          <h3 className="mb-4 font-display text-sm font-semibold text-gf-text">Fotos ({photos.length})</h3>
          <div className="space-y-4">
            {(['before', 'during', 'after'] as PhotoType[]).map((type) => {
              const typePhotos = photosByType(type)
              if (typePhotos.length === 0) return null
              return (
                <div key={type}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gf-text-muted">
                    {PHOTO_LABELS[type]} ({typePhotos.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {typePhotos.map((photo) => (
                      <a
                        key={photo.id}
                        href={getPhotoPublicUrl(photo.storage_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square overflow-hidden rounded-lg bg-gf-surface ring-1 ring-gf-border hover:ring-gf-primary transition-all"
                      >
                        <img
                          src={getPhotoPublicUrl(photo.storage_path)}
                          alt={photo.caption ?? PHOTO_LABELS[type]}
                          className="h-full w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {photos.length === 0 && (
        <div className="rounded-xl border border-gf-border bg-gf-card p-5">
          <h3 className="mb-2 font-display text-sm font-semibold text-gf-text">Fotos</h3>
          <p className="text-sm text-gf-text-muted">Noch keine Fotos hochgeladen.</p>
        </div>
      )}

      {/* State history */}
      {history.length > 0 && (
        <div className="rounded-xl border border-gf-border bg-gf-card p-5">
          <h3 className="mb-4 font-display text-sm font-semibold text-gf-text">Statusverlauf</h3>
          <ol className="space-y-3">
            {history.map((entry, i) => (
              <li key={entry.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`mt-0.5 h-2.5 w-2.5 rounded-full ${i === history.length - 1 ? 'bg-gf-primary' : 'bg-gf-border'}`} />
                  {i < history.length - 1 && <div className="mt-1 h-6 w-px bg-gf-border" />}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[entry.to_status]}`}>
                      {STATUS_LABELS[entry.to_status]}
                    </span>
                    {entry.from_status && (
                      <span className="text-xs text-gf-text-muted">
                        ← {STATUS_LABELS[entry.from_status]}
                      </span>
                    )}
                  </div>
                  {entry.notes && (
                    <p className="mt-0.5 text-xs text-gf-text">{entry.notes}</p>
                  )}
                  <p className="text-xs text-gf-text-muted">
                    {new Date(entry.created_at).toLocaleString('de-DE')}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ─── Modals ─── */}
      <Modal open={showSendToClientModal} onClose={() => setShowSendToClientModal(false)}>
        <p className="mb-4 text-sm text-gf-text">Auftrag an den Kunden senden?</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowSendToClientModal(false)}
            className="rounded-lg border border-gf-border px-4 py-2 text-sm text-gf-text-muted hover:bg-gf-surface transition-colors"
          >
            Abbrechen
          </button>
          <button
            disabled={isSendingToClient}
            onClick={handleSendToClient}
            className="rounded-lg bg-gf-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isSendingToClient ? 'Wird gesendet…' : 'Bestätigen'}
          </button>
        </div>
      </Modal>

      <Modal open={showAcceptModal} onClose={() => { setShowAcceptModal(false); setAcceptNote('') }}>
        <p className="mb-2 text-sm font-semibold text-gf-text">Kunde akzeptiert</p>
        <textarea
          value={acceptNote}
          onChange={(e) => setAcceptNote(e.target.value)}
          placeholder="Optionale Notiz…"
          className="mb-4 w-full rounded-lg border border-gf-border bg-gf-surface px-3 py-2 text-sm text-gf-text placeholder:text-gf-text-muted focus:border-gf-primary focus:outline-none"
          rows={2}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => { setShowAcceptModal(false); setAcceptNote('') }}
            className="rounded-lg border border-gf-border px-4 py-2 text-sm text-gf-text-muted hover:bg-gf-surface transition-colors"
          >
            Abbrechen
          </button>
          <button
            disabled={isAccepting}
            onClick={handleClientAccept}
            className="rounded-lg bg-gf-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isAccepting ? 'Wird gespeichert…' : '✅ Akzeptieren'}
          </button>
        </div>
      </Modal>

      <Modal open={showRejectModal} onClose={() => { setShowRejectModal(false); setRejectReason(''); setRejectError('') }}>
        <p className="mb-2 text-sm font-semibold text-gf-text">Ablehnung begründen</p>
        <textarea
          value={rejectReason}
          onChange={(e) => { setRejectReason(e.target.value); setRejectError('') }}
          placeholder="Ablehnungsgrund (Pflichtfeld)…"
          className={`mb-1 w-full rounded-lg border bg-gf-surface px-3 py-2 text-sm text-gf-text placeholder:text-gf-text-muted focus:outline-none ${rejectError ? 'border-gf-danger focus:border-gf-danger' : 'border-gf-border focus:border-gf-primary'}`}
          rows={3}
        />
        {rejectError && <p className="mb-3 text-xs text-rose-600">{rejectError}</p>}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => { setShowRejectModal(false); setRejectReason(''); setRejectError('') }}
            className="rounded-lg border border-gf-border px-4 py-2 text-sm text-gf-text-muted hover:bg-gf-surface transition-colors"
          >
            Abbrechen
          </button>
          <button
            disabled={isRejecting}
            onClick={handleClientReject}
            className="rounded-lg bg-gf-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isRejecting ? 'Wird gespeichert…' : '❌ Ablehnen'}
          </button>
        </div>
      </Modal>

      <Modal open={showInvoiceModal} onClose={() => { setShowInvoiceModal(false); setInvoiceNumber(''); setInvoiceError('') }}>
        <p className="mb-2 text-sm font-semibold text-gf-text">Rechnungsnummer eingeben</p>
        <input
          type="text"
          value={invoiceNumber}
          onChange={(e) => { setInvoiceNumber(e.target.value); setInvoiceError('') }}
          placeholder="z.B. RE-2026-0042"
          className={`mb-1 w-full rounded-lg border bg-gf-surface px-3 py-2 text-sm text-gf-text placeholder:text-gf-text-muted focus:outline-none ${invoiceError ? 'border-gf-danger focus:border-gf-danger' : 'border-gf-border focus:border-gf-primary'}`}
        />
        {invoiceError && <p className="mb-3 text-xs text-rose-600">{invoiceError}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => { setShowInvoiceModal(false); setInvoiceNumber(''); setInvoiceError('') }}
            className="rounded-lg border border-gf-border px-4 py-2 text-sm text-gf-text-muted hover:bg-gf-surface transition-colors"
          >
            Abbrechen
          </button>
          <button
            disabled={isInvoicing}
            onClick={handleInvoice}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isInvoicing ? 'Wird gespeichert…' : '🧾 Fakturieren'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

/* ─── Reusable Modal ─── */
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl border border-gf-border bg-gf-card p-6 shadow-xl">
        {children}
      </div>
    </div>
  )
}
