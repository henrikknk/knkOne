import type { CSSProperties } from 'react'
import { PagedRows, Pill, Row, WidgetFrame } from '../components/Widget'
import type { WidgetProps } from '../components/widgetTypes'
import { usePagedList, type PageLoader } from '../hooks/usePagedList'
import { daysBetween, formatTime } from '../lib/format'
import { loadUpcomingEventsPage, type CalendarEventRow } from '../services/calendar'

interface EventItem extends CalendarEventRow {
  /** Tage ab heute bis zum Beginn, zum Ladezeitpunkt berechnet */
  dayOffset: number
  isOngoing: boolean
}

const loadEvents: PageLoader<EventItem, number> = async (cursor) => {
  const page = await loadUpcomingEventsPage(cursor)
  const now = new Date()
  return {
    ...page,
    items: page.items.map((event) => ({
      ...event,
      dayOffset: daysBetween(now, event.start),
      isOngoing: event.start <= now && event.end > now,
    })),
  }
}

function dayLabel(event: EventItem) {
  if (event.dayOffset === 0) return 'Heute'
  if (event.dayOffset === 1) return 'Morgen'
  return event.start.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

function timeLabel(event: EventItem) {
  return event.isAllDay ? 'ganztägig' : `${formatTime(event.start)} – ${formatTime(event.end)}`
}

// Live-Widget: anstehende Termine aus dem eigenen Outlook-Kalender, mit Kategorien in ihren Farben.
export default function TermineWidget(props: WidgetProps) {
  const list = usePagedList(loadEvents)
  const todayCount = list.items.filter((event) => event.dayOffset === 0).length

  return (
    <WidgetFrame {...props} badge={list.status === 'ready' && todayCount > 0 ? <Pill tone="info">{todayCount} heute</Pill> : undefined}>
      <PagedRows
        list={list}
        empty="Keine anstehenden Termine in den nächsten Wochen"
        renderItem={(event) => {
          const highImportance = event.importance === 'high'
          const awaitingResponse = event.responseType === 'notResponded'
          return (
            <Row
              key={event.id}
              urgency={highImportance ? 'critical' : awaitingResponse ? 'warning' : 'normal'}
              title={event.subject}
              href={event.webLink}
              meta={
                <>
                  <strong className={event.dayOffset === 0 ? 'text-accent' : undefined}>{dayLabel(event)}</strong> · {timeLabel(event)}
                  {event.location && ` · ${event.location}`}
                </>
              }
              tags={
                event.categories.length > 0 || highImportance || awaitingResponse ? (
                  <>
                    {highImportance && <Pill tone="critical">Wichtig</Pill>}
                    {awaitingResponse && <Pill tone="warning">Antwort offen</Pill>}
                    {event.categories.map((category) => (
                      <span key={category.name} className="category" style={{ '--category-color': category.color } as CSSProperties}>
                        {category.name}
                      </span>
                    ))}
                  </>
                ) : undefined
              }
              aside={event.isOngoing ? <Pill tone="success">läuft</Pill> : undefined}
            />
          )
        }}
      />
    </WidgetFrame>
  )
}
