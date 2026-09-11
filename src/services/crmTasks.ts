import { toCalendarDate } from '../lib/format'
import { sharedRequest } from '../lib/sharedRequest'
import { crmContext } from './crmContext'
import { crmRecordUrl, lookupName } from './Dataverse'
import { activitiesTable } from './tables'

// Aufgaben aus Dynamics 365 kommen per serverseitiger Synchronisierung über Exchange nach To Do - dort ohne CRM-Bezug.
// Über die offenen CRM-Aufgaben des Benutzers werden Absprung zur Aufgabe und Bezug wiederhergestellt.

export interface CrmReference {
  /** Anzeigename des Datensatzes, an dem die Aufgabe hängt */
  name: string
  /** Art des Datensatzes, z. B. „Verkaufschance“ */
  entityLabel: string
  url?: string
}

export interface CrmTaskInfo {
  /** Direktlink auf die Aufgabe im CRM */
  url?: string
  /** Datensatz, an dem die Aufgabe hängt - null, wenn kein Bezug gesetzt ist */
  regarding: CrmReference | null
}

const TASK_TYPE_CODE = 4212

const ENTITY_LABELS: Record<string, string> = {
  account: 'Firma',
  contact: 'Kontakt',
  lead: 'Lead',
  opportunity: 'Verkaufschance',
  incident: 'Fall',
  quote: 'Angebot',
  salesorder: 'Auftrag',
  invoice: 'Rechnung',
  campaign: 'Kampagne',
  knk_subscription: 'Vertrag',
}

interface CrmTask {
  exchangeId: string | null
  subjectKey: string
  dueTime: number | null
  info: CrmTaskInfo
}

function subjectKey(subject: string) {
  return subject.trim().replace(/\s+/g, ' ').toLocaleLowerCase('de-DE')
}

// EWS liefert Standard-Base64 (+ und /), Graph die URL-sichere Variante (_ und -) derselben Exchange-ID.
function exchangeIdKey(id: string) {
  return id.replace(/-/g, '/').replace(/_/g, '+')
}

// Wie bei den Vertriebsvorgängen kein Server-Filter auf den Typ - er kommt je nach Runtime als Zahl oder Name.
function isTask(record: { activitytypecode?: unknown }) {
  return Number(record.activitytypecode) === TASK_TYPE_CODE || String(record.activitytypecode).toLowerCase() === 'task'
}

function regardingReference(raw: Record<string, unknown>, orgUrl: string | undefined): CrmReference | null {
  const regardingId = typeof raw._regardingobjectid_value === 'string' ? raw._regardingobjectid_value : null
  if (!regardingId) return null
  const logicalName =
    [raw.regardingobjecttypecode, raw['_regardingobjectid_value@Microsoft.Dynamics.CRM.lookuplogicalname']].find(
      (value): value is string => typeof value === 'string' && value !== '',
    ) ?? null
  const name = lookupName(raw, 'regardingobjectid')
  return {
    name: name && name !== regardingId ? name : 'Datensatz',
    entityLabel: logicalName ? (ENTITY_LABELS[logicalName] ?? logicalName) : 'CRM',
    url: logicalName ? crmRecordUrl(orgUrl, logicalName, regardingId) : undefined,
  }
}

async function loadOpenCrmTasks(): Promise<CrmTask[]> {
  const { userId, orgUrl } = await crmContext()
  // Kein $select: der polymorphe Lookup „regardingobjectid“ kommt nur mit dem vollständigen Datensatz zuverlässig mit.
  const records = await activitiesTable.getAll({ filter: `statecode eq 0 and _ownerid_value eq ${userId}` })
  return records.filter(isTask).map((record) => {
    const due = toCalendarDate(record.scheduledend)
    return {
      exchangeId: record.exchangeitemid ? exchangeIdKey(record.exchangeitemid) : null,
      subjectKey: subjectKey(record.subject ?? ''),
      dueTime: due ? due.getTime() : null,
      info: {
        url: crmRecordUrl(orgUrl, 'task', record.activityid),
        regarding: regardingReference(record as unknown as Record<string, unknown>, orgUrl),
      },
    }
  })
}

const openCrmTasks = sharedRequest(loadOpenCrmTasks, 60_000)

export type CrmTaskMatcher = (task: { id: string; title: string; dueDate: string | null }) => CrmTaskInfo | null

/** Ordnet To-Do-Aufgaben ihrer CRM-Aufgabe zu: über die Exchange-ID, sonst über den Betreff. */
export async function loadCrmTaskMatcher(): Promise<CrmTaskMatcher> {
  const tasks = await openCrmTasks()
  const byExchangeId = new Map<string, CrmTaskInfo>()
  const bySubject = new Map<string, CrmTask[]>()
  for (const task of tasks) {
    if (task.exchangeId) byExchangeId.set(task.exchangeId, task.info)
    bySubject.set(task.subjectKey, [...(bySubject.get(task.subjectKey) ?? []), task])
  }

  return (todo) => {
    const direct = byExchangeId.get(exchangeIdKey(todo.id))
    if (direct) return direct
    const candidates = bySubject.get(subjectKey(todo.title)) ?? []
    if (candidates.length <= 1) return candidates[0]?.info ?? null
    // Mehrere gleichnamige CRM-Aufgaben: nur bei eindeutiger Fälligkeit zuordnen - lieber kein Absprung als ein falscher.
    const due = toCalendarDate(todo.dueDate)?.getTime() ?? null
    const sameDue = candidates.filter((candidate) => candidate.dueTime !== null && candidate.dueTime === due)
    return sameDue.length === 1 ? sameDue[0].info : null
  }
}
