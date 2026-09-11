import { useCallback, useId, useState } from 'react'
import { PagedRows, Pill, Row, WidgetFrame } from '../components/Widget'
import type { WidgetProps } from '../components/widgetTypes'
import { useAsyncData } from '../hooks/useAsyncData'
import { usePagedList, type PageLoader } from '../hooks/usePagedList'
import { daysBetween, relativeDays, toCalendarDate } from '../lib/format'
import { issueUrgency, listJiraProjects, loadOpenIssuesPage, type IssueCategory, type JiraCursor, type JiraIssueRow } from '../services/jira'

const PROJECT_STORAGE_KEY = 'knkone.kundentickets.project'
const SCOPE_STORAGE_KEY = 'knkone.kundentickets.scope'

type TicketScope = 'all' | 'mine'

interface CustomerIssue extends JiraIssueRow {
  /** Tage bis zur Fälligkeit bzw. seit der letzten Änderung, zum Ladezeitpunkt berechnet */
  dueInDays: number | null
  updatedDaysAgo: number | null
}

function loadStored(key: string): string {
  try {
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore storage errors (e.g. private browsing quota)
  }
}

const CATEGORY_LABELS: Record<IssueCategory, string> = { bug: 'Bug', ticket: 'Ticket', cr: 'CR' }

function CategoryIcon({ category }: { category: IssueCategory }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {category === 'bug' ? (
        <>
          <path d="M8 9a4 4 0 0 1 8 0v5a4 4 0 0 1-8 0Z" />
          <path d="M12 9v9M4 13h4M16 13h4M5 7l3 2M19 7l-3 2M5 20l3-2M19 20l-3-2" />
        </>
      ) : category === 'cr' ? (
        <path d="M4 8h14l-3-3M20 16H6l3 3" />
      ) : (
        <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" />
      )}
    </svg>
  )
}

/** Vorgangsart mit Symbol und Text - die Farbe ist nie das einzige Unterscheidungsmerkmal. */
function IssueTypeBadge({ issue }: { issue: JiraIssueRow }) {
  return (
    <span className={`issue-type issue-type--${issue.category}`} title={`Vorgangstyp: ${issue.type}`}>
      <CategoryIcon category={issue.category} />
      {CATEGORY_LABELS[issue.category]}
    </span>
  )
}

function IssueRow({ issue, showProject }: { issue: CustomerIssue; showProject: boolean }) {
  return (
    <Row
      urgency={issueUrgency(issue, issue.dueInDays)}
      title={issue.summary}
      href={issue.url}
      meta={[issue.key, showProject ? issue.project : null, issue.status, issue.assignee].filter(Boolean).join(' · ')}
      tags={
        <>
          <IssueTypeBadge issue={issue} />
          {issue.turn === 'us' ? <Pill tone="warning">Wir am Zug</Pill> : <Pill tone="neutral">Kunde am Zug</Pill>}
          {issue.role === 'assignee' && <Pill tone="info">Zugewiesen</Pill>}
          {issue.role === 'participant' && <Pill tone="neutral">Anfrageteilnehmer</Pill>}
          {issue.isHighPriority && <Pill tone="critical">{issue.priority}</Pill>}
        </>
      }
      aside={
        issue.dueInDays !== null ? (
          <Pill tone={issue.dueInDays < 0 ? 'critical' : issue.dueInDays <= 3 ? 'warning' : 'neutral'}>
            {issue.dueInDays < 0 ? 'überfällig' : `fällig ${relativeDays(issue.dueInDays)}`}
          </Pill>
        ) : issue.updatedDaysAgo !== null ? (
          <span className="issue-updated">aktualisiert {relativeDays(-issue.updatedDaysAgo)}</span>
        ) : undefined
      }
    />
  )
}

function emptyText(projectKey: string, mineOnly: boolean) {
  const area = projectKey ? ' in diesem Bereich' : ''
  return mineOnly ? `Keine offenen Tickets${area}, bei denen du zugewiesen oder Anfrageteilnehmer bist` : `Keine offenen Tickets${area}`
}

function CustomerIssueList({ projectKey, mineOnly }: { projectKey: string; mineOnly: boolean }) {
  const loader = useCallback<PageLoader<CustomerIssue, JiraCursor>>(
    async (cursor) => {
      const page = await loadOpenIssuesPage({ projectKey: projectKey || null, mineOnly }, cursor)
      const today = new Date()
      return {
        ...page,
        items: page.items.map((issue) => {
          const due = toCalendarDate(issue.dueDate)
          const updated = toCalendarDate(issue.updated)
          return { ...issue, dueInDays: due ? daysBetween(today, due) : null, updatedDaysAgo: updated ? daysBetween(updated, today) : null }
        }),
      }
    },
    [projectKey, mineOnly],
  )
  const list = usePagedList(loader)

  return (
    <PagedRows
      list={list}
      empty={emptyText(projectKey, mineOnly)}
      renderItem={(issue) => <IssueRow key={issue.key} issue={issue} showProject={!projectKey} />}
    />
  )
}

// Live-Widget für das Consulting-Team: offene Jira-Tickets eines Bereichs (so heißen Projekte in Jira Cloud) -
// alle oder nur die eigenen; Bugs, Tickets und Change Requests sind unterscheidbar.
export default function KundenticketsWidget(props: WidgetProps) {
  const [projectKey, setProjectKey] = useState(() => loadStored(PROJECT_STORAGE_KEY))
  // Standard: nur die eigenen Tickets; „Alle Tickets“ gilt nur, wenn es bewusst gewählt wurde.
  const [scope, setScope] = useState<TicketScope>(() => (loadStored(SCOPE_STORAGE_KEY) === 'all' ? 'all' : 'mine'))
  const projects = useAsyncData(listJiraProjects)
  const projectSelectId = useId()
  const scopeSelectId = useId()

  const options = projects.status === 'ready' ? projects.data : []
  const hasOption = options.some((project) => project.key === projectKey)

  function selectProject(key: string) {
    setProjectKey(key)
    store(PROJECT_STORAGE_KEY, key)
  }

  function selectScope(next: TicketScope) {
    setScope(next)
    store(SCOPE_STORAGE_KEY, next)
  }

  return (
    <WidgetFrame
      {...props}
      toolbar={
        <div className="issue-toolbar">
          <span className="issue-filter">
            <label className="issue-filter-label" htmlFor={projectSelectId}>
              Bereich
            </label>
            <select id={projectSelectId} className="select" value={projectKey} onChange={(event) => selectProject(event.target.value)}>
              <option value="">Alle Bereiche</option>
              {options.map((project) => (
                <option key={project.key} value={project.key}>
                  {project.name} ({project.key})
                </option>
              ))}
              {/* Gespeicherte Auswahl bleibt wählbar, auch solange die Liste lädt oder das Projekt fehlt */}
              {projectKey && !hasOption && <option value={projectKey}>{projectKey}</option>}
            </select>
          </span>
          <span className="issue-filter">
            <label className="issue-filter-label" htmlFor={scopeSelectId}>
              Tickets
            </label>
            <select id={scopeSelectId} className="select" value={scope} onChange={(event) => selectScope(event.target.value === 'mine' ? 'mine' : 'all')}>
              <option value="all">Alle Tickets</option>
              <option value="mine">Zugewiesen oder Anfrageteilnehmer</option>
            </select>
          </span>
          {projects.status === 'loading' && <span className="issue-filter-hint">Bereiche werden geladen …</span>}
          {projects.status === 'ready' && options.length === 0 && <span className="issue-filter-hint">Keine Bereiche gefunden</span>}
          {projects.status === 'error' && (
            <span className="issue-filter-hint">
              Bereiche nicht verfügbar
              <button type="button" className="btn btn--ghost btn--small" onClick={projects.reload}>
                Erneut versuchen
              </button>
            </span>
          )}
        </div>
      }
    >
      {/* key: bei geänderten Filtern neu mounten, damit die Stapel der neuen Auswahl geladen werden */}
      <CustomerIssueList key={`${projectKey}|${scope}`} projectKey={projectKey} mineOnly={scope === 'mine'} />
    </WidgetFrame>
  )
}
