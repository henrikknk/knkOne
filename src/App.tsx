import { useEffect, useRef, useState, type ReactNode } from 'react'
import './App.css'
import { getContext } from '@microsoft/power-apps/app'
import { Office365OutlookService } from './generated/services/Office365OutlookService'
import { leadsTable, opportunitiesTable, systemUsersTable, activitiesTable } from './services/tables'
import { choiceLabel, lookupName } from './services/Dataverse'
import { Leadsstatuscode } from './generated/models/LeadsModel'
import { Opportunitiesstatuscode } from './generated/models/OpportunitiesModel'

type Status = 'ok' | 'warn' | 'err'

interface WidgetDef {
  id: string
  title: string
  source: string
  status: Status
  statusText?: string
}

interface RoleDef {
  id: string
  name: string
  desc: string
  widgets: string[]
}

const SOURCE_COLORS: Record<string, string> = {
  'Dynamics 365 Sales': '#7C5CFC',
  SharePoint: '#E8620C',
  Jira: '#2684FF',
  ToDo: '#14B8A6',
  'Web-Search (Live)': '#F59E0B',
  Confluence: '#5B7083',
  'NAV / Datasets': '#16A34A',
  'Outlook / Office': '#0EA5E9',
}

const SOURCE_INITIALS: Record<string, string> = {
  'Dynamics 365 Sales': 'D365',
  SharePoint: 'SP',
  Jira: 'JIR',
  ToDo: 'TD',
  'Web-Search (Live)': 'WEB',
  Confluence: 'CNF',
  'NAV / Datasets': 'NAV',
  'Outlook / Office': 'OL',
}

function initials(source: string) {
  return SOURCE_INITIALS[source] || source.slice(0, 3).toUpperCase()
}

// Von Kundensignale und Vertragsübersicht gemeinsam genutzte Kundenliste.
const KNK_CUSTOMERS = [
  'HJR',
  'SWMH',
  'C.H. Beck',
  '720 Health Media GmbH & Co. KG',
  'Carl Hanser Verlag GmbH & Co. KG',
  'Condé Nast Germany GmbH',
  'Deutscher Landwirtschaftsverlag GmbH',
  'Haufe-Lexware GmbH & Co. KG',
  'Heise Medien GmbH & Co. KG',
  'Holzmann Medien GmbH & Co. KG',
  'Hueber Verlag GmbH & Co. KG',
  'knk Business Software AG',
  'markom GmbH & Co. KG',
  'Verlagsgruppe Beltz Julius Beltz GmbH & Co. KG',
  'Vincentz Network GmbH & Co. KG',
  'WEKA Media GmbH & Co. KG',
  'Wort & Bild Verlag GmbH & Co. KG',
]

// Noch keine Live-Daten: die meisten Quellen warten weiter auf die MCP-Orchestrierung.
// "kommunikation" ist bereits per Office 365 Outlook-Connector live angebunden.
const CATALOG_BASE: Array<Omit<WidgetDef, 'statusText'>> = [
  { id: 'vertragsuebersicht', title: 'Vertragsübersicht', source: 'SharePoint', status: 'ok' },
  { id: 'kundenhistorie', title: 'Kundenhistorie', source: 'Dynamics 365 Sales', status: 'warn' },
  { id: 'tickets', title: 'Tickets', source: 'Jira', status: 'warn' },
  { id: 'aktivitaeten', title: 'Aktivitäten', source: 'ToDo', status: 'warn' },
  { id: 'vertriebsvorgaenge', title: 'Vertriebsvorgänge', source: 'Dynamics 365 Sales', status: 'ok' },
  { id: 'kundensignale', title: 'Kundensignale', source: 'Web-Search (Live)', status: 'ok' },
  { id: 'confluence', title: 'Confluence', source: 'Confluence', status: 'warn' },
  { id: 'umsaetze', title: 'Umsätze', source: 'NAV / Datasets', status: 'warn' },
  { id: 'kommunikation', title: 'Kommunikation', source: 'Outlook / Office', status: 'ok' },
  { id: 'teams', title: 'Teams-Aktivität', source: 'Outlook / Office', status: 'warn' },
]

const LIVE_STATUS_TEXT: Record<string, string> = {
  kommunikation: 'Verbunden mit Outlook (Office 365)',
  kundensignale: 'Verbunden mit Perplexity',
  vertragsuebersicht: 'Verbunden mit SharePoint (Vertragsdokumente)',
  vertriebsvorgaenge: 'Verbunden mit Dynamics 365 Sales (Dataverse)',
}

const CATALOG: WidgetDef[] = CATALOG_BASE.map((w) => ({
  ...w,
  statusText: LIVE_STATUS_TEXT[w.id] ?? `MCP-Server "${w.source}" noch nicht orchestriert`,
}))

const ROLES: RoleDef[] = [
  {
    id: 'neukunden',
    name: 'Neukundenvertrieb',
    desc: 'Leads, Signale und Aktivitäten für die Neukundengewinnung',
    widgets: ['vertragsuebersicht', 'vertriebsvorgaenge', 'kundensignale', 'aktivitaeten', 'kommunikation'],
  },
  {
    id: 'bestandskunden',
    name: 'Bestandskundenvertrieb',
    desc: 'Vertragslage, Umsätze und offene Vorgänge bestehender Kunden',
    widgets: ['vertragsuebersicht', 'kundenhistorie', 'umsaetze', 'tickets', 'confluence', 'kundensignale', 'kommunikation'],
  },
  {
    id: 'projektleitung',
    name: 'Projektleitung',
    desc: 'Tickets, Aktivitäten und Kundenanpassungen laufender Projekte',
    widgets: ['tickets', 'aktivitaeten', 'confluence', 'kundenhistorie', 'teams'],
  },
  {
    id: 'consulting',
    name: 'Consulting-Team',
    desc: 'Tagessätze, Kundenanpassungen und Termine im Beratungsalltag',
    widgets: ['vertragsuebersicht', 'confluence', 'aktivitaeten', 'tickets', 'teams'],
  },
]

const STORAGE_KEY = 'knkone.dashboard.config.v1'

function loadConfig(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveConfig(cfg: Record<string, string[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
  } catch {
    // ignore storage errors (e.g. private browsing quota)
  }
}

interface CardShellProps {
  widget: WidgetDef
  editing: boolean
  dragging: boolean
  onRemove: () => void
  onDragStart: () => void
  onDragEnd: () => void
  onDrop: () => void
  status: Status
  statusText: string
  children: ReactNode
}

function CardShell({ widget, editing, dragging, onRemove, onDragStart, onDragEnd, onDrop, status, statusText, children }: CardShellProps) {
  const statusCls = status === 'ok' ? 'ok' : status === 'err' ? 'err' : 'warn'
  const statusLabel = status === 'ok' ? 'Verbunden' : statusText

  return (
    <div
      className={`card${editing ? ' editing' : ''}${dragging ? ' dragging' : ''}`}
      draggable={editing}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        if (editing) e.preventDefault()
      }}
      onDrop={(e) => {
        if (!editing) return
        e.preventDefault()
        onDrop()
      }}
    >
      <div className="card-head">
        <div style={{ display: 'flex', gap: 10, minWidth: 0 }}>
          {editing && (
            <span className="drag-handle" title="Ziehen zum Anordnen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="9" cy="6" r="1" />
                <circle cx="9" cy="12" r="1" />
                <circle cx="9" cy="18" r="1" />
                <circle cx="15" cy="6" r="1" />
                <circle cx="15" cy="12" r="1" />
                <circle cx="15" cy="18" r="1" />
              </svg>
            </span>
          )}
          <div className="card-title-wrap">
            <div className="card-title">{widget.title}</div>
            <div className="card-sub">
              <span className="source-tag">{widget.source}</span>
              <span className="mcp-chip">MCP</span>
            </div>
            <div className="status-row">
              <span className={`status-dot ${statusCls}`} />
              <span className={`status-text ${statusCls}`}>{statusLabel}</span>
            </div>
          </div>
        </div>
        {editing && (
          <button className="card-remove" type="button" aria-label="Widget entfernen" onClick={onRemove}>
            &times;
          </button>
        )}
      </div>
      <div className="card-body">{children}</div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9v4M12 17h.01" />
        <path d="M10.3 3.9 2.7 17.1A1.8 1.8 0 0 0 4.3 20h15.4a1.8 1.8 0 0 0 1.6-2.9L13.7 3.9a1.8 1.8 0 0 0-3.4 0Z" />
      </svg>
      <b>Keine Daten verfügbar</b>
      <span>{text}</span>
    </div>
  )
}

interface WidgetCardProps {
  widget: WidgetDef
  editing: boolean
  dragging: boolean
  onRemove: () => void
  onDragStart: () => void
  onDragEnd: () => void
  onDrop: () => void
}

function WidgetCard({ widget, ...shellProps }: WidgetCardProps) {
  return (
    <CardShell widget={widget} status={widget.status} statusText={widget.statusText || ''} {...shellProps}>
      <EmptyState text={widget.statusText || 'Quelle nicht erreichbar'} />
    </CardShell>
  )
}

function formatEventDateTime(start?: string, end?: string) {
  const startDate = start ? new Date(start) : null
  const endDate = end ? new Date(end) : null
  const dateLabel =
    startDate && !Number.isNaN(startDate.getTime())
      ? startDate.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
      : '?'
  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
  const startLabel = startDate && !Number.isNaN(startDate.getTime()) ? startDate.toLocaleTimeString('de-DE', timeOpts) : '?'
  const endLabel = endDate && !Number.isNaN(endDate.getTime()) ? endDate.toLocaleTimeString('de-DE', timeOpts) : '?'
  return `${dateLabel} · ${startLabel} – ${endLabel} Uhr`
}

interface UpcomingEvent {
  id: string
  subject: string
  start?: string
  end?: string
}

const UPCOMING_EVENTS_WINDOW_DAYS = 30
const UPCOMING_EVENTS_LIMIT = 5

// Live-Widget: die nächsten 5 anstehenden Termine über den Office 365 Outlook-Connector.
function OutlookCalendarCard({ widget, ...shellProps }: WidgetCardProps) {
  const [status, setStatus] = useState<Status>('warn')
  const [statusText, setStatusText] = useState('Kalender wird geladen…')
  const [events, setEvents] = useState<UpcomingEvent[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        // "Calendar" ist nicht immer eine gültige Kalender-ID - den echten Namen per API ermitteln.
        const tables = await Office365OutlookService.CalendarGetTables()
        const tableList = tables.success ? tables.data?.value ?? [] : []
        const calendarId = tableList.find((t) => t.DisplayName === 'Calendar')?.Name || tableList[0]?.Name || 'Calendar'

        const now = new Date()
        const rangeEnd = new Date(now)
        rangeEnd.setDate(rangeEnd.getDate() + UPCOMING_EVENTS_WINDOW_DAYS)

        const result = await Office365OutlookService.GetEventsCalendarViewV3(calendarId, now.toISOString(), rangeEnd.toISOString())
        if (cancelled) return
        if (result.success) {
          const upcoming = (result.data?.value ?? [])
            .filter((event) => event.start)
            .map((event) => ({
              id: event.id || `${event.subject}-${event.start}`,
              subject: event.subject || '(kein Titel)',
              start: event.start,
              end: event.end,
            }))
            .sort((a, b) => new Date(a.start ?? 0).getTime() - new Date(b.start ?? 0).getTime())
            .slice(0, UPCOMING_EVENTS_LIMIT)
          setEvents(upcoming)
          setStatus('ok')
          setStatusText('Verbunden mit Outlook (Office 365)')
        } else {
          setStatus('err')
          setStatusText(result.error?.message || 'Kalender konnte nicht geladen werden')
        }
      } catch (err) {
        if (cancelled) return
        setStatus('err')
        setStatusText(err instanceof Error ? err.message : 'Kalender konnte nicht geladen werden')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <CardShell widget={widget} status={status} statusText={statusText} {...shellProps}>
      {events.length > 0 ? (
        events.map((event) => (
          <div className="row-line" key={event.id}>
            <div className="row-main">
              <div className="row-title">{event.subject}</div>
              <div className="row-meta">{formatEventDateTime(event.start, event.end)}</div>
            </div>
          </div>
        ))
      ) : (
        <EmptyState text={status === 'ok' ? 'Keine anstehenden Termine' : statusText} />
      )}
    </CardShell>
  )
}

// Kein Secret hardcoden: der Key kommt aus .env.local (nicht eingecheckt), landet aber trotzdem im Browser-Bundle,
// da dieser Aufruf clientseitig läuft. Perplexity erlaubt CORS, hat aber ein sehr enges Rate-Limit -
// Anfragen müssen nacheinander (nicht parallel) laufen, sonst schlagen sie mit HTTP 429 fehl.
const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY
const PERPLEXITY_ENDPOINT = 'https://api.perplexity.ai/chat/completions'

// Schalter zum Sparen von Perplexity-Tokens: auf true setzen, um die Live-Abfrage wieder zu aktivieren.
const KUNDENSIGNALE_LIVE_ENABLED = false

interface CustomerSignal {
  customer: string
  title: string
  date?: string
  source?: string
  url?: string
}

function stripJsonFence(text: string) {
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
}

// Undatierte/nicht parsbare Einträge landen ans Ende statt die Sortierung zu verfälschen.
function sortSignalsByDateDesc(items: CustomerSignal[]): CustomerSignal[] {
  return [...items].sort((a, b) => {
    const timeA = a.date ? Date.parse(a.date) : NaN
    const timeB = b.date ? Date.parse(b.date) : NaN
    if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0
    if (Number.isNaN(timeA)) return 1
    if (Number.isNaN(timeB)) return -1
    return timeB - timeA
  })
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason)
    })
  })
}

// Der Key hat ein sehr enges Rate-Limit (429) - bei Bedarf mit Backoff erneut versuchen.
async function fetchCustomerSignals(customer: string, signal?: AbortSignal): Promise<CustomerSignal[]> {
  const maxAttempts = 3
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(PERPLEXITY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Recherche-Assistent für den Vertrieb. Antworte ausschließlich mit kompaktem JSON, ohne Markdown und ohne Erklärtext.',
          },
          {
            role: 'user',
            content: `Suche die aktuellsten öffentlichen Nachrichten/Signale (z. B. Meldungen, Personalwechsel, Übernahmen, Digitalisierungsprojekte) zum Unternehmen "${customer}". Antworte als JSON-Array (max. 7 Einträge) mit Objekten {"title": string, "date": string, "source": string, "url": string}.`,
          },
        ],
      }),
      signal,
    })

    if (response.status === 429) {
      if (attempt === maxAttempts) {
        throw new Error(`Perplexity-Anfrage für ${customer} fehlgeschlagen (HTTP 429, Rate-Limit)`)
      }
      const retryAfterSeconds = Number(response.headers.get('retry-after'))
      const waitMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : 1500 * attempt
      await delay(waitMs, signal)
      continue
    }

    if (!response.ok) {
      throw new Error(`Perplexity-Anfrage für ${customer} fehlgeschlagen (HTTP ${response.status})`)
    }

    const payload: { choices?: Array<{ message?: { content?: string } }> } = await response.json()
    const content = payload.choices?.[0]?.message?.content ?? '[]'

    let parsed: unknown
    try {
      parsed = JSON.parse(stripJsonFence(content))
    } catch {
      throw new Error(`Antwort für ${customer} enthielt kein lesbares JSON`)
    }
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => ({
        customer,
        title: typeof item.title === 'string' ? item.title : 'Ohne Titel',
        date: typeof item.date === 'string' ? item.date : undefined,
        source: typeof item.source === 'string' ? item.source : undefined,
        url: typeof item.url === 'string' ? item.url : undefined,
      }))
  }
  return []
}

// Live-Widget: aktuelle Kundensignale zu allen Kunden aus SIGNAL_CUSTOMERS über die Perplexity-API.
function PerplexitySignalsCard({ widget, ...shellProps }: WidgetCardProps) {
  const [status, setStatus] = useState<Status>('warn')
  const [statusText, setStatusText] = useState('Kundensignale werden geladen…')
  const [signals, setSignals] = useState<CustomerSignal[]>([])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function load() {
      if (!KUNDENSIGNALE_LIVE_ENABLED) {
        if (cancelled) return
        setStatus('warn')
        setStatusText('Kundensignale pausiert (deaktiviert, um Perplexity-Tokens zu sparen)')
        return
      }
      if (!PERPLEXITY_API_KEY) {
        if (cancelled) return
        setStatus('err')
        setStatusText('Kein Perplexity API-Key konfiguriert (VITE_PERPLEXITY_API_KEY fehlt in .env.local)')
        return
      }
      // Nacheinander statt parallel abfragen, da der API-Key ein sehr enges Rate-Limit hat.
      const collected: CustomerSignal[] = []
      const failures: string[] = []
      let sawNetworkFailure = false
      for (const [index, customer] of KNK_CUSTOMERS.entries()) {
        if (!cancelled) setStatusText(`Lädt Kundensignale … (${index + 1}/${KNK_CUSTOMERS.length}: ${customer})`)
        try {
          collected.push(...(await fetchCustomerSignals(customer, controller.signal)))
        } catch (err) {
          if (controller.signal.aborted) return
          if (err instanceof TypeError) sawNetworkFailure = true
          failures.push(`${customer}: ${err instanceof Error ? err.message : 'unbekannter Fehler'}`)
        }
        // Kleiner Puffer zwischen Kunden, damit das enge Rate-Limit sicher zurückgesetzt ist.
        await delay(1200, controller.signal).catch(() => {})
      }
      if (cancelled) return
      setSignals(sortSignalsByDateDesc(collected).slice(0, 10))
      if (collected.length > 0) {
        setStatus('ok')
        setStatusText(failures.length > 0 ? `Verbunden mit Perplexity (${failures.length} Kunde(n) ohne Ergebnis)` : 'Verbunden mit Perplexity')
      } else if (sawNetworkFailure) {
        setStatus('err')
        setStatusText('Netzwerkfehler beim Aufruf von Perplexity (Verbindung geprüft, ggf. Dev-Server neu starten)')
      } else {
        setStatus('err')
        setStatusText(failures[0] || 'Kundensignale konnten nicht geladen werden')
      }
    }

    load()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  return (
    <CardShell widget={widget} status={status} statusText={statusText} {...shellProps}>
      {signals.length > 0 ? (
        signals.map((signal, index) => (
          <div className="row-line" key={`${signal.customer}-${index}`}>
            <div className="row-main">
              <div className="row-title">
                {signal.url ? (
                  <a className="row-link" href={signal.url} target="_blank" rel="noopener noreferrer">
                    {signal.title}
                  </a>
                ) : (
                  signal.title
                )}
              </div>
              <div className="row-meta">
                {signal.customer}
                {signal.source ? ` · ${signal.source}` : ''}
                {signal.date ? ` · ${signal.date}` : ''}
              </div>
            </div>
          </div>
        ))
      ) : (
        <EmptyState text={status === 'ok' ? 'Keine aktuellen Signale gefunden' : statusText} />
      )}
    </CardShell>
  )
}

interface ContractLine {
  title: string
  meta: string
  value: string
}

interface ContractInfo {
  source: string
  lines: ContractLine[]
}

// Nur echte, aus Vertragsdokumenten entnommene Werte - keine erfundenen Zahlen für andere Kunden.
const CONTRACTS: Record<string, ContractInfo> = {
  'Verlagsgruppe Beltz Julius Beltz GmbH & Co. KG': {
    source: 'Rahmenvertrag vom 15.01.2023 · Anlage 1 Preise & Konditionen vom 04.08.2021',
    lines: [
      { title: 'Tagessatz Dienstleistungen', meta: 'seit 01.01.2023 · unbestimmte Laufzeit', value: '1.300 €/Tag' },
      { title: 'Tagessatz Projektmanagement', meta: 'abweichender Satz laut Anlage 1', value: '1.215 €/Tag' },
      { title: 'Kündigungsfrist', meta: 'Rahmenvertrag §9', value: '3 Monate zum Jahresende' },
      { title: 'Zahlungsziel', meta: 'laut Rahmenvertrag §7', value: '30 Tage netto' },
    ],
  },
}

// Live-Widget: Vertragskonditionen je Kunde, per Dropdown auswählbar (Quelle: SharePoint-Vertragsdokumente).
function VertragsuebersichtCard({ widget, ...shellProps }: WidgetCardProps) {
  const [selectedCustomer, setSelectedCustomer] = useState(
    () => KNK_CUSTOMERS.find((customer) => CONTRACTS[customer]) ?? KNK_CUSTOMERS[0],
  )
  const contract = CONTRACTS[selectedCustomer]

  return (
    <CardShell widget={widget} status="ok" statusText="Verbunden" {...shellProps}>
      <select
        className="contract-select"
        value={selectedCustomer}
        onChange={(e) => setSelectedCustomer(e.target.value)}
      >
        {KNK_CUSTOMERS.map((customer) => (
          <option key={customer} value={customer}>
            {customer}
          </option>
        ))}
      </select>
      {contract ? (
        contract.lines.map((line) => (
          <div className="row-line" key={line.title}>
            <div className="row-main">
              <div className="row-title">{line.title}</div>
              <div className="row-meta">{line.meta}</div>
            </div>
            <span className="row-value">{line.value}</span>
          </div>
        ))
      ) : (
        <EmptyState text="Keine Vertragsdaten für diesen Kunden hinterlegt" />
      )}
    </CardShell>
  )
}

interface DisplayLead {
  id: string
  subject: string
  company: string
  status: string
  value?: number
  latestActivityDue?: string
}

interface DisplayOpportunity {
  id: string
  name: string
  customer: string
  status: string
  value?: number
  latestActivityDue?: string
}

function formatCurrency(value?: number) {
  if (value === undefined || value === null) return '–'
  return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

function formatDueDate(value?: string) {
  if (!value) return 'keine Aktivität'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `fällig ${date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
}

// Direktlink auf den Datensatz im Modell-getriebenen CRM (nutzt die Org-URL aus dem App-Kontext).
function crmRecordUrl(orgUrl: string | undefined, entityLogicalName: string, id: string): string | undefined {
  if (!orgUrl) return undefined
  return `${orgUrl.replace(/\/$/, '')}/main.aspx?pagetype=entityrecord&etn=${entityLogicalName}&id=${id}`
}

const EMAIL_ACTIVITY_TYPE_CODE = 4202

// Spätestes Fälligkeitsdatum (scheduledend) einer nicht-E-Mail-Aktivität zu einem Lead/einer Opportunity.
// Kein Server-Filter auf activitytypecode: falls der Typ dort als String statt Zahl geführt wird, würde
// "ne 4202" sonst clientseitig unbemerkt 0 Treffer liefern - daher hier lieber lokal aussortieren.
async function getLatestActivityDueDate(regardingId: string): Promise<string | undefined> {
  const activities = await activitiesTable.getAll({
    select: ['activityid', 'scheduledend', 'activitytypecode'],
    filter: `_regardingobjectid_value eq ${regardingId}`,
    orderBy: ['scheduledend desc'],
    top: 10,
  })
  const nonEmail = activities.find(
    (activity) => activity.activitytypecode !== EMAIL_ACTIVITY_TYPE_CODE && String(activity.activitytypecode).toLowerCase() !== 'email',
  )
  console.log('Vertriebsvorgänge: Aktivitätsabfrage', {
    regardingId,
    gefunden: activities.length,
    aktivitaeten: activities.map((a) => ({ id: a.activityid, typ: a.activitytypecode, faelligkeit: a.scheduledend })),
    ausgewaehlt: nonEmail?.scheduledend,
  })
  return nonEmail?.scheduledend
}

// Undatierte Einträge (keine Aktivität) landen ans Ende statt die Sortierung zu verfälschen.
function sortByLatestActivityDesc<T extends { latestActivityDue?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const timeA = a.latestActivityDue ? Date.parse(a.latestActivityDue) : NaN
    const timeB = b.latestActivityDue ? Date.parse(b.latestActivityDue) : NaN
    if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0
    if (Number.isNaN(timeA)) return 1
    if (Number.isNaN(timeB)) return -1
    return timeB - timeA
  })
}

// Live-Widget: eigene offene Leads und Opportunities aus Dataverse, sortiert nach der zuletzt fälligen Aktivität.
function VertriebsvorgaengeCard({ widget, ...shellProps }: WidgetCardProps) {
  const [status, setStatus] = useState<Status>('warn')
  const [statusText, setStatusText] = useState('Vertriebsvorgänge werden geladen…')
  const [leads, setLeads] = useState<DisplayLead[]>([])
  const [opportunities, setOpportunities] = useState<DisplayOpportunity[]>([])
  const [orgUrl, setOrgUrl] = useState<string>()

  useEffect(() => {
    let cancelled = false

    async function load() {
      let currentUserId: string
      try {
        const context = await getContext()
        if (!cancelled) setOrgUrl(context.app.dataverseOrgUrl)
        const aadObjectId = context.user.objectId
        if (!aadObjectId) throw new Error('Keine Azure-AD-Objekt-ID im App-Kontext gefunden')
        const currentUsers = await systemUsersTable.getAll({
          select: ['systemuserid'],
          filter: `azureactivedirectoryobjectid eq ${aadObjectId}`,
          top: 1,
        })
        if (!currentUsers[0]) throw new Error('Kein Dataverse-Benutzer zur aktuellen Anmeldung gefunden')
        currentUserId = currentUsers[0].systemuserid
        console.log('Vertriebsvorgänge: aktueller Benutzer', { aadObjectId, currentUserId })
      } catch (err) {
        if (cancelled) return
        setStatus('err')
        console.error('Vertriebsvorgänge: aktueller Benutzer konnte nicht ermittelt werden', err)
        setStatusText(err instanceof Error ? err.message : 'Aktueller Benutzer konnte nicht ermittelt werden')
        return
      }

      // allSettled statt all: ein Fehler bei Opportunities soll nicht auch die bereits geladenen Leads verstecken.
      const [leadsResult, opportunitiesResult] = await Promise.allSettled([
        leadsTable.getAll({
          select: ['leadid', 'subject', 'companyname', 'estimatedvalue', 'statuscode'],
          filter: `statecode eq 0 and _ownerid_value eq ${currentUserId}`,
          top: 5,
        }),
        opportunitiesTable.getAll({
          // Kein $select auf "customerid"/"customeridname": falsche OData-Feldnamen für den polymorphen
          // Lookup führten hier zu Fehlern - bis das geklärt ist, den vollen Datensatz laden statt zu raten.
          filter: `statecode eq 0 and _ownerid_value eq ${currentUserId}`,
          top: 5,
        }),
      ])
      if (cancelled) return
      console.log('Vertriebsvorgänge: Rohergebnisse', {
        leads: leadsResult.status === 'fulfilled' ? leadsResult.value.length : `Fehler: ${leadsResult.reason}`,
        opportunities:
          opportunitiesResult.status === 'fulfilled' ? opportunitiesResult.value.length : `Fehler: ${opportunitiesResult.reason}`,
      })

      const failures: string[] = []

      if (leadsResult.status === 'fulfilled') {
        const withDueDates = await Promise.all(
          leadsResult.value.map(async (lead) => ({
            id: lead.leadid,
            subject: lead.subject || '(ohne Thema)',
            company: lead.companyname || '–',
            status: choiceLabel(Leadsstatuscode, lead.statuscode) || '–',
            value: lead.estimatedvalue,
            latestActivityDue: await getLatestActivityDueDate(lead.leadid).catch((err) => {
              console.error('Vertriebsvorgänge: Aktivitätsabfrage für Lead fehlgeschlagen', lead.leadid, err)
              return undefined
            }),
          })),
        )
        if (cancelled) return
        setLeads(sortByLatestActivityDesc(withDueDates))
      } else {
        console.error('Vertriebsvorgänge: Leads laden fehlgeschlagen', leadsResult.reason)
        failures.push(`Leads: ${leadsResult.reason instanceof Error ? leadsResult.reason.message : 'unbekannter Fehler'}`)
      }

      if (opportunitiesResult.status === 'fulfilled') {
        const withDueDates = await Promise.all(
          opportunitiesResult.value.map(async (opp) => ({
            id: opp.opportunityid,
            name: opp.name || '(ohne Namen)',
            customer: lookupName(opp, 'customerid') || '–',
            status: choiceLabel(Opportunitiesstatuscode, opp.statuscode) || '–',
            value: opp.estimatedvalue,
            latestActivityDue: await getLatestActivityDueDate(opp.opportunityid).catch((err) => {
              console.error('Vertriebsvorgänge: Aktivitätsabfrage für Opportunity fehlgeschlagen', opp.opportunityid, err)
              return undefined
            }),
          })),
        )
        if (cancelled) return
        setOpportunities(sortByLatestActivityDesc(withDueDates))
      } else {
        console.error('Vertriebsvorgänge: Opportunities laden fehlgeschlagen', opportunitiesResult.reason)
        failures.push(
          `Opportunities: ${opportunitiesResult.reason instanceof Error ? opportunitiesResult.reason.message : 'unbekannter Fehler'}`,
        )
      }

      if (failures.length === 0) {
        setStatus('ok')
        setStatusText('Verbunden mit Dynamics 365 Sales (Dataverse)')
      } else if (leadsResult.status === 'fulfilled' || opportunitiesResult.status === 'fulfilled') {
        setStatus('ok')
        setStatusText(`Teilweise verbunden (${failures.join(' · ')})`)
      } else {
        setStatus('err')
        const message = failures[0] || ''
        setStatusText(
          message.includes('Failed to load Dataverse database references from runtime')
            ? 'Kein Dataverse-Zugriff: App bitte über den "Local Play"-Link aus der Vite-Konsole öffnen (nicht direkt localhost)'
            : message || 'Vertriebsvorgänge konnten nicht geladen werden',
        )
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const hasData = leads.length > 0 || opportunities.length > 0

  return (
    <CardShell widget={widget} status={status} statusText={statusText} {...shellProps}>
      {hasData ? (
        <>
          {leads.length > 0 && <div className="live-search-note">Meine Leads</div>}
          {leads.map((lead) => (
            <div className="row-line" key={lead.id}>
              <div className="row-main">
                <div className="row-title">{lead.subject}</div>
                <div className="row-meta">
                  {lead.company} · {lead.status} · {formatDueDate(lead.latestActivityDue)}
                </div>
              </div>
              <span className="row-value">{formatCurrency(lead.value)}</span>
            </div>
          ))}
          {opportunities.length > 0 && <div className="live-search-note">Meine Opportunities</div>}
          {opportunities.map((opp) => {
            const recordUrl = crmRecordUrl(orgUrl, 'opportunity', opp.id)
            return (
              <div className="row-line" key={opp.id}>
                <div className="row-main">
                  <div className="row-title">
                    {recordUrl ? (
                      <a className="row-link" href={recordUrl} target="_blank" rel="noopener noreferrer">
                        {opp.name}
                      </a>
                    ) : (
                      opp.name
                    )}
                  </div>
                  <div className="row-meta">
                    {opp.customer} · {opp.status} · {formatDueDate(opp.latestActivityDue)}
                  </div>
                </div>
                <span className="row-value">{formatCurrency(opp.value)}</span>
              </div>
            )
          })}
        </>
      ) : (
        <EmptyState text={status === 'ok' ? 'Keine eigenen offenen Leads oder Opportunities' : statusText} />
      )}
    </CardShell>
  )
}

const SPECIAL_CARDS: Record<string, (props: WidgetCardProps) => ReactNode> = {
  kommunikation: OutlookCalendarCard,
  kundensignale: PerplexitySignalsCard,
  vertragsuebersicht: VertragsuebersichtCard,
  vertriebsvorgaenge: VertriebsvorgaengeCard,
}

function App() {
  const [roleId, setRoleId] = useState(ROLES[0].id)
  const [editing, setEditing] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [config, setConfig] = useState<Record<string, string[]>>(() => loadConfig())
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dragSrc = useRef<string | null>(null)

  useEffect(() => {
    saveConfig(config)
  }, [config])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setModalOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const role = ROLES.find((r) => r.id === roleId) ?? ROLES[0]
  const widgetIds = config[roleId] ?? role.widgets

  function widgetsForRole(id: string) {
    const r = ROLES.find((x) => x.id === id)
    return config[id] ?? r?.widgets ?? []
  }

  function updateWidgets(list: string[]) {
    setConfig((prev) => ({ ...prev, [roleId]: list }))
  }

  function showToast(msg: string) {
    setToast({ msg, key: Date.now() })
  }

  function toggleEditing() {
    setEditing((e) => {
      const next = !e
      showToast(next ? 'Konfigurationsmodus aktiv' : 'Konfiguration gespeichert')
      return next
    })
  }

  function removeWidget(id: string) {
    const w = CATALOG.find((c) => c.id === id)
    updateWidgets(widgetIds.filter((x) => x !== id))
    if (w) showToast(`${w.title} entfernt`)
  }

  function addWidget(id: string) {
    const w = CATALOG.find((c) => c.id === id)
    updateWidgets([...widgetIds, id])
    setModalOpen(false)
    if (w) showToast(`${w.title} zum Dashboard hinzugefügt`)
  }

  function reorder(targetId: string) {
    const src = dragSrc.current
    if (!src || src === targetId) return
    const ids = [...widgetIds]
    const from = ids.indexOf(src)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    ids.splice(to, 0, ids.splice(from, 1)[0])
    updateWidgets(ids)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">KNK</div>
          <div className="brand-text">
            <b>KNK One</b>
            <span>Vertrieb &amp; Projekte</span>
          </div>
        </div>

        <div>
          <div className="nav-label">Rolle</div>
          <nav className="nav">
            {ROLES.map((r) => (
              <div
                key={r.id}
                className={`nav-item${r.id === roleId ? ' active' : ''}`}
                onClick={() => setRoleId(r.id)}
              >
                <span className="role-name">{r.name}</span>
                <span className="role-count">{widgetsForRole(r.id).length} Widgets</span>
              </div>
            ))}
          </nav>
        </div>

        <div className="sidebar-spacer" />

        <div className="sidebar-foot">
          <button className="foot-link" type="button" onClick={toggleEditing}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
              <path d="M12 8v4l2.5 1.5" />
            </svg>
            <span>Dashboard konfigurieren</span>
          </button>
          <div className="user-chip">
            <div className="user-avatar">MM</div>
            <div className="user-meta">
              <b>Max Mustermann</b>
              <span>Vertrieb, KNK</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="main-head">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>{role.name}</h1>
            <p>{role.desc}</p>
          </div>
          <div className="head-actions">
            <button className="btn" type="button" onClick={() => setModalOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Widget hinzufügen
            </button>
            <button className={`btn${editing ? ' is-active' : ''}`} type="button" onClick={toggleEditing}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              <span>{editing ? 'Fertig' : 'Bearbeiten'}</span>
            </button>
          </div>
        </div>

        <div className="grid">
          {widgetIds.map((id) => {
            const w = CATALOG.find((c) => c.id === id)
            if (!w) return null
            const Card = SPECIAL_CARDS[w.id] ?? WidgetCard
            return (
              <Card
                key={w.id}
                widget={w}
                editing={editing}
                dragging={draggingId === w.id}
                onRemove={() => removeWidget(w.id)}
                onDragStart={() => {
                  dragSrc.current = w.id
                  setDraggingId(w.id)
                }}
                onDragEnd={() => setDraggingId(null)}
                onDrop={() => reorder(w.id)}
              />
            )
          })}
          {editing && (
            <button className="card add-card" type="button" onClick={() => setModalOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <b>Widget hinzufügen</b>
            </button>
          )}
        </div>
      </main>

      {modalOpen && (
        <div
          className="backdrop open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false)
          }}
        >
          <div className="modal">
            <div className="modal-head">
              <div>
                <h2>Widget hinzufügen</h2>
                <p>Module werden per MCP an die jeweilige Quelle angebunden.</p>
              </div>
              <button className="modal-close" type="button" aria-label="Schließen" onClick={() => setModalOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {CATALOG.map((w) => {
                const already = widgetIds.includes(w.id)
                const color = SOURCE_COLORS[w.source] || '#888'
                return (
                  <button
                    key={w.id}
                    type="button"
                    className="catalog-item"
                    disabled={already}
                    onClick={() => addWidget(w.id)}
                  >
                    <span className="catalog-icon" style={{ background: color }}>
                      {initials(w.source)}
                    </span>
                    <span className="catalog-text">
                      <b>{w.title}</b>
                      <span>{w.source} · per MCP</span>
                    </span>
                    {already && <span className="catalog-check">Hinzugefügt</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toast ? ' show' : ''}`}>{toast?.msg}</div>
    </div>
  )
}

export default App
