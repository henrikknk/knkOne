// Datenaufbereitung für Diagramme: Zeitverläufe offener Einträge, Kalenderwochen und Gruppierungen.

/** Ein Eintrag im Auslastungsverlauf: offen ab `created`, bis `closed` (null = noch offen). */
export interface TimelineItem {
  created: Date
  closed: Date | null
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Verlaufseintrag aus Anlage- und Abschlusszeitpunkt; ohne gültiges Anlagedatum keiner. */
export function timelineItem(created: string | null | undefined, closed: string | null | undefined): TimelineItem[] {
  const createdDate = parseDate(created)
  return createdDate ? [{ created: createdDate, closed: parseDate(closed) }] : []
}

/** Anzahl der Einträge, die zum Zeitpunkt `moment` offen waren. */
export function openAt(items: TimelineItem[], moment: Date): number {
  return items.filter((item) => item.created <= moment && (item.closed === null || item.closed > moment)).length
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Montag der Woche von `date`. */
export function startOfWeek(date: Date): Date {
  const weekday = (date.getDay() + 6) % 7
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - weekday)
}

function isoWeek(date: Date): number {
  const thursday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7))
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1)
  return Math.ceil(((thursday.getTime() - yearStart) / 86_400_000 + 1) / 7)
}

export interface CalendarWeek {
  start: Date
  /** Sonntag der Woche */
  lastDay: Date
  /** Stichtag für „offen“: Wochenende bzw. `now` in der laufenden Woche */
  end: Date
  number: number
}

/** Die letzten `count` Kalenderwochen bis einschließlich der laufenden. */
export function recentWeeks(count: number, now: Date): CalendarWeek[] {
  const current = startOfWeek(now)
  return Array.from({ length: count }, (_, index) => {
    const start = new Date(current.getFullYear(), current.getMonth(), current.getDate() - (count - 1 - index) * 7)
    const nextStart = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)
    return {
      start,
      lastDay: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6),
      end: nextStart < now ? nextStart : now,
      number: isoWeek(start),
    }
  })
}

/** Ganze Kalendermonate von `from` bis `to` (gleicher Monat = 0). */
export function monthOffset(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth()
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

/** Häufigkeiten, absteigend; mehr als `maxGroups` Gruppen werden zu „Weitere“ zusammengefasst. */
export function countBy(values: string[], maxGroups = 8): Array<{ label: string; value: number }> {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  const sorted = [...counts]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'de'))
  if (sorted.length <= maxGroups) return sorted
  const rest = sorted.slice(maxGroups - 1).reduce((sum, item) => sum + item.value, 0)
  return [...sorted.slice(0, maxGroups - 1), { label: 'Weitere', value: rest }]
}
