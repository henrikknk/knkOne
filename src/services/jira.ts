import { JiraService } from '../generated/services/JiraService'
import type { FullIssue } from '../generated/models/JiraModel'
import type { Page } from '../hooks/usePagedList'
import { runConnector } from './Connector'

// Die Jira-Connection nutzt API-Token-Authentifizierung - jeder Benutzer mit eigener Connection (E-Mail + Token),
// daher löst currentUser() in der JQL immer auf den angemeldeten Benutzer auf.
// Dafür erwartet jede Jira-Aktion die Instanz-URL direkt als X-Request-Jirainstance.
// ListResources taugt hier nicht: das ist ein reiner OAuth-Endpunkt und liefert bei API Token nichts.
export const jiraInstanceUrl = 'https://knkcesupport.atlassian.net'

// Offene Tickets, bei denen ich zugewiesen oder Anfrageteilnehmer bin.
const participantsJql =
  '(assignee = currentUser() OR "Request participants" = currentUser()) AND statusCategory != Done ORDER BY updated DESC'
// „Request participants“ gibt es nur in Jira Service Management - ohne das Feld nur nach Zuweisung suchen.
const assigneeOnlyJql = 'assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC'

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

function fetchIssues(jql: string, token?: string) {
  return runConnector('Jira: ListIssues', () => JiraService.ListIssues(jiraInstanceUrl, jql, undefined, issueFields, token))
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
