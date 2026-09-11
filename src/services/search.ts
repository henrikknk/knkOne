import { getContext } from '@microsoft/power-apps/app'
import { formatCurrency, formatDate, formatTime } from '../lib/format'
import { loadEventsInRange } from './calendar'
import { listActiveContracts } from './contracts'
import { crmRecordUrl } from './Dataverse'
import { listAllMyIssues } from './jira'
import { listMyPlannerTasks } from './planner'
import { listOwnOpenLeads, listOwnOpenOpportunities, type SalesRow } from './sales'
import { listMyOpenTodos } from './todo'

// Globale Suche: durchsucht dieselben Datensätze, die die Widgets anzeigen - vollständig statt nur die geladenen Stapel.

export interface SearchRecord {
  id: string
  title: string
  meta: string
  href?: string
  /** Normalisierter Titel, für die Rangfolge */
  titleText: string
  /** Normalisierter Text aller durchsuchbaren Felder */
  text: string
}

export interface SearchSource {
  id: string
  label: string
  /** Widget, dessen Daten die Quelle durchsucht - liefert Kürzel und Farbe */
  widgetId: string
  load: () => Promise<SearchRecord[]>
}

/** Kleinschreibung ohne Akzente, damit „muller“ auch „Müller“ findet. */
function normalize(value: string): string {
  return value.toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** Dieselbe Normalisierung für andere Suchen, z. B. im Confluence-Widget. */
export const normalizeSearchText = normalize

function toRecord(id: string, title: string, meta: Array<string | null | undefined>, href?: string, extra: Array<string | null | undefined> = []): SearchRecord {
  const metaText = meta.filter(Boolean).join(' · ')
  return { id, title, meta: metaText, href: href || undefined, titleText: normalize(title), text: normalize([title, metaText, ...extra].filter(Boolean).join(' ')) }
}

const MAX_TICKET_PAGES = 10
const EVENTS_PAST_DAYS = 30
const EVENTS_FUTURE_DAYS = 90

async function searchTodos() {
  const todos = await listMyOpenTodos()
  return todos.map((todo) =>
    toRecord(todo.id, todo.title, [todo.list, todo.statusLabel, todo.dueDate && `fällig ${formatDate(todo.dueDate)}`], undefined, [todo.description]),
  )
}

async function searchPlannerTasks() {
  const tasks = await listMyPlannerTasks()
  return tasks.map((task) => toRecord(task.id, task.title, [task.plan, task.statusLabel, task.dueDate && `fällig ${formatDate(task.dueDate)}`]))
}

async function searchTickets() {
  const issues = await listAllMyIssues(MAX_TICKET_PAGES)
  return issues.map((issue) => toRecord(issue.key, issue.summary, [issue.key, issue.project, issue.status], issue.url, [issue.assignee, issue.type, issue.priority]))
}

async function searchEvents() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - EVENTS_PAST_DAYS)
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + EVENTS_FUTURE_DAYS)
  const events = await loadEventsInRange(from, to)
  // Anstehende Termine zuerst, vergangene danach (jüngste zuerst).
  const ordered = [...events.filter((event) => event.end >= now), ...events.filter((event) => event.end < now).reverse()]
  return ordered.map((event) =>
    toRecord(
      event.id,
      event.subject,
      [
        event.start.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }),
        event.isAllDay ? 'ganztägig' : `${formatTime(event.start)} – ${formatTime(event.end)}`,
        event.location,
      ],
      event.webLink,
      event.categories.map((category) => category.name),
    ),
  )
}

function salesRecords(rows: SalesRow[]) {
  return rows.map((row) => toRecord(row.id, row.title, [row.customer, row.status, row.value !== null ? formatCurrency(row.value) : null], row.url))
}

async function searchContracts() {
  const [contracts, context] = await Promise.all([listActiveContracts(), getContext()])
  const orgUrl = context.app.dataverseOrgUrl
  return contracts.map((contract) =>
    toRecord(
      contract.id,
      contract.customer,
      [contract.number, contract.name !== contract.number ? contract.name : null, contract.contractType, contract.status],
      crmRecordUrl(orgUrl, 'knk_subscription', contract.id),
    ),
  )
}

export const SEARCH_SOURCES: SearchSource[] = [
  { id: 'todos', label: 'Aufgaben', widgetId: 'aktivitaeten', load: searchTodos },
  { id: 'planner', label: 'Mir zugewiesen', widgetId: 'aktivitaeten', load: searchPlannerTasks },
  { id: 'tickets', label: 'Tickets', widgetId: 'tickets', load: searchTickets },
  { id: 'events', label: 'Termine', widgetId: 'kommunikation', load: searchEvents },
  { id: 'opportunities', label: 'Verkaufschancen', widgetId: 'vertriebsvorgaenge', load: async () => salesRecords(await listOwnOpenOpportunities()) },
  { id: 'leads', label: 'Leads', widgetId: 'vertriebsvorgaenge', load: async () => salesRecords(await listOwnOpenLeads()) },
  { id: 'contracts', label: 'Verträge', widgetId: 'vertragsuebersicht', load: searchContracts },
]

const CACHE_MS = 5 * 60_000
const cache = new Map<string, { loadedAt: number; records: Promise<SearchRecord[]> }>()

/** Datensätze einer Quelle; einmal geladen, bleiben sie einige Minuten zwischengespeichert. */
export function loadSearchSource(source: SearchSource): Promise<SearchRecord[]> {
  const cached = cache.get(source.id)
  if (cached && Date.now() - cached.loadedAt < CACHE_MS) return cached.records
  const records = source.load().catch((error: unknown) => {
    cache.delete(source.id)
    throw error
  })
  cache.set(source.id, { loadedAt: Date.now(), records })
  return records
}

export function searchTerms(query: string): string[] {
  return normalize(query).split(/\s+/).filter(Boolean)
}

/** Datensätze, die alle Suchbegriffe enthalten; Treffer im Titel zuerst. */
export function searchRecords(records: SearchRecord[], terms: string[]): SearchRecord[] {
  const matches = records.filter((record) => terms.every((term) => record.text.includes(term)))
  const inTitle = (record: SearchRecord) => terms.every((term) => record.titleText.includes(term))
  return [...matches.filter(inTitle), ...matches.filter((record) => !inTitle(record))]
}
