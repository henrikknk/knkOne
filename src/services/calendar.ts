import { getContext } from '@microsoft/power-apps/app'
import { Office365OutlookService } from '../generated/services/Office365OutlookService'
import type {
  GraphCalendarEventClientReceive,
  GraphCalendarEventClientReceiveimportance,
  GraphCalendarEventClientReceiveresponseType,
} from '../generated/models/Office365OutlookModel'
import type { Page } from '../hooks/usePagedList'

export interface EventCategory {
  name: string
  color: string
}

export interface CalendarEventRow {
  id: string
  subject: string
  start: Date
  end: Date
  isAllDay: boolean
  location: string
  categories: EventCategory[]
  importance?: GraphCalendarEventClientReceiveimportance
  responseType?: GraphCalendarEventClientReceiveresponseType
  webLink?: string
}

interface OutlookCalendar {
  id: string
  name: string
  ownerAddress: string
}

// CalendarGetTables_V2 ist im generierten Service nur als Record<string, unknown> typisiert.
function parseCalendars(data: Record<string, unknown> | undefined): OutlookCalendar[] {
  const value = data?.value
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const calendar = item as { id?: unknown; name?: unknown; owner?: { address?: unknown } }
    if (typeof calendar.id !== 'string') return []
    return [
      {
        id: calendar.id,
        name: typeof calendar.name === 'string' ? calendar.name : '',
        ownerAddress: typeof calendar.owner?.address === 'string' ? calendar.owner.address.toLowerCase() : '',
      },
    ]
  })
}

const DEFAULT_CALENDAR_NAMES = ['kalender', 'calendar']

// Die Kalenderliste enthält auch Kalender, die andere Personen freigegeben haben - nur eigene zulassen.
// Die Postfachadresse kann in einer anderen Domain liegen als der UPN, daher notfalls über den Teil vor dem @ vergleichen.
function pickOwnCalendar(calendars: OutlookCalendar[], userPrincipalName: string): OutlookCalendar | undefined {
  const upn = userPrincipalName.toLowerCase()
  const localPart = upn.split('@')[0]
  let own = calendars.filter((calendar) => calendar.ownerAddress === upn)
  if (own.length === 0 && localPart) own = calendars.filter((calendar) => calendar.ownerAddress.split('@')[0] === localPart)
  return own.find((calendar) => DEFAULT_CALENDAR_NAMES.includes(calendar.name.toLowerCase())) ?? own[0]
}

let calendarIdPromise: Promise<string> | null = null

async function resolveOwnCalendarId(): Promise<string> {
  // GetEventsCalendarViewV3 braucht die opake ID aus CalendarGetTables_V2 - Aliase wie "Calendar" sind laut Connector ungültig.
  const [context, tables] = await Promise.all([getContext(), Office365OutlookService.CalendarGetTables_V2()])
  if (!tables.success) throw new Error(tables.error?.message || 'Kalenderliste konnte nicht geladen werden')
  const userPrincipalName = context.user.userPrincipalName
  if (!userPrincipalName) throw new Error('Kein angemeldeter Benutzer im App-Kontext gefunden')
  const calendar = pickOwnCalendar(parseCalendars(tables.data), userPrincipalName)
  if (!calendar) throw new Error('Kein eigener Kalender des angemeldeten Benutzers gefunden')
  return calendar.id
}

function ownCalendarId(): Promise<string> {
  if (!calendarIdPromise) {
    calendarIdPromise = resolveOwnCalendarId().catch((error: unknown) => {
      calendarIdPromise = null
      throw error
    })
  }
  return calendarIdPromise
}

// Der Connector liefert Kategorien nur als Namen, ohne Farbe. Outlook-Standardkategorien („Rote Kategorie“,
// „Blue category“ …) bekommen ihre Farbe, alle anderen eine feste, aus dem Namen abgeleitete Farbe.
const NAMED_CATEGORY_COLORS: Array<[RegExp, string]> = [
  [/^(rote?|red)\b/i, '#D13438'],
  [/^orange/i, '#CA5010'],
  [/^(gelbe?|yellow)\b/i, '#B38600'],
  [/^(grüne?|green)\b/i, '#107C10'],
  [/^(blaue?|blue)\b/i, '#0063B1'],
  [/^(lila|violette?|purple)\b/i, '#8764B8'],
]
const FALLBACK_CATEGORY_COLORS = ['#038387', '#8E562E', '#5C2E91', '#C30052', '#486860', '#004E8C', '#7A7574', '#498205']

function categoryColor(name: string): string {
  const named = NAMED_CATEGORY_COLORS.find(([pattern]) => pattern.test(name.trim()))
  if (named) return named[1]
  const hash = [...name].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7)
  return FALLBACK_CATEGORY_COLORS[hash % FALLBACK_CATEGORY_COLORS.length]
}

// start/end kommen ohne Zeitzone - die *WithTimeZone-Felder tragen den Offset und werden bevorzugt.
function parseEventDate(withTimeZone?: string, plain?: string): Date | null {
  const date = withTimeZone ? new Date(withTimeZone) : plain ? new Date(`${plain.replace(/Z$/, '')}Z`) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

function toRow(event: GraphCalendarEventClientReceive): CalendarEventRow | null {
  const start = parseEventDate(event.startWithTimeZone, event.start)
  if (!start) return null
  return {
    id: event.id || `${event.subject}-${start.toISOString()}`,
    subject: event.subject || '(kein Titel)',
    start,
    end: parseEventDate(event.endWithTimeZone, event.end) ?? start,
    isAllDay: event.isAllDay === true,
    location: event.location || '',
    categories: (event.categories ?? []).filter(Boolean).map((name) => ({ name, color: categoryColor(name) })),
    importance: event.importance,
    responseType: event.responseType,
    webLink: event.webLink,
  }
}

const WINDOW_DAYS = 7
const MAX_WINDOWS = 12

/** Anstehende Termine im eigenen Kalender, stapelweise je Woche (bis 12 Wochen voraus). */
export async function loadUpcomingEventsPage(windowIndex: number | undefined): Promise<Page<CalendarEventRow, number>> {
  const index = windowIndex ?? 0
  const calendarId = await ownCalendarId()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const from = index === 0 ? now : new Date(today.getFullYear(), today.getMonth(), today.getDate() + index * WINDOW_DAYS)
  const to = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (index + 1) * WINDOW_DAYS)

  const result = await Office365OutlookService.GetEventsCalendarViewV3(calendarId, from.toISOString(), to.toISOString())
  if (!result.success) throw new Error(result.error?.message || 'Termine konnten nicht geladen werden')

  const items = (result.data?.value ?? [])
    .map(toRow)
    .filter((row): row is CalendarEventRow => row !== null)
    // Termine, die ins nächste Fenster hineinragen, nur einmal zeigen: im Fenster ihres Beginns.
    .filter((row) => index === 0 || row.start >= from)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
  return { items, next: index + 1 < MAX_WINDOWS ? index + 1 : undefined }
}
