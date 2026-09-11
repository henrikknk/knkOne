import { JiraService } from '../generated/services/JiraService'
import type { FullIssue } from '../generated/models/JiraModel'
import type { Page } from '../hooks/usePagedList'
import { timelineItem, type TimelineItem } from '../lib/chartData'
import type { Urgency } from '../lib/format'
import { sharedRequest } from '../lib/sharedRequest'
import { runConnector } from './Connector'

// Die Jira-Connection nutzt API-Token-Authentifizierung - jeder Benutzer mit eigener Connection (E-Mail + Token),
// daher löst currentUser() in der JQL immer auf den angemeldeten Benutzer auf.
// Dafür erwartet jede Jira-Aktion die Instanz-URL direkt als X-Request-Jirainstance.
// ListResources taugt hier nicht: das ist ein reiner OAuth-Endpunkt und liefert bei API Token nichts.
export const jiraInstanceUrl = 'https://knkcesupport.atlassian.net'

// Offene Tickets, bei denen ich zugewiesen oder Anfrageteilnehmer bin.
const participantsScope = '(assignee = currentUser() OR "Request participants" = currentUser())'
// „Request participants“ gibt es nur in Jira Service Management - ohne das Feld nur nach Zuweisung suchen.
const assigneeScope = 'assignee = currentUser()'

/** Offene Tickets, optional eingeschränkt auf eine Benutzerbedingung und ein Projekt, neueste Änderung zuerst. */
function openIssuesJql(userScope: string | null, projectKey: string | null) {
  const conditions = [userScope, projectKey ? `project = ${projectKey}` : null, 'statusCategory != Done'].filter(Boolean)
  return `${conditions.join(' AND ')} ORDER BY updated DESC`
}

// fields steht im Connector sonst auf *all - nur anfordern, was die Oberfläche anzeigt.
const issueFields = 'summary,status,assignee,reporter,priority,duedate,created,updated,issuetype,project'

// Jira Service Management: „Waiting for customer“ bzw. „Warten auf Kunden“ - der Kunde ist am Zug.
const CUSTOMER_TURN_STATUS = /kunde|customer/i
const HIGH_PRIORITY = /highest|high|blocker|critical|höchste|hoch|kritisch|dringend/i

export type JiraRole = 'assignee' | 'participant'
export type JiraTurn = 'us' | 'customer'
export type IssueCategory = 'bug' | 'cr' | 'ticket'

const BUG_TYPE = /bug|fehler|defect/i
const CHANGE_REQUEST_TYPE = /change|änderung|(^|[^a-z])cr([^a-z]|$)/i

/** Bug und Change Request anhand des Vorgangstyps; alles andere gilt als Ticket. */
export function issueCategory(typeName: string): IssueCategory {
  if (BUG_TYPE.test(typeName)) return 'bug'
  if (CHANGE_REQUEST_TYPE.test(typeName)) return 'cr'
  return 'ticket'
}

export interface JiraIssueRow {
  key: string
  summary: string
  project: string
  projectKey: string
  type: string
  /** Bug, Ticket oder Change Request, aus dem Vorgangstyp abgeleitet */
  category: IssueCategory
  status: string
  priority: string
  isHighPriority: boolean
  turn: JiraTurn
  /** null, wenn der aktuelle Jira-Benutzer nicht ermittelt werden konnte */
  role: JiraRole | null
  assignee: string
  reporter: string
  dueDate: string | null
  created: string | null
  updated: string | null
  url: string
}

export interface JiraCursor {
  jql: string
  token: string
}

let accountIdPromise: Promise<string | null> | null = null

// GetCurrentUser ist im generierten Service ohne Antworttyp - die Jira-Antwort enthält accountId.
function currentAccountId(): Promise<string | null> {
  if (!accountIdPromise) {
    accountIdPromise = runConnector('Jira: GetCurrentUser', () => JiraService.GetCurrentUser(jiraInstanceUrl))
      .then((data) => {
        const accountId = (data as unknown as { accountId?: unknown } | undefined)?.accountId
        return typeof accountId === 'string' ? accountId : null
      })
      .catch((error: unknown) => {
        console.error('Tickets: aktueller Jira-Benutzer konnte nicht ermittelt werden', error)
        accountIdPromise = null
        return null
      })
  }
  return accountIdPromise
}

function toRow(issue: FullIssue, accountId: string | null): JiraIssueRow {
  const fields = issue.fields ?? {}
  const key = issue.key ?? issue.id ?? ''
  const status = fields.status?.name || 'Unbekannt'
  const priority = fields.priority?.name || '–'
  const assigneeId = fields.assignee?.accountId
  return {
    key,
    summary: fields.summary || 'Ohne Titel',
    project: fields.project?.name || 'Kein Projekt',
    projectKey: fields.project?.key ?? '',
    type: fields.issuetype?.name || 'Ticket',
    category: issueCategory(fields.issuetype?.name ?? ''),
    status,
    priority,
    isHighPriority: HIGH_PRIORITY.test(priority),
    turn: CUSTOMER_TURN_STATUS.test(status) ? 'customer' : 'us',
    role: accountId ? (assigneeId === accountId ? 'assignee' : 'participant') : null,
    assignee: fields.assignee?.displayName || 'Nicht zugewiesen',
    reporter: fields.reporter?.displayName || '',
    dueDate: fields.duedate ?? null,
    created: fields.created ?? null,
    updated: fields.updated ?? null,
    url: key ? `${jiraInstanceUrl}/browse/${key}` : '',
  }
}

function fetchIssues(jql: string, token?: string, fields = issueFields) {
  return runConnector('Jira: ListIssues', () => JiraService.ListIssues(jiraInstanceUrl, jql, undefined, fields, token))
}

/**
 * Offene Tickets stapelweise über nextPageToken - alle oder nur die, bei denen ich zugewiesen oder Anfrageteilnehmer bin.
 * Die Rolle (zugewiesen/Anfrageteilnehmer) lässt sich nur für die eigenen Tickets bestimmen.
 */
async function loadIssuesPage(projectKey: string | null, mineOnly: boolean, cursor: JiraCursor | undefined): Promise<Page<JiraIssueRow, JiraCursor>> {
  const accountIdRequest = mineOnly ? currentAccountId() : Promise.resolve(null)
  let jql = cursor?.jql ?? openIssuesJql(mineOnly ? participantsScope : null, projectKey)
  let response
  try {
    response = await fetchIssues(jql, cursor?.token)
  } catch (error) {
    if (cursor || !mineOnly) throw error
    console.warn('Tickets: Abfrage mit Anfrageteilnehmern fehlgeschlagen, nur zugewiesene Tickets werden geladen', error)
    jql = openIssuesJql(assigneeScope, projectKey)
    response = await fetchIssues(jql)
  }
  const accountId = await accountIdRequest
  const items = (response?.issues ?? []).map((issue) => toRow(issue, accountId))
  const token = response?.nextPageToken && response.isLast !== true ? response.nextPageToken : undefined
  return { items, next: token ? { jql, token } : undefined }
}

/** Offene Tickets, bei denen ich zugewiesen oder Anfrageteilnehmer bin - stapelweise über nextPageToken. */
export function loadMyIssuesPage(cursor: JiraCursor | undefined): Promise<Page<JiraIssueRow, JiraCursor>> {
  return loadIssuesPage(null, true, cursor)
}

/** Kritisch nur, wenn wir am Zug sind: hohe Priorität oder überschrittene Fälligkeit. */
export function issueUrgency(issue: Pick<JiraIssueRow, 'turn' | 'isHighPriority'>, dueInDays: number | null): Urgency {
  if (issue.turn === 'customer') return 'muted'
  if (issue.isHighPriority || (dueInDays !== null && dueInDays < 0)) return 'critical'
  if (dueInDays !== null && dueInDays <= 3) return 'warning'
  return 'normal'
}

export interface JiraProject {
  key: string
  name: string
}

// Der Connector liefert die Projekte laut seinen eigenen Dynamic-Values unter „value“, das generierte Modell
// behauptet „values“ - daher jede bekannte Form annehmen.
function projectEntries(response: unknown): unknown[] {
  if (Array.isArray(response)) return response
  const body = (response ?? {}) as { value?: unknown; values?: unknown }
  if (Array.isArray(body.value)) return body.value
  if (Array.isArray(body.values)) return body.values
  return []
}

// Projekte ändern sich selten - die Liste gilt zehn Minuten.
const jiraProjects = sharedRequest(async (): Promise<JiraProject[]> => {
  const response = await runConnector('Jira: ListProjects_V3', () => JiraService.ListProjects_V3(jiraInstanceUrl))
  const projects = projectEntries(response).flatMap((entry) => {
    const project = entry as { key?: unknown; name?: unknown }
    if (typeof project.key !== 'string' || project.key === '') return []
    return [{ key: project.key, name: typeof project.name === 'string' && project.name !== '' ? project.name : project.key }]
  })
  if (projects.length === 0) console.warn('Jira: Projektliste leer oder in unbekanntem Format', response)
  return projects.sort((a, b) => a.name.localeCompare(b.name, 'de'))
}, 10 * 60_000)

/** Jira-Projekte, in Jira Cloud als „Bereiche“ bezeichnet - alphabetisch. */
export function listJiraProjects(): Promise<JiraProject[]> {
  return jiraProjects()
}

const PROJECT_KEY = /^[A-Za-z][A-Za-z0-9_]*$/

export interface OpenIssuesFilter {
  /** Bereich (Jira-Projekt), null = alle Bereiche */
  projectKey: string | null
  /** Nur Tickets, bei denen ich zugewiesen oder Anfrageteilnehmer bin */
  mineOnly: boolean
}

/** Offene Tickets eines oder aller Bereiche, wahlweise nur die eigenen - stapelweise. */
export function loadOpenIssuesPage(filter: OpenIssuesFilter, cursor: JiraCursor | undefined): Promise<Page<JiraIssueRow, JiraCursor>> {
  // Nur gültige Projektschlüssel gelangen in die JQL.
  if (filter.projectKey && !PROJECT_KEY.test(filter.projectKey)) {
    return Promise.reject(new Error(`Ungültiger Projektschlüssel „${filter.projectKey}“`))
  }
  return loadIssuesPage(filter.projectKey, filter.mineOnly, cursor)
}

/** Alle offenen Tickets aus bis zu `maxPages` Seiten - für Suche und Diagramm. */
export async function listAllMyIssues(maxPages = 10): Promise<JiraIssueRow[]> {
  const issues: JiraIssueRow[] = []
  let cursor: JiraCursor | undefined
  for (let page = 0; page < maxPages; page++) {
    const result = await loadMyIssuesPage(cursor)
    issues.push(...result.items)
    cursor = result.next
    if (!cursor) break
  }
  return issues
}

const timelineFields = 'created,resolutiondate,updated,status,statuscategorychangedate'
const MAX_TIMELINE_PAGES = 20

// Offene Tickets plus alle, die seit `since` erledigt wurden - ältere erledigte zählen im Zeitraum nicht mehr.
function timelineJql(scope: string, since: Date) {
  const days = Math.max(1, Math.ceil((Date.now() - since.getTime()) / 86_400_000))
  return `${scope} AND (statusCategory != Done OR statusCategoryChangedDate >= -${days}d)`
}

/** Eigene Tickets mit Anlage- und Erledigungszeitpunkt, soweit sie seit `since` offen waren - für den Auslastungsverlauf. */
export async function listMyIssueTimeline(since: Date): Promise<TimelineItem[]> {
  const items: TimelineItem[] = []
  let jql = timelineJql(participantsScope, since)
  let token: string | undefined
  for (let page = 0; page < MAX_TIMELINE_PAGES; page++) {
    let response
    try {
      response = await fetchIssues(jql, token, timelineFields)
    } catch (error) {
      if (page > 0) throw error
      jql = timelineJql(assigneeScope, since)
      response = await fetchIssues(jql, undefined, timelineFields)
    }
    for (const issue of response?.issues ?? []) {
      const fields = issue.fields ?? {}
      const done = fields.status?.statusCategory?.key === 'done'
      // Nicht jeder Workflow setzt eine Lösung - dann gilt der Wechsel in die Kategorie „Erledigt“.
      const categoryChanged = (fields as { statuscategorychangedate?: string }).statuscategorychangedate
      items.push(...timelineItem(fields.created, done ? (fields.resolutiondate ?? categoryChanged ?? fields.updated) : null))
    }
    token = response?.nextPageToken && response.isLast !== true ? response.nextPageToken : undefined
    if (!token) break
  }
  return items
}
