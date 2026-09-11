import { Leadsstatuscode, type Leads } from '../generated/models/LeadsModel'
import { Opportunitiesstatuscode, type Opportunities } from '../generated/models/OpportunitiesModel'
import type { Page } from '../hooks/usePagedList'
import { timelineItem, type TimelineItem } from '../lib/chartData'
import { crmContext } from './crmContext'
import { choiceLabel, crmRecordUrl, lookupName } from './Dataverse'
import { activitiesTable, leadsTable, opportunitiesTable } from './tables'

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

function ownOpenFilter(userId: string) {
  return `statecode eq 0 and _ownerid_value eq ${userId}`
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

const LEAD_FIELDS = ['leadid', 'subject', 'companyname', 'estimatedvalue', 'estimatedclosedate', 'statuscode']

function toLeadRow(lead: Leads, orgUrl: string | undefined, activityDue: string | null): SalesRow {
  return {
    id: lead.leadid,
    kind: 'lead',
    title: lead.subject || '(ohne Thema)',
    customer: lead.companyname || '–',
    status: choiceLabel(Leadsstatuscode, lead.statuscode) || '–',
    value: lead.estimatedvalue ?? null,
    closeDate: lead.estimatedclosedate ?? null,
    activityDue,
    url: crmRecordUrl(orgUrl, 'lead', lead.leadid),
  }
}

function toOpportunityRow(opportunity: Opportunities, orgUrl: string | undefined, activityDue: string | null): SalesRow {
  return {
    id: opportunity.opportunityid,
    kind: 'opportunity',
    title: opportunity.name || '(ohne Namen)',
    customer: lookupName(opportunity, 'customerid') || '–',
    status: choiceLabel(Opportunitiesstatuscode, opportunity.statuscode) || '–',
    value: opportunity.estimatedvalue ?? null,
    closeDate: opportunity.estimatedclosedate ?? null,
    activityDue,
    url: crmRecordUrl(orgUrl, 'opportunity', opportunity.opportunityid),
  }
}

/** Eigene offene Leads, stapelweise. */
export async function loadLeadsPage(cursor: SalesCursor | undefined): Promise<Page<SalesRow, SalesCursor>> {
  const current = cursor ?? { phase: 'dated' }
  const { userId, orgUrl } = await crmContext()
  const page = await leadsTable.getPage({
    ...phaseQuery(userId, current),
    select: LEAD_FIELDS,
    maxPageSize: PAGE_SIZE,
    skipToken: current.skipToken,
  })
  const items = await Promise.all(page.records.map(async (lead) => toLeadRow(lead, orgUrl, await latestActivityDue(lead.leadid))))
  return { items, next: nextCursor(current, page.skipToken) }
}

/** Eigene offene Verkaufschancen, stapelweise. */
export async function loadOpportunitiesPage(cursor: SalesCursor | undefined): Promise<Page<SalesRow, SalesCursor>> {
  const current = cursor ?? { phase: 'dated' }
  const { userId, orgUrl } = await crmContext()
  const page = await opportunitiesTable.getPage({
    // Kein $select: falsche OData-Feldnamen für den polymorphen Lookup "customerid" führten zu Fehlern.
    ...phaseQuery(userId, current),
    maxPageSize: PAGE_SIZE,
    skipToken: current.skipToken,
  })
  const items = await Promise.all(
    page.records.map(async (opportunity) => toOpportunityRow(opportunity, orgUrl, await latestActivityDue(opportunity.opportunityid))),
  )
  return { items, next: nextCursor(current, page.skipToken) }
}

/** Alle eigenen offenen Leads auf einmal, ohne Aktivitätsabfrage - für die Suche. */
export async function listOwnOpenLeads(): Promise<SalesRow[]> {
  const { userId, orgUrl } = await crmContext()
  const leads = await leadsTable.getAll({ select: LEAD_FIELDS, filter: ownOpenFilter(userId) })
  return leads.map((lead) => toLeadRow(lead, orgUrl, null))
}

/** Alle eigenen offenen Verkaufschancen auf einmal, ohne Aktivitätsabfrage - für die Suche. */
export async function listOwnOpenOpportunities(): Promise<SalesRow[]> {
  const { userId, orgUrl } = await crmContext()
  const opportunities = await opportunitiesTable.getAll({ filter: ownOpenFilter(userId) })
  return opportunities.map((opportunity) => toOpportunityRow(opportunity, orgUrl, null))
}

/** Eigene Leads und Verkaufschancen mit Anlage- und Abschlusszeitpunkt, soweit sie seit `since` offen waren - für den Auslastungsverlauf. */
export async function listSalesTimeline(since: Date): Promise<Record<SalesKind, TimelineItem[]>> {
  const { userId } = await crmContext()
  // Geschlossene Datensätze nur, wenn sie seit Beginn des Zeitraums geändert - also frühestens dann geschlossen - wurden.
  const filter = `_ownerid_value eq ${userId} and (statecode eq 0 or modifiedon ge ${since.toISOString()})`
  const [leads, opportunities] = await Promise.all([
    leadsTable.getAll({ select: ['leadid', 'createdon', 'modifiedon', 'statecode'], filter }),
    opportunitiesTable.getAll({ select: ['opportunityid', 'createdon', 'modifiedon', 'actualclosedate', 'statecode'], filter }),
  ])
  return {
    // Leads haben kein Abschlussdatum - bei geschlossenen gilt die letzte Änderung als Abschluss.
    lead: leads.flatMap((lead) => timelineItem(lead.createdon, Number(lead.statecode) === 0 ? null : lead.modifiedon)),
    opportunity: opportunities.flatMap((opportunity) =>
      timelineItem(opportunity.createdon, Number(opportunity.statecode) === 0 ? null : (opportunity.actualclosedate ?? opportunity.modifiedon)),
    ),
  }
}

/** Anzahl und Summe der geschätzten Umsätze aller eigenen offenen Datensätze - unabhängig davon, wie viel angezeigt wird. */
export async function loadSalesTotals(): Promise<Record<SalesKind, SalesTotals>> {
  const { userId } = await crmContext()
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
