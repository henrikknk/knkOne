import { MicrosoftTo_Do_Business_Service as ToDoService } from '../generated/services/MicrosoftTo_Do_Business_Service'
import type { ToDo_V2, ToDo_V2importance, ToDo_V2status } from '../generated/models/MicrosoftTo_Do_Business_Model'
import { timelineItem, type TimelineItem } from '../lib/chartData'
import { sharedRequest } from '../lib/sharedRequest'
import { runConnector } from './Connector'

// ListToDosByFolderV2 liefert ohne $top nur 10 Aufgaben je Liste und kann nicht nach Status filtern.
// Deshalb das Maximum anfordern und die offenen Aufgaben hier aussortieren.
const TASKS_PER_LIST = 999

const STATUS_LABELS: Record<ToDo_V2status, string> = {
  notStarted: 'Nicht begonnen',
  inProgress: 'In Bearbeitung',
  completed: 'Erledigt',
  waitingOnOthers: 'Wartet auf andere',
  deferred: 'Zurückgestellt',
}

export interface TodoRow {
  id: string
  title: string
  list: string
  /** Aufgabe liegt in der Standardliste „Aufgaben“ - dorthin synchronisiert Exchange auch CRM-Aufgaben */
  defaultList: boolean
  status: ToDo_V2status
  statusLabel: string
  importance: ToDo_V2importance
  /** Fälligkeit als YYYY-MM-DD ohne Uhrzeit, null wenn keine gesetzt ist. */
  dueDate: string | null
  /** Zeitpunkt der Erinnerung (ISO), null ohne aktive Erinnerung */
  reminder: string | null
  modified: string | null
  created: string | null
  completed: string | null
}

// Der Connector liefert Zeitpunkte ohne Zonenangabe - sie sind UTC.
function utcTimestamp(value: string | undefined): string | null {
  if (!value) return null
  return /(?:[zZ]|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`
}

function toRow(task: ToDo_V2, list: string, defaultList: boolean): TodoRow {
  const status = task.status ?? 'notStarted'
  return {
    id: task.id ?? '',
    title: task.title || 'Ohne Titel',
    list,
    defaultList,
    status,
    statusLabel: STATUS_LABELS[status],
    importance: task.importance ?? 'normal',
    dueDate: task.dueDateTime?.dateTime?.slice(0, 10) || null,
    reminder: task.isReminderOn ? utcTimestamp(task.reminderDateTime?.dateTime) : null,
    modified: task.lastModifiedDateTime ?? null,
    created: task.createdDateTime ?? null,
    completed: task.completedDateTime?.dateTime ?? null,
  }
}

// Fällige zuerst (früheste oben), danach Aufgaben ohne Fälligkeit nach letzter Änderung.
function compareTodos(a: TodoRow, b: TodoRow) {
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
  if (a.dueDate) return -1
  if (b.dueDate) return 1
  return (b.modified ?? '').localeCompare(a.modified ?? '')
}

/** Alle Aufgaben - auch erledigte - aus den eigenen To-Do-Listen des angemeldeten Benutzers. */
async function listAllOwnTodos(): Promise<TodoRow[]> {
  const lists = await runConnector('To-Do: GetAllTodoListsV2', () => ToDoService.GetAllTodoListsV2())
  // Listen, die andere Personen freigegeben haben, enthalten deren Aufgaben - nur eigene Listen anzeigen.
  // Die Liste „Gekennzeichnete E-Mails“ enthält keine echten Aufgaben und bleibt ebenfalls außen vor.
  const folders = (lists ?? []).flatMap((list) =>
    list.id && list.isOwner !== false && list.wellknownListName !== 'flaggedEmails'
      ? [{ id: list.id, name: list.displayName || 'Aufgaben', defaultList: list.wellknownListName === 'defaultList' }]
      : [],
  )

  // allSettled: eine nicht lesbare (z. B. geteilte) Liste soll die übrigen nicht verstecken.
  const results = await Promise.allSettled(
    folders.map(async (folder) => {
      const tasks = await runConnector(`To-Do: ListToDosByFolderV2 (${folder.name})`, () =>
        ToDoService.ListToDosByFolderV2(folder.id, TASKS_PER_LIST),
      )
      return (tasks ?? []).map((task) => toRow(task, folder.name, folder.defaultList))
    }),
  )

  const rows: TodoRow[] = []
  const failures: unknown[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') rows.push(...result.value)
    else failures.push(result.reason)
  }
  if (failures.length > 0 && failures.length === results.length) throw failures[0]
  if (failures.length > 0) console.error('To-Do: einzelne Listen konnten nicht geladen werden', failures)
  return rows
}

// Mehrere Tabs, Diagramme und die Suche fragen kurz nacheinander dieselben Listen ab - eine Anfrage für alle.
const ownTodos = sharedRequest(listAllOwnTodos)

/** Offene Aufgaben aus allen To-Do-Listen des angemeldeten Benutzers. */
export async function listMyOpenTodos(): Promise<TodoRow[]> {
  return (await ownTodos()).filter((row) => row.status !== 'completed').sort(compareTodos)
}

/** Anlage- und Erledigungszeitpunkte aller eigenen Aufgaben - für den Auslastungsverlauf. */
export async function listMyTodoTimeline(): Promise<TimelineItem[]> {
  return (await ownTodos()).flatMap((row) => timelineItem(row.created, row.status === 'completed' ? (row.completed ?? row.modified) : null))
}
