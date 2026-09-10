// Gemeinsame Formatierung und Datumslogik für alle Widgets.

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '–'
  return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

/** Lokales Kalenderdatum (Mitternacht) - für Fristen und Fälligkeiten zählt nur der Tag. */
export function toCalendarDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function formatDate(value: Date | string | null | undefined): string {
  const date = toCalendarDate(value)
  return date ? date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '–'
}

export function formatTime(value: Date): string {
  return value.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

/** Kalendertage von `from` bis `to` (negativ = in der Vergangenheit), unabhängig von Sommerzeit. */
export function daysBetween(from: Date, to: Date): number {
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((toUtc - fromUtc) / 86_400_000)
}

export function relativeDays(days: number): string {
  if (days === 0) return 'heute'
  if (days === 1) return 'morgen'
  if (days === -1) return 'gestern'
  return days > 0 ? `in ${days} Tagen` : `vor ${-days} Tagen`
}

/** Dringlichkeitsstufen - steuern Farbe und Hervorhebung einheitlich über alle Widgets. */
export type Urgency = 'critical' | 'warning' | 'normal' | 'muted'

/** Frist in `days` Tagen: abgelaufen oder ≤ 30 Tage kritisch, ≤ 90 Tage Warnung. */
export function deadlineUrgency(days: number | null): Urgency {
  if (days === null) return 'muted'
  if (days <= 30) return 'critical'
  if (days <= 90) return 'warning'
  return 'normal'
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  return fallback
}
