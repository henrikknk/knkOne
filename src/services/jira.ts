import { JiraService } from '../generated/services/JiraService'
import type { FullIssue } from '../generated/models/JiraModel'
import type { Page } from '../hooks/usePagedList'
import { timelineItem, type TimelineItem } from '../lib/chartData'
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
const participantsJql = `${participantsScope} AND statusCategory != Done ORDER BY updated DESC`
const assigneeOnlyJql = `${assigneeScope} AND statusCategory != Done ORDER BY updated DESC`

// fields steht im Connector sonst auf *all - nur anfordern, was die Oberfläche anzeigt.
const issueFields = 'summary,status,assignee,priority,duedate,updated,issuetype,project'

// Jira Service Management: „Waiting for customer“ bzw. „Warten auf Kunden“ - der Kunde ist am Zug.
const CUSTOMER_TURN_STATUS = /kunde|customer/i
const HIGH_PRIORITY = /highest|high|blocker|critical|höchste|hoch|kritisch|dringend/i

export type JiraRole = 'assignee' | 'participant'
export type JiraTurn = 'us' | 'customer'

export interface JiraIssueRow {
  key: string
  summary: string
  project: string
  type: string
  status: string
  priority: string
  isHighPriority: boolean
  turn: JiraTurn
  /** null, wenn der aktuelle Jira-Benutzer nicht ermittelt werden konnte */
  role: JiraRole | null
  assignee: string
  dueDate: string | null
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
    type: fields.issuetype?.name || 'Ticket',
    status,
    priority,
    isHighPriority: HIGH_PRIORITY.test(priority),
    turn: CUSTOMER_TURN_STATUS.test(status) ? 'customer' : 'us',
    role: accountId ? (assigneeId === accountId ? 'assignee' : 'participant') : null,
    assignee: fields.assignee?.displayName || 'Nicht zugewiesen',
    dueDate: fields.duedate ?? null,
    updated: fields.updated ?? null,
    url: key ? `${jiraInstanceUrl}/browse/${key}` : '',
  }
}

function fetchIssues(jql: string, token?: string, fields = issueFields) {
  return runConnector('Jira: ListIssues', () => JiraService.ListIssues(jiraInstanceUrl, jql, undefined, fields, token))
}

/** Offene Tickets, bei denen ich zugewiesen oder Anfrageteilnehmer bin - stapelweise über nextPageToken. */
export async function loadMyIssuesPage(cursor: JiraCursor | undefined): Promise<Page<JiraIssueRow, JiraCursor>> {
  const accountIdRequest = currentAccountId()
  let jql = cursor?.jql ?? participantsJql
  let response
  try {
    response = await fetchIssues(jql, cursor?.token)
  } catch (error) {
    if (cursor) throw error
    console.warn('Tickets: Abfrage mit Anfrageteilnehmern fehlgeschlagen, nur zugewiesene Tickets werden geladen', error)
    jql = assigneeOnlyJql
    response = await fetchIssues(jql)
  }
  const accountId = await accountIdRequest
  const items = (response?.issues ?? []).map((issue) => toRow(issue, accountId))
  const token = response?.nextPageToken && response.isLast !== true ? response.nextPageToken : undefined
  return { items, next: token ? { jql, token } : undefined }
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
