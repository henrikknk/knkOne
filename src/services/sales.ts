import { getContext } from '@microsoft/power-apps/app'
import { Leadsstatuscode } from '../generated/models/LeadsModel'
import { Opportunitiesstatuscode } from '../generated/models/OpportunitiesModel'
import type { Page } from '../hooks/usePagedList'
import { choiceLabel, lookupName } from './Dataverse'
import { activitiesTable, leadsTable, opportunitiesTable, systemUsersTable } from './tables'

export type SalesKind = 'lead' | 'opportunity'

export interface SalesRow {
  id: string
  kind: SalesKind
  title: string
  customer: string
  status: string
  value: number | null
  /** Geschätztes Abschlussdatum */
  closeDate: string | null
  /** Spätestes Fälligkeitsdatum einer offenen Nicht-E-Mail-Aktivität */
  activityDue: string | null
  url?: string
}

export interface SalesTotals {
  count: number
  amount: number
}

/** Zuerst Datensätze mit Abschlussdatum (früheste oben), danach die ohne - Dataverse sortiert null sonst nach vorn. */
export interface SalesCursor {
  phase: 'dated' | 'undated'
  skipToken?: string
}

const PAGE_SIZE = 10
const EMAIL_ACTIVITY_TYPE_CODE = 4202

interface SalesContext {
  userId: string
  orgUrl?: string
}

let contextPromise: Promise<SalesContext> | null = null

async function resolveSalesContext(): Promise<SalesContext> {
  const context = await getContext()
  const aadObjectId = context.user.objectId
  if (!aadObjectId) throw new Error('Keine Azure-AD-Objekt-ID im App-Kontext gefunden')
  const users = await systemUsersTable.getAll({
    select: ['systemuserid'],
    filter: `azureactivedirectoryobjectid eq ${aadObjectId}`,
    top: 1,
  })
  if (!users[0]) throw new Error('Kein Dataverse-Benutzer zur aktuellen Anmeldung gefunden')
  return { userId: users[0].systemuserid, orgUrl: context.app.dataverseOrgUrl }
}

/** Dataverse-Benutzer und Org-URL, einmal pro Sitzung ermittelt. */
function salesContext(): Promise<SalesContext> {
  if (!contextPromise) {
    contextPromise = resolveSalesContext().catch((error: unknown) => {
      contextPromise = null
      throw error
    })
  }
  return contextPromise
}

function ownOpenFilter(userId: string) {
  return `statecode eq 0 and _ownerid_value eq ${userId}`
}

// Direktlink auf den Datensatz im modellgesteuerten CRM.
function crmRecordUrl(orgUrl: string | undefined, entity: string, id: string): string | undefined {
  return orgUrl ? `${orgUrl.replace(/\/$/, '')}/main.aspx?pagetype=entityrecord&etn=${entity}&id=${id}` : undefined
}

// Kein Server-Filter auf activitytypecode: falls der Typ dort als String statt Zahl geführt wird, würde
// "ne 4202" sonst unbemerkt 0 Treffer liefern - daher lokal aussortieren.
async function latestActivityDue(regardingId: string): Promise<string | null> {
  try {
    const activities = await activitiesTable.getAll({
      select: ['activityid', 'scheduledend', 'activitytypecode'],
      filter: `statecode eq 0 and _regardingobjectid_value eq ${regardingId}`,
      orderBy: ['scheduledend desc'],
      top: 10,
    })
    const nonEmail = activities.find(
      (activity) => activity.activitytypecode !== EMAIL_ACTIVITY_TYPE_CODE && String(activity.activitytypecode).toLowerCase() !== 'email',
    )
    return nonEmail?.scheduledend ?? null
  } catch (error) {
    console.error('Vertriebsvorgänge: Aktivitätsabfrage fehlgeschlagen', regardingId, error)
    return null
  }
}

function phaseQuery(userId: string, cursor: SalesCursor) {
  return cursor.phase === 'dated'
    ? { filter: `${ownOpenFilter(userId)} and estimatedclosedate ne null`, orderBy: ['estimatedclosedate asc'] }
    : { filter: `${ownOpenFilter(userId)} and estimatedclosedate eq null`, orderBy: ['modifiedon desc'] }
}

function nextCursor(cursor: SalesCursor, skipToken: string | undefined): SalesCursor | undefined {
  if (skipToken) return { phase: cursor.phase, skipToken }
  return cursor.phase === 'dated' ? { phase: 'undated' } : undefined
}

/** Eigene offene Leads, stapelweise. */
export async function loadLeadsPage(cursor: SalesCursor | undefined): Promise<Page<SalesRow, SalesCursor>> {
  const current = cursor ?? { phase: 'dated' }
  const { userId, orgUrl } = await salesContext()
  const page = await leadsTable.getPage({
    ...phaseQuery(userId, current),
    select: ['leadid', 'subject', 'companyname', 'estimatedvalue', 'estimatedclosedate', 'statuscode'],
    maxPageSize: PAGE_SIZE,
    skipToken: current.skipToken,
  })
  const items = await Promise.all(
    page.records.map(async (lead) => ({
      id: lead.leadid,
      kind: 'lead' as const,
      title: lead.subject || '(ohne Thema)',
      customer: lead.companyname || '–',
      status: choiceLabel(Leadsstatuscode, lead.statuscode) || '–',
      value: lead.estimatedvalue ?? null,
      closeDate: lead.estimatedclosedate ?? null,
      activityDue: await latestActivityDue(lead.leadid),
      url: crmRecordUrl(orgUrl, 'lead', lead.leadid),
    })),
  )
  return { items, next: nextCursor(current, page.skipToken) }
}

/** Eigene offene Verkaufschancen, stapelweise. */
export async function loadOpportunitiesPage(cursor: SalesCursor | undefined): Promise<Page<SalesRow, SalesCursor>> {
  const current = cursor ?? { phase: 'dated' }
  const { userId, orgUrl } = await salesContext()
  const page = await opportunitiesTable.getPage({
    // Kein $select: falsche OData-Feldnamen für den polymorphen Lookup "customerid" führten zu Fehlern.
    ...phaseQuery(userId, current),
    maxPageSize: PAGE_SIZE,
    skipToken: current.skipToken,
  })
  const items = await Promise.all(
    page.records.map(async (opportunity) => ({
      id: opportunity.opportunityid,
      kind: 'opportunity' as const,
      title: opportunity.name || '(ohne Namen)',
      customer: lookupName(opportunity, 'customerid') || '–',
      status: choiceLabel(Opportunitiesstatuscode, opportunity.statuscode) || '–',
      value: opportunity.estimatedvalue ?? null,
      closeDate: opportunity.estimatedclosedate ?? null,
      activityDue: await latestActivityDue(opportunity.opportunityid),
      url: crmRecordUrl(orgUrl, 'opportunity', opportunity.opportunityid),
    })),
  )
  return { items, next: nextCursor(current, page.skipToken) }
}

/** Anzahl und Summe der geschätzten Umsätze aller eigenen offenen Datensätze - unabhängig davon, wie viel angezeigt wird. */
export async function loadSalesTotals(): Promise<Record<SalesKind, SalesTotals>> {
  const { userId } = await salesContext()
  const filter = ownOpenFilter(userId)
  const [leads, opportunities] = await Promise.all([
    leadsTable.getAll({ select: ['leadid', 'estimatedvalue'], filter }),
    opportunitiesTable.getAll({ select: ['opportunityid', 'estimatedvalue'], filter }),
  ])
  const sum = (values: Array<{ estimatedvalue?: number }>) => values.reduce((total, record) => total + (record.estimatedvalue ?? 0), 0)
  return {
    lead: { count: leads.length, amount: sum(leads) },
    opportunity: { count: opportunities.length, amount: sum(opportunities) },
  }
}
