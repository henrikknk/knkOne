import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Pill, WidgetFrame, WidgetNotice, WidgetSkeleton } from '../components/Widget'
import type { WidgetProps } from '../components/widgetTypes'
import { errorMessage, formatTime } from '../lib/format'
import { loadEventsInRange, type CalendarEventRow } from '../services/calendar'

type CalendarView = 'day' | 'three' | 'workweek'

const VIEWS: Array<{ id: CalendarView; label: string }> = [
  { id: 'day', label: 'Tag' },
  { id: 'three', label: '3 Tage' },
  { id: 'workweek', label: 'Arbeitswoche' },
]

const VIEW_STORAGE_KEY = 'knkone.termine.view'
const HOUR_HEIGHT = 44
const DAY_MINUTES = 24 * 60
/** Kurze Termine bekommen eine Mindesthöhe, damit der Titel lesbar bleibt. */
const MIN_BLOCK_MINUTES = 25
/** Kürzere Termine zeigen Uhrzeit und Titel in einer Zeile. */
const COMPACT_MINUTES = 50
const WORKDAY_START_MINUTES = 7 * 60

function loadView(): CalendarView {
  try {
    const stored = localStorage.getItem(VIEW_STORAGE_KEY)
    return VIEWS.find((option) => option.id === stored)?.id ?? 'day'
  } catch {
    return 'day'
  }
}

function saveView(view: CalendarView) {
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, view)
  } catch {
    // ignore storage errors (e.g. private browsing quota)
  }
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function daysForView(view: CalendarView, today: Date): Date[] {
  if (view === 'day') return [today]
  if (view === 'three') return [0, 1, 2].map((offset) => addDays(today, offset))
  // Arbeitswoche Mo–Fr; am Wochenende die kommende Woche.
  const weekday = today.getDay()
  const monday = addDays(today, weekday === 0 ? 1 : weekday === 6 ? 2 : 1 - weekday)
  return [0, 1, 2, 3, 4].map((offset) => addDays(monday, offset))
}

/** Ein Ladezeitraum für alle Ansichten, damit das Umschalten ohne erneute Abfrage auskommt. */
function loadRange(today: Date) {
  const times = VIEWS.flatMap((option) => daysForView(option.id, today)).map((day) => day.getTime())
  return { from: new Date(Math.min(...times)), to: addDays(new Date(Math.max(...times)), 1) }
}

// Ganztägige Termine beginnen um Mitternacht in der Zeitzone des Termins - auf die nächste lokale Mitternacht runden.
function nearestMidnight(date: Date) {
  const midnight = addDays(date, 0)
  return date.getTime() - midnight.getTime() >= 12 * 3_600_000 ? addDays(midnight, 1) : midnight
}

/** Minuten seit Mitternacht von `day`, begrenzt auf den Tag. */
function minutesInDay(date: Date, day: Date) {
  if (date <= day) return 0
  if (date >= addDays(day, 1)) return DAY_MINUTES
  return date.getHours() * 60 + date.getMinutes()
}

interface TimedBlock {
  event: CalendarEventRow
  startMin: number
  /** Sichtbares Ende, mindestens MIN_BLOCK_MINUTES nach dem Beginn */
  endMin: number
  column: number
  columns: number
}

interface DayLayout {
  day: Date
  allDay: CalendarEventRow[]
  timed: TimedBlock[]
}

// Überlappende Termine teilen sich die Breite: jede Gruppe sich überschneidender Termine bekommt so viele Spalten wie nötig.
function assignColumns(blocks: TimedBlock[]) {
  blocks.sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin)
  let group: TimedBlock[] = []
  let columnEnds: number[] = []
  let groupEnd = -1
  const closeGroup = () => {
    for (const block of group) block.columns = columnEnds.length
    group = []
    columnEnds = []
  }
  for (const block of blocks) {
    if (block.startMin >= groupEnd) closeGroup()
    let column = columnEnds.findIndex((end) => end <= block.startMin)
    if (column < 0) column = columnEnds.length
    columnEnds[column] = block.endMin
    block.column = column
    group.push(block)
    groupEnd = Math.max(groupEnd, block.endMin)
  }
  closeGroup()
}

function buildDay(day: Date, events: CalendarEventRow[]): DayLayout {
  const nextDay = addDays(day, 1)
  const allDay: CalendarEventRow[] = []
  const timed: TimedBlock[] = []
  for (const event of events) {
    if (event.isAllDay) {
      const first = nearestMidnight(event.start)
      const endRounded = nearestMidnight(event.end)
      const end = endRounded > first ? endRounded : addDays(first, 1)
      if (first <= day && end > day) allDay.push(event)
      continue
    }
    const zeroLength = event.end.getTime() === event.start.getTime()
    if (event.start >= nextDay || (zeroLength ? event.start < day : event.end <= day)) continue
    const startMin = Math.min(minutesInDay(event.start, day), DAY_MINUTES - MIN_BLOCK_MINUTES)
    const endMin = minutesInDay(event.end, day)
    // Mehrtägige Termine, die den ganzen Tag abdecken, belegen den Tag nicht als Block.
    if (startMin === 0 && endMin === DAY_MINUTES) {
      allDay.push(event)
      continue
    }
    timed.push({ event, startMin, endMin: Math.min(DAY_MINUTES, Math.max(endMin, startMin + MIN_BLOCK_MINUTES)), column: 0, columns: 1 })
  }
  assignColumns(timed)
  return { day, allDay, timed }
}

function eventTooltip(event: CalendarEventRow) {
  return [
    event.subject,
    event.isAllDay ? 'ganztägig' : `${formatTime(event.start)} – ${formatTime(event.end)}`,
    event.location,
    event.categories.map((category) => category.name).join(', '),
    event.importance === 'high' && 'Wichtig',
    event.responseType === 'notResponded' && 'Antwort offen',
  ]
    .filter(Boolean)
    .join('\n')
}

function EventLink({ event, className, style, children }: { event: CalendarEventRow; className: string; style?: CSSProperties; children: ReactNode }) {
  const shared = {
    className,
    title: eventTooltip(event),
    style: { '--event-color': event.categories[0]?.color ?? 'var(--brand)', ...style } as CSSProperties,
  }
  return event.webLink ? (
    <a {...shared} href={event.webLink} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    <div {...shared}>{children}</div>
  )
}

type LoadState = { status: 'loading' } | { status: 'error'; error: string } | { status: 'ready'; events: CalendarEventRow[] }

// Live-Widget: eigener Outlook-Kalender als Tages-, 3-Tages- oder Arbeitswochenansicht, Kategorien in ihren Farben.
export default function TermineWidget(props: WidgetProps) {
  const [view, setView] = useState<CalendarView>(loadView)
  const [now, setNow] = useState(() => new Date())
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrolledFor = useRef('')

  const todayTime = addDays(now, 0).getTime()

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  // Lädt beim Mounten und nach Mitternacht neu, damit „heute“ stimmt.
  useEffect(() => {
    let active = true
    const { from, to } = loadRange(new Date(todayTime))
    loadEventsInRange(from, to).then(
      (events) => {
        if (active) setState({ status: 'ready', events })
      },
      (error: unknown) => {
        if (active) setState({ status: 'error', error: errorMessage(error, 'Termine konnten nicht geladen werden') })
      },
    )
    return () => {
      active = false
    }
  }, [todayTime, reloadKey])

  const ready = state.status === 'ready'
  const events = ready ? state.events : []
  const today = new Date(todayTime)
  const days = daysForView(view, today).map((day) => buildDay(day, events))
  const todayLayout = buildDay(today, events)
  const todayCount = todayLayout.allDay.length + todayLayout.timed.length
  const todayVisible = days.some(({ day }) => day.getTime() === todayTime)
  const hasAllDay = days.some(({ allDay }) => allDay.length > 0)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const firstStart = Math.min(WORKDAY_START_MINUTES, ...days.flatMap(({ timed }) => timed.map((block) => block.startMin)))

  useLayoutEffect(() => {
    const element = scrollRef.current
    const key = `${view}-${todayTime}`
    if (!element || !ready || scrolledFor.current === key) return
    scrolledFor.current = key
    // Ab Arbeitsbeginn bzw. erstem Termin zeigen; liegt die aktuelle Uhrzeit weiter unten, zu ihr springen.
    const visibleMinutes = (element.clientHeight / HOUR_HEIGHT) * 60
    let top = firstStart
    if (todayVisible && nowMinutes > top + visibleMinutes * 0.8) top = nowMinutes - visibleMinutes / 3
    element.scrollTop = (top / 60) * HOUR_HEIGHT
  }, [view, todayTime, ready, firstStart, todayVisible, nowMinutes])

  function selectView(next: CalendarView) {
    setView(next)
    saveView(next)
  }

  function reload() {
    setState({ status: 'loading' })
    setReloadKey((key) => key + 1)
  }

  return (
    <WidgetFrame
      {...props}
      badge={ready && todayCount > 0 ? <Pill tone="info">{todayCount} heute</Pill> : undefined}
      bodyClassName={ready ? 'widget-body--flush' : undefined}
      toolbar={
        <div className="tabs tabs--compact" role="tablist" aria-label="Kalenderansicht">
          {VIEWS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={view === option.id}
              className={`tab${view === option.id ? ' is-active' : ''}`}
              onClick={() => selectView(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      }
    >
      {state.status === 'loading' ? (
        <WidgetSkeleton />
      ) : state.status === 'error' ? (
        <WidgetNotice kind="offline" text={state.error} onRetry={reload} />
      ) : (
        <div className="cal" style={{ '--cal-days': days.length, '--cal-hour': `${HOUR_HEIGHT}px` } as CSSProperties}>
          <div className="cal-row cal-head">
            <span />
            {days.map(({ day }) => (
              <div key={day.getTime()} className={`cal-day-head${day.getTime() === todayTime ? ' is-today' : ''}`}>
                {days.length === 1 ? (
                  day.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
                ) : (
                  <>
                    {day.toLocaleDateString('de-DE', { weekday: 'short' })} <b>{day.getDate()}</b>
                  </>
                )}
              </div>
            ))}
          </div>

          {hasAllDay && (
            <div className="cal-row cal-allday">
              <span className="cal-allday-label">ganzt.</span>
              {days.map(({ day, allDay }) => (
                <div key={day.getTime()} className="cal-allday-cell">
                  {allDay.map((event) => (
                    <EventLink key={event.id} event={event} className="cal-chip">
                      {event.subject}
                    </EventLink>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="cal-scroll" ref={scrollRef}>
            <div className="cal-row cal-body">
              <div className="cal-hours" aria-hidden="true">
                {Array.from({ length: 23 }, (_, index) => index + 1).map((hour) => (
                  <span key={hour} className="cal-hour-label" style={{ top: hour * HOUR_HEIGHT }}>
                    {`${String(hour).padStart(2, '0')}:00`}
                  </span>
                ))}
              </div>
              {days.map(({ day, timed }) => (
                <div key={day.getTime()} className={`cal-day${day.getTime() === todayTime ? ' is-today' : ''}`}>
                  {timed.map(({ event, startMin, endMin, column, columns }) => {
                    const compact = endMin - startMin < COMPACT_MINUTES
                    const classes = [
                      'cal-event',
                      compact && 'is-compact',
                      event.end <= now && 'is-past',
                      event.importance === 'high' && 'is-important',
                      event.responseType === 'notResponded' && 'is-unanswered',
                    ]
                    return (
                      <EventLink
                        key={event.id}
                        event={event}
                        className={classes.filter(Boolean).join(' ')}
                        style={
                          {
                            top: (startMin / 60) * HOUR_HEIGHT,
                            height: ((endMin - startMin) / 60) * HOUR_HEIGHT - 2,
                            '--col': column,
                            '--cols': columns,
                          } as CSSProperties
                        }
                      >
                        <span className="cal-event-title">{event.subject}</span>
                        <span className="cal-event-meta">
                          {compact ? formatTime(event.start) : `${formatTime(event.start)} – ${formatTime(event.end)}`}
                          {!compact && event.location && ` · ${event.location}`}
                        </span>
                      </EventLink>
                    )
                  })}
                  {day.getTime() === todayTime && <div className="cal-now" style={{ top: (nowMinutes / 60) * HOUR_HEIGHT }} aria-hidden="true" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </WidgetFrame>
  )
}
