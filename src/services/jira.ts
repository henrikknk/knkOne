import { JiraService } from '../generated/services/JiraService'
import type { FullIssue } from '../generated/models/JiraModel'
import type { Page } from '../hooks/usePagedList'
import { timelineItem, type TimelineItem } from '../lib/chartData'
import { delay } from '../lib/delay'
import type { Urgency } from '../lib/format'
import { sharedRequest } from '../lib/sharedRequest'
import { runConnector } from './Connector'
import { mayHaveUpdates } from './ticketReads'

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

/**
 * Woher die Kommentare kommen. Der Connector hat keine Leseoperation für Kommentare (nur AddComment),
 * daher bleiben zwei Wege:
 *
 *   'inline' - „comment“ an die Feldliste von ListIssues hängen. Kostet keine zusätzlichen Aufrufe.
 *              ListIssues zeigt aber auf Jiras neue Enhanced-Search-API, die das Feld möglicherweise
 *              nicht mitliefert. Beides wird zur Laufzeit erkannt (siehe noteInlineSupport).
 *   'fetch'  - je Ticket GetIssue_V2 nachladen, vorgefiltert über „updated“. Zuverlässig, aber teurer.
 *   'off'    - Kommentarhinweise vollständig abschalten.
 *
 * Meldet die Konsole „liefert das Feld comment nicht mit“, hier auf 'fetch' umstellen.
 */
const COMMENT_SOURCE: 'inline' | 'fetch' | 'off' = 'inline'

/**
 * VORÜBERGEHEND ZUM TESTEN: zählt auch selbst geschriebene Kommentare als neu, damit sich das Widget
 * ohne fremde Hilfe prüfen lässt. Sobald das Feature bestätigt ist, auf false setzen - dann bedeutet
 * die Markierung wieder verlässlich: hier hat jemand anderes etwas hinterlassen.
 */
const COUNT_OWN_COMMENTS = true

// Wird zur Laufzeit abgeschaltet, sobald feststeht, dass der Suchendpunkt keine Kommentare mitliefert.
let inlineComments = COMMENT_SOURCE === 'inline'
let inlineSupportChecked = false

function searchFields() {
  return inlineComments ? `${issueFields},comment` : issueFields
}

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
  /**
   * Jüngster Kommentar einer anderen Person.
   * undefined = Kommentardaten nicht verfügbar (Hinweise bleiben still aus), null = keiner vorhanden.
   */
  lastComment?: JiraComment | null
}

export type CommentVisibility = 'internal' | 'external'

export interface JiraComment {
  id: string
  author: string
  /** null, wenn Jira keinen Autor liefert (z. B. gelöschter Benutzer) */
  authorAccountId: string | null
  /** Zeitstempel wie von Jira geliefert, nur zur Anzeige */
  created: string
  /** Epoch-Millisekunden - nur damit wird verglichen, siehe Hinweis an latestForeignComment */
  createdMs: number
  visibility: CommentVisibility
  /** Reiner Text des Kommentars, auf MAX_COMMENT_TEXT gekürzt; leer, wenn Jira keinen Inhalt liefert. */
  body: string
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

// Kommentare kennt das generierte Modell nicht - der Connector reicht die Jira-Antwort aber unverändert
// durch, daher der eigene Rohtyp (wie bei statuscategorychangedate in listMyIssueTimeline).
interface RawComment {
  id?: string
  author?: { accountId?: string; displayName?: string }
  created?: string
  /** Nur in Jira Service Management: false = interne Notiz, true = für den Kunden sichtbar. */
  jsdPublic?: boolean
  /** Zeichenkette in der Jira-API v2, ADF-Dokument in v3 - commentText() beherrscht beides. */
  body?: unknown
}

/** Obergrenze gegen ausufernde Kommentare; der aufgeklappte Bereich scrollt, der Rest steht in Jira. */
const MAX_COMMENT_TEXT = 2000

// ADF-Knoten, nach denen ein Zeilenumbruch gehört, damit Absätze nicht aneinanderkleben.
const ADF_BLOCKS = new Set(['paragraph', 'heading', 'listItem', 'blockquote', 'codeBlock', 'tableRow'])

/** Leerraum vereinheitlichen, aber Absätze erhalten - .row-description rendert mit pre-wrap. */
function tidy(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_COMMENT_TEXT)
}

/**
 * Reiner Text eines Kommentars. Die Jira-API v2 liefert `body` als Zeichenkette (Wiki-Markup), v3 als
 * ADF-Dokument aus verschachtelten Knoten. Welche Variante der Connector zurückgibt, ist nicht zugesichert -
 * deshalb beide Formen behandeln statt auf eine zu wetten.
 */
function commentText(body: unknown): string {
  if (typeof body === 'string') return tidy(body)
  const parts: string[] = []
  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }
    if (!node || typeof node !== 'object') return
    const entry = node as { type?: string; text?: string; content?: unknown; attrs?: { text?: string } }
    // Erwähnungen und Emoji tragen ihren Text in attrs statt als Textknoten.
    if (typeof entry.text === 'string') parts.push(entry.text)
    else if (typeof entry.attrs?.text === 'string') parts.push(entry.attrs.text)
    if (entry.type === 'hardBreak') parts.push('\n')
    if (entry.content) walk(entry.content)
    if (entry.type && ADF_BLOCKS.has(entry.type)) parts.push('\n')
  }
  walk((body as { content?: unknown } | null)?.content)
  return tidy(parts.join(''))
}

/**
 * Jüngster Kommentar - regulär nur von anderen Personen; solange COUNT_OWN_COMMENTS gesetzt ist, auch eigene.
 * Rückgabe: undefined = keine Kommentardaten vorhanden, null = kein passender Kommentar vorhanden.
 *
 * Jira liefert Zeitstempel als „2026-09-14T08:12:33.000+0200“ - der Offset hat keinen Doppelpunkt,
 * ein lexikalischer Vergleich wäre also falsch. Deshalb durchgängig Date.parse und Epoch-Millisekunden.
 *
 * Bei fields=comment liefert Jira nur das letzte Fenster der Kommentare, nicht alle. Für die Frage
 * „gibt es etwas Neues?“ genügt das; bestehen die letzten Kommentare ausschließlich aus eigenen,
 * bleibt ein älterer fremder unbemerkt.
 */
function latestForeignComment(fields: unknown, meId: string | null): JiraComment | null | undefined {
  const raw = (fields as { comment?: { comments?: RawComment[] } } | undefined)?.comment
  if (!raw || !Array.isArray(raw.comments)) return undefined
  // Ohne eigene accountId ließen sich eigene Kommentare nicht aussortieren - dann lieber nichts anzeigen
  // (entfällt, solange COUNT_OWN_COMMENTS eigene Kommentare ohnehin mitzählt).
  if (meId === null && !COUNT_OWN_COMMENTS) return undefined
  let newest: JiraComment | null = null
  for (const entry of raw.comments) {
    const accountId = entry.author?.accountId ?? null
    if (!COUNT_OWN_COMMENTS && accountId && accountId === meId) continue
    const createdMs = Date.parse(entry.created ?? '')
    if (!Number.isFinite(createdMs)) continue
    if (newest && createdMs <= newest.createdMs) continue
    newest = {
      id: entry.id ?? '',
      author: entry.author?.displayName || 'Unbekannt',
      authorAccountId: accountId,
      created: entry.created ?? '',
      createdMs,
      // jsdPublic gibt es nur in Jira Service Management - fehlt es, gilt der Kommentar als extern.
      visibility: entry.jsdPublic === false ? 'internal' : 'external',
      body: commentText(entry.body),
    }
  }
  return newest
}

/**
 * `roleAccountId` steuert die Rollenanzeige (nur bei den eigenen Tickets gesetzt), `meId` das Aussortieren
 * eigener Kommentare. Beides getrennt zu halten verhindert, dass in der Ansicht „Alle Tickets“ plötzlich
 * „Zugewiesen“/„Anfrageteilnehmer“ auftaucht.
 */
function toRow(issue: FullIssue, accountId: string | null, meId: string | null): JiraIssueRow {
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
    lastComment: latestForeignComment(fields, meId),
  }
}

function fetchIssues(jql: string, token?: string, fields = searchFields()) {
  return runConnector('Jira: ListIssues', () => JiraService.ListIssues(jiraInstanceUrl, jql, undefined, fields, token))
}

/**
 * Prüft einmalig, ob der Suchendpunkt das angeforderte Feld „comment“ tatsächlich mitliefert. Er darf es
 * auch stillschweigend ignorieren - dann wäre jede weitere Anfrage mit „comment“ verschwendet.
 * Das ersetzt eine manuelle Messung: die Konsole sagt, ob COMMENT_SOURCE auf 'fetch' gehört.
 */
function noteInlineSupport(issues: FullIssue[]) {
  if (!inlineComments || inlineSupportChecked || issues.length === 0) return
  inlineSupportChecked = true
  if (issues.some((issue) => (issue.fields as { comment?: unknown } | undefined)?.comment !== undefined)) return
  inlineComments = false
  console.warn(
    'Tickets: Der Suchendpunkt liefert das Feld „comment“ nicht mit. Für Kommentarhinweise COMMENT_SOURCE in src/services/jira.ts auf \'fetch\' setzen.',
  )
}

/**
 * Offene Tickets stapelweise über nextPageToken - alle oder nur die, bei denen ich zugewiesen oder Anfrageteilnehmer bin.
 * Die Rolle (zugewiesen/Anfrageteilnehmer) lässt sich nur für die eigenen Tickets bestimmen.
 */
async function loadIssuesPage(projectKey: string | null, mineOnly: boolean, cursor: JiraCursor | undefined): Promise<Page<JiraIssueRow, JiraCursor>> {
  const meRequest = currentAccountId()
  const baseJql = cursor?.jql ?? openIssuesJql(mineOnly ? participantsScope : null, projectKey)
  // Die JQL darf nur auf der ersten Seite gewechselt werden - ein Cursor gehört untrennbar zu seiner Abfrage.
  const assigneeJql = !cursor && mineOnly ? openIssuesJql(assigneeScope, projectKey) : null

  // Zwei unabhängige Gründe können die Abfrage kippen: der Suchendpunkt kennt das Feld „comment“ nicht,
  // oder „Request participants“ fehlt (das gibt es nur in Jira Service Management). Deshalb der Reihe nach
  // erst den kleineren Verlust opfern - die Kommentarhinweise - und erst danach die Anfrageteilnehmer.
  // Welcher Versuch trägt, verrät zugleich, woran es lag.
  const attempts: Array<{ jql: string; withComments: boolean }> = [{ jql: baseJql, withComments: inlineComments }]
  if (inlineComments) attempts.push({ jql: baseJql, withComments: false })
  if (assigneeJql) {
    if (inlineComments) attempts.push({ jql: assigneeJql, withComments: true })
    attempts.push({ jql: assigneeJql, withComments: false })
  }

  let response: Awaited<ReturnType<typeof fetchIssues>> | undefined
  let jql = baseJql
  let lastError: unknown
  // Eigenes Kennzeichen statt einer Prüfung auf `response`: eine erfolgreiche, aber leere Antwort ist kein Fehler.
  let loaded = false
  for (const attempt of attempts) {
    try {
      const fields = attempt.withComments ? `${issueFields},comment` : issueFields
      response = await fetchIssues(attempt.jql, attempt.jql === baseJql ? cursor?.token : undefined, fields)
      loaded = true
      jql = attempt.jql
      if (inlineComments && !attempt.withComments) {
        // Ohne das Feld ging dieselbe Abfrage durch - der Suchendpunkt nimmt „comment“ also nicht an.
        inlineComments = false
        inlineSupportChecked = true
        console.warn('Tickets: Suchendpunkt akzeptiert das Feld „comment“ nicht - Kommentarhinweise werden deaktiviert', lastError)
      }
      if (attempt.jql === assigneeJql) {
        console.warn('Tickets: Abfrage mit Anfrageteilnehmern fehlgeschlagen, nur zugewiesene Tickets werden geladen', lastError)
      }
      break
    } catch (error) {
      lastError = error
    }
  }
  if (!loaded) throw lastError

  const issues = response?.issues ?? []
  noteInlineSupport(issues)
  const meId = await meRequest
  // Die Rolle lässt sich nur für die eigenen Tickets bestimmen - sonst bliebe sie ohnehin „participant“.
  const items = issues.map((issue) => toRow(issue, mineOnly ? meId : null, meId))
  const token = response?.nextPageToken && response.isLast !== true ? response.nextPageToken : undefined
  return { items, next: token ? { jql, token } : undefined }
}

const MAX_COMMENT_LOOKUPS = 10
const COMMENT_LOOKUP_DELAY_MS = 150
// Nach Drosselung oder fehlender Berechtigung lohnt in dieser Sitzung kein weiterer Einzelabruf.
let commentLookupsDisabled = false

function isThrottledOrDenied(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /\b(401|403|429)\b|too many requests|rate limit|unauthorized/i.test(message)
}

/**
 * Ergänzt den jüngsten Kommentar. Bei 'inline' ein No-Op - die Daten kamen schon mit der Suche.
 *
 * Bei 'fetch' kostet jedes Ticket einen eigenen Aufruf. Weil der jüngste Kommentar an jedem Ticket
 * angezeigt wird und nicht nur an ungelesenen, lässt sich das nicht mehr über „seit dem letzten Lesen
 * geändert“ vorfiltern - MAX_COMMENT_LOOKUPS deckelt den Aufwand stattdessen pro Seite. Tickets jenseits
 * des Budgets bleiben ohne Kommentarzeile.
 *
 * Fehler bleiben folgenlos: betroffene Zeilen erscheinen ohne Kommentarhinweis, die Liste selbst nie leer.
 */
export async function withLatestComments(rows: JiraIssueRow[]): Promise<JiraIssueRow[]> {
  if (COMMENT_SOURCE !== 'fetch' || commentLookupsDisabled || rows.length === 0) return rows
  const meId = await currentAccountId()
  if (meId === null && !COUNT_OWN_COMMENTS) return rows

  // Der jüngste Kommentar wird inzwischen an jedem Ticket angezeigt, nicht nur an ungelesenen - es kommen
  // also grundsätzlich alle in Frage. Geänderte zuerst, damit bei knappem Budget wenigstens die Erkennung
  // ungelesener Kommentare stimmt; der Rest füllt auf, soweit MAX_COMMENT_LOOKUPS reicht.
  const keyed = rows.filter((row) => row.key)
  const changed = keyed.filter((row) => mayHaveUpdates(row.key, row.updated))
  const unchanged = keyed.filter((row) => !mayHaveUpdates(row.key, row.updated))
  const candidates = [...changed, ...unchanged].slice(0, MAX_COMMENT_LOOKUPS)
  if (candidates.length === 0) return rows

  const found = new Map<string, JiraComment | null>()
  for (const [index, row] of candidates.entries()) {
    // Nacheinander mit kleinem Puffer, damit eine Seite den Connector nicht mit Parallelaufrufen überfährt.
    if (index > 0) await delay(COMMENT_LOOKUP_DELAY_MS)
    try {
      const issue = await runConnector('Jira: GetIssue_V2', () => JiraService.GetIssue_V2(jiraInstanceUrl, row.key))
      found.set(row.key, latestForeignComment((issue as FullIssue | undefined)?.fields, meId) ?? null)
    } catch (error) {
      if (isThrottledOrDenied(error)) {
        commentLookupsDisabled = true
        console.warn('Tickets: Kommentare werden in dieser Sitzung nicht mehr einzeln nachgeladen', error)
        break
      }
      console.warn(`Tickets: Kommentare zu ${row.key} konnten nicht geladen werden`, error)
    }
  }
  if (found.size === 0) return rows
  return rows.map((row) => (found.has(row.key) ? { ...row, lastComment: found.get(row.key) } : row))
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

// ---------------------------------------------------------------------------------------------------
// TEMPORÄRE DIAGNOSE - nach der Fehlersuche diesen Block wieder entfernen.
// Aufruf in der Browser-Konsole:  await __jiraDebug('KNK-1234')
// ---------------------------------------------------------------------------------------------------
function debugComments(label: string, fields: unknown, meId: string | null) {
  const raw = (fields as { comment?: { comments?: RawComment[]; total?: number } } | undefined)?.comment
  if (raw === undefined) {
    console.warn(`${label}: Feld „comment“ fehlt in der Antwort - der Endpunkt liefert keine Kommentare.`)
    return
  }
  const comments = raw.comments ?? []
  console.log(`${label}: ${comments.length} Kommentar(e) geliefert, laut Jira insgesamt ${raw.total ?? '?'}`)
  console.table(
    comments.map((entry) => ({
      autor: entry.author?.displayName ?? '?',
      accountId: entry.author?.accountId ?? '(keine)',
      istMeiner: entry.author?.accountId === meId ? (COUNT_OWN_COMMENTS ? 'JA - zählt trotzdem (Testmodus)' : 'JA - wird ausgefiltert') : 'nein',
      jsdPublic: entry.jsdPublic === undefined ? '(fehlt -> gilt als extern)' : String(entry.jsdPublic),
      sichtbarkeit: entry.jsdPublic === false ? 'intern' : 'extern',
      erstellt: entry.created ?? '?',
      bodyTyp: entry.body === undefined ? '(fehlt)' : typeof entry.body === 'string' ? 'Zeichenkette (v2)' : 'ADF-Objekt (v3)',
      text: commentText(entry.body).slice(0, 80) || '(leer)',
    })),
  )
  console.log(`${label}: daraus abgeleitet ->`, latestForeignComment(fields, meId))
}

;(window as unknown as Record<string, unknown>).__jiraDebug = async (issueKey: string) => {
  const meId = await currentAccountId()
  console.log('Eigene accountId:', meId ?? '(nicht ermittelbar - Kommentarhinweise bleiben dann aus)')
  console.log('COMMENT_SOURCE:', COMMENT_SOURCE, '| inlineComments zur Laufzeit:', inlineComments)

  const stored = localStorage.getItem('knkone.jira.commentReads.v1')
  const baseline = stored ? (JSON.parse(stored) as { baseline?: number }).baseline : undefined
  console.log('Grundlinie („alles davor gilt als gesehen“):', baseline ? new Date(baseline).toLocaleString('de-DE') : '(keine)')

  try {
    const list = await runConnector('debug ListIssues', () =>
      JiraService.ListIssues(jiraInstanceUrl, `key = ${issueKey}`, undefined, `${issueFields},comment`, undefined),
    )
    const fields = list?.issues?.[0]?.fields
    console.log('A) ListIssues - gelieferte Felder:', Object.keys(fields ?? {}))
    debugComments('A) ListIssues', fields, meId)
  } catch (error) {
    console.warn('A) ListIssues mit „comment“ fehlgeschlagen:', error)
  }

  try {
    const single = await runConnector('debug GetIssue_V2', () => JiraService.GetIssue_V2(jiraInstanceUrl, issueKey))
    const fields = (single as FullIssue | undefined)?.fields
    console.log('B) GetIssue_V2 - gelieferte Felder:', Object.keys(fields ?? {}))
    debugComments('B) GetIssue_V2', fields, meId)
  } catch (error) {
    console.warn('B) GetIssue_V2 fehlgeschlagen:', error)
  }
}
