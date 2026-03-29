import { jsPDF } from 'jspdf'
import type { WorkOrderStatus, WorkType } from '@/types/enums'

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

const WORK_TYPE_LABELS: Record<WorkType, string> = {
  soplado: 'Soplado',
  fusion_ap: 'Fusión AP',
  fusion_dp: 'Fusión DP',
  alta: 'Alta',
  nt_installation: 'NT-Installation',
  patchkabel: 'Patchkabel',
}

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

interface OrderData {
  order_number: string
  work_type: WorkType
  status: WorkOrderStatus
  line: string
  address: string | null
  postal_code: string | null
  city: string | null
  assigned_date: string | null
  assigned_team: string | null
  clients: { name: string; code: string } | null
  projects: { name: string; code: string } | null
  operators: { name: string; code: string } | null
}

interface HistoryEntry {
  to_status: WorkOrderStatus
  notes: string | null
  created_at: string
}

export function generateCertificatePdf(
  order: OrderData,
  detail: Record<string, unknown>,
  _photos: unknown[],
  history: HistoryEntry[],
) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 20

  function addLine(text: string, fontSize = 10, bold = false) {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    const lines = doc.splitTextToSize(text, pageWidth - 40)
    if (y + lines.length * (fontSize * 0.5) > 275) {
      doc.addPage()
      y = 20
    }
    doc.text(lines, 20, y)
    y += lines.length * (fontSize * 0.5) + 2
  }

  function addField(label: string, value: string) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(label + ':', 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 75, y)
    y += 6
    if (y > 275) { doc.addPage(); y = 20 }
  }

  // Header
  addLine('LUMEN — HMR Nexus Engineering GmbH', 16, true)
  y += 2
  addLine(`Zertifikat: ${order.order_number}`, 12, true)
  y += 4

  // Divider
  doc.setDrawColor(200)
  doc.line(20, y, pageWidth - 20, y)
  y += 8

  // Order data
  addLine('Auftragsdaten', 12, true)
  y += 2
  addField('Kunde', order.clients ? `${order.clients.name} (${order.clients.code})` : '—')
  addField('Projekt', order.projects ? `${order.projects.code} – ${order.projects.name}` : '—')
  addField('Betreiber', order.operators?.name ?? '—')
  addField('Arbeitstyp', WORK_TYPE_LABELS[order.work_type])
  addField('Linie', order.line)
  addField('Team', order.assigned_team ?? '—')
  if (order.address || order.city) {
    addField('Adresse', [order.address, order.postal_code, order.city].filter(Boolean).join(', '))
  }
  if (order.assigned_date) {
    addField('Einsatzdatum', new Date(order.assigned_date).toLocaleDateString('de-DE'))
  }
  addField('Status', STATUS_LABELS[order.status])
  y += 4

  // Technical data
  const detailEntries = Object.entries(detail).filter(([, v]) => v !== null && v !== undefined && v !== '')
  if (detailEntries.length > 0) {
    doc.setDrawColor(200)
    doc.line(20, y, pageWidth - 20, y)
    y += 8
    addLine(`Rückmeldung — ${WORK_TYPE_LABELS[order.work_type]}`, 12, true)
    y += 2
    for (const [key, value] of detailEntries) {
      const label = DETAIL_FIELD_LABELS[key] ?? key.replace(/_/g, ' ')
      const display = typeof value === 'boolean' ? (value ? 'Ja' : 'Nein') : String(value)
      addField(label, display)
    }
    y += 4
  }

  // History
  if (history.length > 0) {
    doc.setDrawColor(200)
    doc.line(20, y, pageWidth - 20, y)
    y += 8
    addLine('Statusverlauf', 12, true)
    y += 2
    for (const entry of history) {
      const date = new Date(entry.created_at).toLocaleString('de-DE')
      const status = STATUS_LABELS[entry.to_status] ?? entry.to_status
      const note = entry.notes ? ` — ${entry.notes}` : ''
      addLine(`${date}  →  ${status}${note}`, 9)
      y += 1
    }
  }

  // Footer
  y += 8
  doc.setDrawColor(200)
  doc.line(20, y, pageWidth - 20, y)
  y += 6
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(`Generiert von LUMEN · ${new Date().toLocaleString('de-DE')}`, 20, y)

  doc.save(`Zertifikat_${order.order_number}.pdf`)
}
