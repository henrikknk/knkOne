import { toCalendarDate } from '../lib/format'
import { sharedRequest } from '../lib/sharedRequest'
import { crmContext } from './crmContext'
import { crmRecordUrl, lookupName } from './Dataverse'
import { activitiesTable } from './tables'

// Aufgaben aus Dynamics 365 kommen per serverseitiger Synchronisierung über Exchange nach To Do - dort ohne CRM-Bezug.
// Der Bezug wird über die offenen CRM-Aufgaben des Benutzers wiederhergestellt.

export interface CrmReference {
  /** Anzeigename des Datensatzes, an dem die Aufgabe hängt */
  name: string
  /** Art des Datensatzes, z. B. „Verkaufschance“ */
  entityLabel: string
  url?: string
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
  reference: CrmReference
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

async function loadOpenCrmTasks(): Promise<CrmTask[]> {
  const { userId, orgUrl } = await crmContext()
  // Kein $select: der polymorphe Lookup „regardingobjectid“ kommt nur mit dem vollständigen Datensatz zuverlässig mit.
  const records = await activitiesTable.getAll({
    filter: `statecode eq 0 and _ownerid_value eq ${userId} and _regardingobjectid_value ne null`,
  })
  return records.filter(isTask).flatMap((record) => {
    const raw = record as unknown as Record<string, unknown>
    const regardingId = typeof raw._regardingobjectid_value === 'string' ? raw._regardingobjectid_value : null
    if (!regardingId) return []
    const logicalName =
      [raw.regardingobjecttypecode, raw['_regardingobjectid_value@Microsoft.Dynamics.CRM.lookuplogicalname']].find(
        (value): value is string => typeof value === 'string' && value !== '',
      ) ?? null
    const name = lookupName(record, 'regardingobjectid')
    const due = toCalendarDate(record.scheduledend)
    return [
      {
        exchangeId: record.exchangeitemid ? exchangeIdKey(record.exchangeitemid) : null,
        subjectKey: subjectKey(record.subject ?? ''),
        dueTime: due ? due.getTime() : null,
        reference: {
          name: name && name !== regardingId ? name : 'Datensatz',
          entityLabel: logicalName ? (ENTITY_LABELS[logicalName] ?? logicalName) : 'CRM',
          url: logicalName ? crmRecordUrl(orgUrl, logicalName, regardingId) : undefined,
        },
      },
    ]
  })
}

const openCrmTasks = sharedRequest(loadOpenCrmTasks, 60_000)

export type CrmTaskMatcher = (task: { id: string; title: string; dueDate: string | null }) => CrmReference | null

/** Ordnet To-Do-Aufgaben ihrer CRM-Aufgabe zu: über die Exchange-ID, sonst über den Betreff. */
export async function loadCrmTaskMatcher(): Promise<CrmTaskMatcher> {
  const tasks = await openCrmTasks()
  const byExchangeId = new Map<string, CrmReference>()
  const bySubject = new Map<string, CrmTask[]>()
  for (const task of tasks) {
    if (task.exchangeId) byExchangeId.set(task.exchangeId, task.reference)
    bySubject.set(task.subjectKey, [...(bySubject.get(task.subjectKey) ?? []), task])
  }

  return (todo) => {
    const direct = byExchangeId.get(exchangeIdKey(todo.id))
    if (direct) return direct
    const candidates = bySubject.get(subjectKey(todo.title)) ?? []
    if (candidates.length <= 1) return candidates[0]?.reference ?? null
    // Mehrere gleichnamige CRM-Aufgaben: nur bei eindeutiger Fälligkeit zuordnen - lieber kein Bezug als ein falscher.
    const due = toCalendarDate(todo.dueDate)?.getTime() ?? null
    const sameDue = candidates.filter((candidate) => candidate.dueTime !== null && candidate.dueTime === due)
    return sameDue.length === 1 ? sameDue[0].reference : null
  }
}
