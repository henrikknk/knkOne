/**
 * Merkt sich, welche Jira-Kommentare der Benutzer bereits gesehen hat.
 *
 * Modul-Store statt State im Widget: Tickets- und Kundentickets-Widget können gleichzeitig auf dem
 * Dashboard liegen, und ein Klick im einen muss sofort im anderen wirken. Der Zustand liegt in
 * localStorage - also pro Browser, nicht pro Benutzer; das genügt, weil er nur die Anzeige steuert.
 *
 * Zirkelbezug beachten: src/services/jira.ts importiert `mayHaveUpdates` als Wert, diese Datei holt
 * `JiraComment` ausschließlich per `import type`. Type-Only-Importe entfernt TypeScript beim Übersetzen,
 * daher entsteht kein Laufzeitzyklus - bitte nicht in einen Wert-Import umbauen.
 */
import { useSyncExternalStore } from 'react'
import type { JiraComment } from './jira'

const STORAGE_KEY = 'knkone.jira.commentReads.v1'
/** Obergrenze der einzeln gemerkten Tickets, damit der Speicher nicht unbegrenzt wächst. */
const MAX_READS = 500
/** Sicherheitsnetz gegen verstellte Uhren und alte Stände: nichts älter als 30 Tage leuchtet auf. */
const MAX_UNREAD_AGE_MS = 30 * 86_400_000

export interface TicketReads {
  /** Zeitpunkt des letzten „alles gelesen“; alles davor gilt grundsätzlich als gesehen. */
  baseline: number
  /** Ticketschlüssel → Zeitpunkt des jüngsten dort gesehenen Kommentars, in Epoch-Millisekunden. */
  seen: ReadonlyMap<string, number>
}

interface StoredReads {
  v: 1
  baseline: number
  seen: Array<[string, number]>
}

function isStored(value: unknown): value is StoredReads {
  const stored = value as StoredReads | null
  return (
    typeof stored === 'object' &&
    stored !== null &&
    stored.v === 1 &&
    typeof stored.baseline === 'number' &&
    Number.isFinite(stored.baseline) &&
    Array.isArray(stored.seen)
  )
}

function read(): TicketReads | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isStored(parsed)) return null
    const seen = new Map<string, number>()
    for (const entry of parsed.seen) {
      if (Array.isArray(entry) && typeof entry[0] === 'string' && typeof entry[1] === 'number' && Number.isFinite(entry[1])) {
        seen.set(entry[0], entry[1])
      }
    }
    return { baseline: parsed.baseline, seen }
  } catch {
    // Unlesbarer oder fremder Inhalt wird verworfen - lieber neu beginnen als falsch anzeigen.
    return null
  }
}

function write(reads: TicketReads) {
  try {
    // Beim Schreiben rutscht der berührte Eintrag ans Ende, daher hält slice(-MAX_READS) die jüngsten.
    const seen = [...reads.seen.entries()].slice(-MAX_READS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, baseline: reads.baseline, seen } satisfies StoredReads))
  } catch {
    // ignore storage errors (e.g. private browsing quota)
  }
}

// Beim allerersten Start zählt ab jetzt: ohne Grundlinie würden sonst schlagartig alle Tickets aufleuchten.
const restored = read()
let state: TicketReads = restored ?? { baseline: Date.now(), seen: new Map() }
if (!restored) write(state)

const listeners = new Set<() => void>()

/** Ersetzt den Zustand durch ein neues Objekt - nur so laufen useSyncExternalStore und useMemo neu. */
function setState(next: TicketReads, persist = true) {
  state = next
  if (persist) write(next)
  for (const listener of listeners) listener()
}

export function subscribeTicketReads(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getTicketReads(): TicketReads {
  return state
}

export function useTicketReads(): TicketReads {
  return useSyncExternalStore(subscribeTicketReads, getTicketReads)
}

/** Grundlinie des Tickets: sein eigener Stand, sonst der globale „alles gelesen“-Zeitpunkt. */
function seenSince(reads: TicketReads, key: string): number {
  return reads.seen.get(key) ?? reads.baseline
}

/** Neu ist ein Kommentar, der nach dem gespeicherten Stand entstand und nicht zu alt ist. */
export function isUnreadComment(reads: TicketReads, key: string, comment: JiraComment | null | undefined): boolean {
  // undefined = keine Kommentardaten verfügbar, null = keine fremden Kommentare vorhanden.
  if (!comment) return false
  return comment.createdMs > seenSince(reads, key) && Date.now() - comment.createdMs < MAX_UNREAD_AGE_MS
}

/**
 * Vorfilter für das Nachladen einzelner Tickets: Nur wo sich seit dem letzten Lesen etwas geändert hat,
 * lohnt der zusätzliche Aufruf. Ohne `updated` wird im Zweifel geprüft.
 */
export function mayHaveUpdates(key: string, updated: string | null): boolean {
  if (!updated) return true
  const updatedMs = Date.parse(updated)
  if (!Number.isFinite(updatedMs)) return true
  return updatedMs > seenSince(state, key)
}

/** Klick auf ein Ticket: bis zu dessen jüngstem Kommentar ist alles gesehen. Der Stand geht nie zurück. */
export function markTicketRead(key: string, comment: JiraComment | null | undefined): void {
  if (!key) return
  const at = comment?.createdMs ?? Date.now()
  if (at <= seenSince(state, key)) return
  const seen = new Map(state.seen)
  // Erst löschen, dann setzen: so steht der Eintrag am Ende und überlebt das Kappen am längsten.
  seen.delete(key)
  seen.set(key, at)
  setState({ baseline: state.baseline, seen })
}

/**
 * Nimmt das Lesen zurück, sodass der Kommentar wieder als neu gilt.
 *
 * Den Eintrag einfach zu löschen genügt nicht: dann fiele das Ticket auf die globale Grundlinie zurück,
 * und nach einem „alles gelesen“ läge die hinter dem Kommentar. Deshalb ein Stand knapp davor.
 */
export function markTicketUnread(key: string, comment: JiraComment | null | undefined): void {
  if (!key || !comment) return
  const seen = new Map(state.seen)
  seen.delete(key)
  seen.set(key, comment.createdMs - 1)
  setState({ baseline: state.baseline, seen })
}

/**
 * Ob sich ein Kommentar überhaupt wieder auf ungelesen setzen lässt. Jenseits von MAX_UNREAD_AGE_MS
 * greift die Altersschranke in isUnreadComment, der Knopf bliebe also wirkungslos.
 */
export function canMarkUnread(comment: JiraComment | null | undefined): boolean {
  return !!comment && Date.now() - comment.createdMs < MAX_UNREAD_AGE_MS
}

/**
 * „Alle als gelesen“: ein globaler Schnitt statt einer Markierung der sichtbaren Zeilen. Das gilt damit
 * auch für Tickets, die nie geladen wurden, wirkt in beiden Widgets gleich und leert den Speicher.
 */
export function markAllRead(): void {
  setState({ baseline: Date.now(), seen: new Map() })
}

// Zweiter Tab derselben App: Änderungen dort übernehmen. Das Ereignis feuert nie im eigenen Tab.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    const next = read()
    if (next) setState(next, false)
  })
}
