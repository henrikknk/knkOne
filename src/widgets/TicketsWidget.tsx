import { PagedRows, Pill, Row, WidgetFrame } from '../components/Widget'
import type { WidgetProps } from '../components/widgetTypes'
import { usePagedList, type PageLoader } from '../hooks/usePagedList'
import { daysBetween, relativeDays, toCalendarDate, type Urgency } from '../lib/format'
import { loadMyIssuesPage, type JiraCursor, type JiraIssueRow } from '../services/jira'

interface TicketItem extends JiraIssueRow {
  /** Tage bis zur Fälligkeit, zum Ladezeitpunkt berechnet */
  dueInDays: number | null
}

const loadTickets: PageLoader<TicketItem, JiraCursor> = async (cursor) => {
  const page = await loadMyIssuesPage(cursor)
  const today = new Date()
  return {
    ...page,
    items: page.items.map((issue) => {
      const due = toCalendarDate(issue.dueDate)
      return { ...issue, dueInDays: due ? daysBetween(today, due) : null }
    }),
  }
}

// Kritisch nur, wenn wir am Zug sind: hohe Priorität oder überschrittene Fälligkeit.
function ticketUrgency(ticket: TicketItem): Urgency {
  if (ticket.turn === 'customer') return 'muted'
  if (ticket.isHighPriority || (ticket.dueInDays !== null && ticket.dueInDays < 0)) return 'critical'
  if (ticket.dueInDays !== null && ticket.dueInDays <= 3) return 'warning'
  return 'normal'
}

// Live-Widget: offene Jira-Tickets, bei denen ich zugewiesen oder Anfrageteilnehmer bin.
export default function TicketsWidget(props: WidgetProps) {
  const list = usePagedList(loadTickets)
  const ourTurn = list.items.filter((ticket) => ticket.turn === 'us').length

  return (
    <WidgetFrame {...props} badge={list.status === 'ready' && ourTurn > 0 ? <Pill tone="warning">{ourTurn} bei uns</Pill> : undefined}>
      <PagedRows
        list={list}
        empty="Keine offenen Tickets, bei denen du zugewiesen oder Anfrageteilnehmer bist"
        renderItem={(ticket) => (
          <Row
            key={ticket.key}
            urgency={ticketUrgency(ticket)}
            title={ticket.summary}
            href={ticket.url}
            meta={`${ticket.key} · ${ticket.project} · ${ticket.status}`}
            tags={
              <>
                {ticket.turn === 'us' ? <Pill tone="warning">Wir am Zug</Pill> : <Pill tone="neutral">Kunde am Zug</Pill>}
                {ticket.role === 'assignee' && <Pill tone="info">Zugewiesen</Pill>}
                {ticket.role === 'participant' && <Pill tone="neutral">Anfrageteilnehmer</Pill>}
                {ticket.isHighPriority && <Pill tone="critical">{ticket.priority}</Pill>}
              </>
            }
            aside={
              ticket.dueInDays !== null ? (
                <Pill tone={ticket.dueInDays < 0 ? 'critical' : ticket.dueInDays <= 3 ? 'warning' : 'neutral'}>
                  {ticket.dueInDays < 0 ? 'überfällig' : `fällig ${relativeDays(ticket.dueInDays)}`}
                </Pill>
              ) : undefined
            }
          />
        )}
      />
    </WidgetFrame>
  )
}
