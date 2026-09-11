import { useState } from 'react'
import { BarList, ChartFrame } from '../components/charts'
import { ChartToggle, PagedRows, Pill, Row, TabSwitch, WidgetEmpty, WidgetFrame, WidgetNotice, WidgetSkeleton } from '../components/Widget'
import type { WidgetProps } from '../components/widgetTypes'
import { useAsyncData } from '../hooks/useAsyncData'
import { usePagedList, type PageLoader } from '../hooks/usePagedList'
import { countBy } from '../lib/chartData'
import { daysBetween, relativeDays, toCalendarDate } from '../lib/format'
import { issueUrgency, listAllMyIssues, loadMyIssuesPage, type JiraCursor, type JiraIssueRow } from '../services/jira'

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

// Live-Widget: offene Jira-Tickets, bei denen ich zugewiesen oder Anfrageteilnehmer bin.
export default function TicketsWidget(props: WidgetProps) {
  const list = usePagedList(loadTickets)
  const [showChart, setShowChart] = useState(false)
  const ourTurn = list.items.filter((ticket) => ticket.turn === 'us').length

  return (
    <WidgetFrame
      {...props}
      actions={<ChartToggle active={showChart} onToggle={() => setShowChart((value) => !value)} />}
      badge={list.status === 'ready' && ourTurn > 0 ? <Pill tone="warning">{ourTurn} bei uns</Pill> : undefined}
    >
      {showChart ? (
        <TicketsChart />
      ) : (
        <PagedRows
          list={list}
          empty="Keine offenen Tickets, bei denen du zugewiesen oder Anfrageteilnehmer bist"
          renderItem={(ticket) => (
            <Row
              key={ticket.key}
              urgency={issueUrgency(ticket, ticket.dueInDays)}
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
      )}
    </WidgetFrame>
  )
}
