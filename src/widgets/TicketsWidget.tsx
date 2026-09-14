import { useMemo, useState } from 'react'
import { BarList, ChartFrame } from '../components/charts'
import { CommentLine, ReadToggleButton } from '../components/IssueBadges'
import { ChartToggle, PagedRows, Pill, Row, TabSwitch, WidgetEmpty, WidgetFrame, WidgetNotice, WidgetSkeleton } from '../components/Widget'
import type { WidgetProps } from '../components/widgetTypes'
import { useAsyncData } from '../hooks/useAsyncData'
import { usePagedList, type PageLoader } from '../hooks/usePagedList'
import { countBy } from '../lib/chartData'
import { daysBetween, relativeDays, toCalendarDate } from '../lib/format'
import { issueUrgency, listAllMyIssues, loadMyIssuesPage, withLatestComments, type JiraCursor, type JiraIssueRow } from '../services/jira'
import { canMarkUnread, isUnreadComment, markAllRead, markTicketRead, markTicketUnread, useTicketReads } from '../services/ticketReads'

interface TicketItem extends JiraIssueRow {
  /** Tage bis zur Fälligkeit, zum Ladezeitpunkt berechnet */
  dueInDays: number | null
}

const loadTickets: PageLoader<TicketItem, JiraCursor> = async (cursor) => {
  const page = await loadMyIssuesPage(cursor)
  const issues = await withLatestComments(page.items)
  const today = new Date()
  return {
    ...page,
    items: issues.map((issue) => {
      const due = toCalendarDate(issue.dueDate)
      return { ...issue, dueInDays: due ? daysBetween(today, due) : null }
    }),
  }
}

type TicketGrouping = 'status' | 'project'

const GROUPINGS: Array<{ value: TicketGrouping; label: string }> = [
  { value: 'status', label: 'Nach Status' },
  { value: 'project', label: 'Nach Projekt' },
]

// Diagramm: alle offenen Tickets, gezählt nach Status oder Projekt.
function TicketsChart() {
  const data = useAsyncData(listAllMyIssues)
  const [grouping, setGrouping] = useState<TicketGrouping>('status')

  if (data.status === 'loading') return <WidgetSkeleton />
  if (data.status === 'error') return <WidgetNotice kind="offline" text={data.error} onRetry={data.reload} />
  if (data.data.length === 0) return <WidgetEmpty text="Keine offenen Tickets" />

  const items = countBy(data.data.map((issue) => (grouping === 'status' ? issue.status : issue.project)))
  return (
    <ChartFrame controls={<TabSwitch label="Gruppierung" options={GROUPINGS} value={grouping} onChange={setGrouping} />}>
      <BarList items={items} color="var(--series-1)" ariaLabel={`Offene Tickets ${grouping === 'status' ? 'nach Status' : 'nach Projekt'}`} />
    </ChartFrame>
  )
}

function ReloadButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      className="widget-action"
      onClick={onClick}
      disabled={loading}
      aria-label="Tickets neu laden"
      title={loading ? 'Tickets werden geladen …' : 'Tickets neu laden'}
    >
      <svg className={loading ? 'is-spinning' : undefined} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 12a8 8 0 1 1-2.34-5.66" />
        <path d="M20 4v5h-5" />
      </svg>
    </button>
  )
}

/** Setzt den Lesestand global - wirkt auch auf Tickets, die noch gar nicht geladen wurden. */
function MarkAllReadButton({ disabled }: { disabled: boolean }) {
  return (
    <button
      type="button"
      className="widget-action"
      onClick={markAllRead}
      disabled={disabled}
      aria-label="Alle Ticketkommentare als gelesen markieren"
      title="Alle Ticketkommentare als gelesen markieren - auch bei Tickets, die noch nicht geladen sind"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m2 13 4 4 8-8" />
        <path d="m12 13 2 2 8-8" />
      </svg>
    </button>
  )
}

// Live-Widget: offene Jira-Tickets, bei denen ich zugewiesen oder Anfrageteilnehmer bin.
export default function TicketsWidget(props: WidgetProps) {
  const list = usePagedList(loadTickets)
  const [showChart, setShowChart] = useState(false)
  const reads = useTicketReads()
  const ourTurn = list.items.filter((ticket) => ticket.turn === 'us').length
  const unread = useMemo(
    () => list.items.filter((ticket) => isUnreadComment(reads, ticket.key, ticket.lastComment)),
    [list.items, reads],
  )

  return (
    <WidgetFrame
      {...props}
      actions={
        <>
          <MarkAllReadButton disabled={unread.length === 0} />
          <ReloadButton onClick={list.reload} loading={list.status === 'loading'} />
          <ChartToggle active={showChart} onToggle={() => setShowChart((value) => !value)} />
        </>
      }
      badge={
        // Ein leeres Fragment wäre truthy und ergäbe einen leeren Badge-Container - daher explizit prüfen.
        list.status === 'ready' && (unread.length > 0 || ourTurn > 0) ? (
          <>
            {unread.length > 0 && (
              <Pill tone="info" title="Tickets mit neuem Kommentar unter den geladenen Tickets">
                {unread.length} neu
              </Pill>
            )}
            {ourTurn > 0 && <Pill tone="warning">{ourTurn} bei uns</Pill>}
          </>
        ) : undefined
      }
    >
      {showChart ? (
        <TicketsChart />
      ) : (
        <PagedRows
          list={list}
          empty="Keine offenen Tickets, bei denen du zugewiesen oder Anfrageteilnehmer bist"
          renderItem={(ticket) => {
            const unread = isUnreadComment(reads, ticket.key, ticket.lastComment)
            const due =
              ticket.dueInDays !== null ? (
                <Pill tone={ticket.dueInDays < 0 ? 'critical' : ticket.dueInDays <= 3 ? 'warning' : 'neutral'}>
                  {ticket.dueInDays < 0 ? 'überfällig' : `fällig ${relativeDays(ticket.dueInDays)}`}
                </Pill>
              ) : null
            // Ohne Kommentar gibt es nichts umzuschalten; zu alte Kommentare fallen unter die Altersschranke.
            const canToggle = unread || canMarkUnread(ticket.lastComment)
            return (
              <Row
                key={ticket.key}
                urgency={issueUrgency(ticket, ticket.dueInDays)}
                highlight={unread}
                title={ticket.summary}
                href={ticket.url}
                onOpen={() => markTicketRead(ticket.key, ticket.lastComment)}
                meta={`${ticket.key} · ${ticket.project} · ${ticket.status}`}
                // Der jüngste Kommentar steht immer da, auch gelesen - ungelesen wird er hervorgehoben.
                details={ticket.lastComment ? <CommentLine comment={ticket.lastComment} unread={unread} /> : undefined}
                tags={
                  <>
                    {ticket.turn === 'us' ? <Pill tone="warning">Wir am Zug</Pill> : <Pill tone="neutral">Kunde am Zug</Pill>}
                    {ticket.role === 'assignee' && <Pill tone="info">Zugewiesen</Pill>}
                    {ticket.role === 'participant' && <Pill tone="neutral">Anfrageteilnehmer</Pill>}
                    {ticket.isHighPriority && <Pill tone="critical">{ticket.priority}</Pill>}
                  </>
                }
                // undefined statt eines leeren Fragments, sonst entstünde ein leerer Aside-Container.
                aside={
                  due || canToggle ? (
                    <>
                      {due}
                      {canToggle && (
                        <ReadToggleButton
                          unread={unread}
                          onToggle={() =>
                            unread ? markTicketRead(ticket.key, ticket.lastComment) : markTicketUnread(ticket.key, ticket.lastComment)
                          }
                        />
                      )}
                    </>
                  ) : undefined
                }
              />
            )
          }}
        />
      )}
    </WidgetFrame>
  )
}
