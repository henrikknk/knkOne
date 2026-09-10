import { choiceLabel, lookupName } from './Dataverse'
import { subscriptionsTable } from './tables'
import { daysBetween, toCalendarDate } from '../lib/format'
import {
  Knk_subscriptionsknk_paymentcyclecode,
  Knk_subscriptionsknk_subscriptionstatuscode,
} from '../generated/models/Knk_subscriptionsModel'

// Tabellen und Felder wie in der modellgesteuerten App „knk365 - Verträge“ (knk_knk365Subscription):
// Vertrag = knk_subscription, Vertragsleistung = knk_subscriptionservice, Vertragsart = knk_contracttype.

export interface ContractRow {
  id: string
  number: string
  name: string
  customer: string
  contractType: string
  status: string
  paymentCycle: string
  startDate: string | null
  /** Mindestlaufzeit bis */
  minimumDurationTo: string | null
  priceProtectionUntil: string | null
  /** Gekündigt zum */
  canceledTo: string | null
  noticePeriodMonthsInt: number | null
  noticePeriodMonthsExt: number | null
  /** Ankündigungsfrist für Konditionsänderungen in Monaten */
  conditionChangeNoticeMonths: number | null
}

export interface ContractDeadline {
  label: string
  date: Date
}

export interface PrioritizedContract {
  contract: ContractRow
  /** Nächste noch nicht abgelaufene Frist, null wenn keine ansteht */
  deadline: ContractDeadline | null
  daysLeft: number | null
  /** Ende der Mindestlaufzeit */
  minimumDurationEnd: Date | null
  /** Spätester Termin, um Konditionsänderungen anzukündigen (Preisschutz-Ende minus Ankündigungsfrist) */
  conditionChangeNoticeBy: Date | null
}

/** Alle aktiven Verträge - bewusst ohne Benutzerfilter, priorisiert wird über die Fristen. */
export async function listActiveContracts(): Promise<ContractRow[]> {
  // Kein $select: die Lookup-Namen (Firma, Vertragsart) kommen nur mit dem vollständigen Datensatz zuverlässig mit.
  const records = await subscriptionsTable.getAll({ filter: 'statecode eq 0' })
  return records.map((record) => ({
    id: record.knk_subscriptionid,
    number: record.knk_no || '',
    name: record.knk_name || record.knk_no || 'Ohne Namen',
    customer: lookupName(record, 'knk_accountid', 'Ohne Firma'),
    contractType: lookupName(record, 'knk_subscriptiontypeid', 'Ohne Vertragsart'),
    status: choiceLabel(Knk_subscriptionsknk_subscriptionstatuscode, record.knk_subscriptionstatuscode) || '–',
    paymentCycle: choiceLabel(Knk_subscriptionsknk_paymentcyclecode, record.knk_paymentcyclecode) || '–',
    startDate: record.knk_startdate ?? null,
    minimumDurationTo: record.knk_minimumdurationto ?? null,
    priceProtectionUntil: record.knk_priceprotectionuntil ?? null,
    canceledTo: record.knk_canceledtodate ?? null,
    noticePeriodMonthsInt: record.knk_noticeperiodinmonthsint ?? null,
    noticePeriodMonthsExt: record.knk_noticeperiodinmonthsext ?? null,
    conditionChangeNoticeMonths: record.knk_noticeperiodforconditionchangesinmonths ?? null,
  }))
}

// Monate abziehen ohne Überlauf am Monatsende: 31.12. minus 3 Monate ergibt 30.09., nicht 01.10.
function subtractMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() - months, 1)
  const lastDayOfMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(date.getDate(), lastDayOfMonth))
  return target
}

function conditionChangeNoticeBy(contract: ContractRow): Date | null {
  const priceProtectionUntil = toCalendarDate(contract.priceProtectionUntil)
  const notice = contract.conditionChangeNoticeMonths
  return priceProtectionUntil && notice !== null ? subtractMonths(priceProtectionUntil, notice) : null
}

/**
 * Alle Fristen eines Vertrags. Kündigungs- und Ankündigungsfristen sind abgeleitet:
 * spätester Termin = Enddatum (Mindestlaufzeit bzw. Preisschutz) minus Frist in Monaten.
 */
export function contractDeadlines(contract: ContractRow): ContractDeadline[] {
  const deadlines: ContractDeadline[] = []
  const canceledTo = toCalendarDate(contract.canceledTo)
  const minimumDurationTo = toCalendarDate(contract.minimumDurationTo)
  const priceProtectionUntil = toCalendarDate(contract.priceProtectionUntil)

  if (canceledTo) deadlines.push({ label: 'Vertragsende (gekündigt)', date: canceledTo })

  if (minimumDurationTo) {
    deadlines.push({ label: 'Mindestlaufzeit endet', date: minimumDurationTo })
    // Nach einer Kündigung laufen keine Kündigungsfristen mehr.
    const ext = contract.noticePeriodMonthsExt
    const int = contract.noticePeriodMonthsInt
    if (!canceledTo && ext !== null) {
      deadlines.push({ label: `Kündigungsfrist ext. (${ext} Mon.) endet`, date: subtractMonths(minimumDurationTo, ext) })
    }
    if (!canceledTo && int !== null) {
      deadlines.push({ label: `Kündigungsfrist int. (${int} Mon.) endet`, date: subtractMonths(minimumDurationTo, int) })
    }
  }

  if (priceProtectionUntil) {
    deadlines.push({ label: 'Preisschutz endet', date: priceProtectionUntil })
    const noticeBy = conditionChangeNoticeBy(contract)
    if (noticeBy) {
      deadlines.push({ label: `Konditionsänderung ankündigen (${contract.conditionChangeNoticeMonths} Mon.)`, date: noticeBy })
    }
  }

  return deadlines
}

/**
 * Verträge nach Dringlichkeit: die nächste noch nicht abgelaufene Frist entscheidet, die früheste steht oben.
 * Verträge ohne anstehende Frist folgen danach, alphabetisch nach Kunde.
 */
export function prioritizeContracts(contracts: ContractRow[], today: Date): PrioritizedContract[] {
  const rows = contracts.map((contract): PrioritizedContract => {
    const upcoming = contractDeadlines(contract)
      .map((deadline) => ({ deadline, daysLeft: daysBetween(today, deadline.date) }))
      .filter((entry) => entry.daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft)[0]
    return {
      contract,
      deadline: upcoming?.deadline ?? null,
      daysLeft: upcoming?.daysLeft ?? null,
      minimumDurationEnd: toCalendarDate(contract.minimumDurationTo),
      conditionChangeNoticeBy: conditionChangeNoticeBy(contract),
    }
  })
  return rows.sort((a, b) => {
    if (a.daysLeft !== null && b.daysLeft !== null) return a.daysLeft - b.daysLeft
    if (a.daysLeft !== null) return -1
    if (b.daysLeft !== null) return 1
    return a.contract.customer.localeCompare(b.contract.customer, 'de')
  })
}
