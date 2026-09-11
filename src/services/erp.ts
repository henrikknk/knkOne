import { monthKey } from '../lib/chartData'

// Business Central ist noch nicht angebunden (dem Konto fehlt dort der Zugriff) - bis dahin liefert dieses Modul Beispieldaten.
// Beim Anbinden nur loadErpBudgets ersetzen und ERP_SAMPLE_DATA auf false setzen; Datentypen und Widget bleiben.
export const ERP_SAMPLE_DATA = true

export interface BillingPosition {
  /** Art der abgerechneten Leistung, z. B. „Change Request“ */
  kind: string
  count: number
  amount: number
}

export interface Retainer {
  amount: number
  /** Davon bereits abgerechnet */
  used: number
  /** Zeitraum als YYYY-MM-DD */
  periodStart: string
  periodEnd: string
}

export interface ExistingCustomerBilling {
  customer: string
  /** Im laufenden Jahr abgerechnete Leistungen */
  positions: BillingPosition[]
  /** null: Abrechnung nach Aufwand ohne Budget */
  retainer: Retainer | null
}

export interface NewCustomerProject {
  id: string
  customer: string
  name: string
  budget: number
  /** Erster Projektmonat als YYYY-MM */
  start: string
  /** Laufzeit in Monaten */
  months: number
  /** Abgerechnete Beträge je Monat (YYYY-MM) */
  invoices: Record<string, number>
}

export interface ErpBudgets {
  today: Date
  existingCustomers: ExistingCustomerBilling[]
  newProjects: NewCustomerProject[]
}

function sampleExistingCustomers(year: number): ExistingCustomerBilling[] {
  const fullYear = (amount: number, used: number): Retainer => ({ amount, used, periodStart: `${year}-01-01`, periodEnd: `${year}-12-31` })
  return [
    {
      customer: 'Heise Medien',
      positions: [
        { kind: 'Change Request', count: 9, amount: 38_400 },
        { kind: 'Support', count: 14, amount: 12_600 },
      ],
      retainer: fullYear(60_000, 41_800),
    },
    {
      customer: 'Haufe-Lexware',
      positions: [
        { kind: 'Change Request', count: 6, amount: 29_500 },
        { kind: 'Beratung', count: 4, amount: 8_200 },
      ],
      retainer: fullYear(36_000, 34_900),
    },
    {
      customer: 'WEKA Media',
      positions: [
        { kind: 'Change Request', count: 8, amount: 26_300 },
        { kind: 'Support', count: 3, amount: 1_900 },
      ],
      retainer: fullYear(24_000, 26_300),
    },
    {
      customer: 'Deutscher Landwirtschaftsverlag',
      positions: [
        { kind: 'Change Request', count: 7, amount: 24_600 },
        { kind: 'Beratung', count: 2, amount: 3_100 },
      ],
      retainer: null,
    },
    {
      customer: 'Holzmann Medien',
      positions: [
        { kind: 'Change Request', count: 5, amount: 18_750 },
        { kind: 'Support', count: 2, amount: 1_400 },
      ],
      retainer: null,
    },
    { customer: 'Vincentz Network', positions: [{ kind: 'Change Request', count: 3, amount: 11_200 }], retainer: null },
    { customer: 'Beltz', positions: [{ kind: 'Support', count: 6, amount: 4_300 }], retainer: null },
  ]
}

/** Beispielprojekt relativ zum aktuellen Monat; `factors` sind die Abrechnungen je Monat im Verhältnis zum Monatsbudget. */
function sampleProject(today: Date, id: string, customer: string, name: string, budget: number, startOffset: number, months: number, factors: number[]): NewCustomerProject {
  const start = new Date(today.getFullYear(), today.getMonth() + startOffset, 1)
  const perMonth = budget / months
  const invoices = Object.fromEntries(
    factors.map((factor, index) => [monthKey(new Date(start.getFullYear(), start.getMonth() + index, 1)), Math.round((perMonth * factor) / 100) * 100]),
  )
  return { id, customer, name, budget, start: monthKey(start), months, invoices }
}

function sampleNewProjects(today: Date): NewCustomerProject[] {
  return [
    sampleProject(today, 'hjr-crm', 'HJR', 'CRM-Einführung', 180_000, -7, 10, [0.5, 0.9, 1.2, 1, 1.3, 1.1, 0.8, 1]),
    sampleProject(today, 'cia-portal', 'Cluster Industry and Automotive', 'Kundenportal', 95_000, -3, 8, [0.8, 1.6, 1.9, 1.4]),
    sampleProject(today, 'vn-abo', 'Vincentz Network', 'Abo-Migration', 140_000, -10, 12, [0.3, 0.5, 0.6, 0.7, 0.8, 0.9, 0.8, 0.7, 0.6, 0.7, 0.5]),
  ]
}

/** Abrechnungen der Bestandskunden und Budgets der Neukundenprojekte - derzeit Beispieldaten. */
export async function loadErpBudgets(): Promise<ErpBudgets> {
  const today = new Date()
  return { today, existingCustomers: sampleExistingCustomers(today.getFullYear()), newProjects: sampleNewProjects(today) }
}
