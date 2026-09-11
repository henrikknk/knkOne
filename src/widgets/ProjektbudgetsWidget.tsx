import { useState } from 'react'
import { BudgetMeter, ChartFrame, LineChart, type ChartSeries, type LinePoint } from '../components/charts'
import { Pill, Row, TabSwitch, WidgetEmpty, WidgetFrame, WidgetNotice, WidgetSkeleton } from '../components/Widget'
import type { WidgetProps } from '../components/widgetTypes'
import { useAsyncData } from '../hooks/useAsyncData'
import { budgetState, monthKey, periodShare } from '../lib/chartData'
import { formatCompactCurrency, formatCurrency, formatDate, type Urgency } from '../lib/format'
import { ERP_SAMPLE_DATA, loadErpBudgets, type ExistingCustomerBilling, type NewCustomerProject } from '../services/erp'

type BudgetTab = 'existing' | 'new'

const TABS: Array<{ value: BudgetTab; label: string }> = [
  { value: 'existing', label: 'Bestandskunden' },
  { value: 'new', label: 'Neukundenprojekte' },
]

// Hervorhebung statt Kategorie: das Abgerechnete in der Grundfarbe, das Soll als graue Referenzlinie darunter.
const PROJECT_SERIES: ChartSeries[] = [
  { id: 'plan', label: 'Budget nach Laufzeit', color: 'var(--text-subtle)' },
  { id: 'billed', label: 'Abgerechnet', color: 'var(--brand)' },
]

function urgencyFor(used: number, budget: number, expectedShare: number | null): Urgency {
  const state = budgetState(used, budget, expectedShare)
  return state === 'over' ? 'critical' : state === 'ahead' ? 'warning' : 'normal'
}

function billedTotal(customer: ExistingCustomerBilling) {
  return customer.positions.reduce((sum, position) => sum + position.amount, 0)
}

// ---------- Bestandskunden: Abrechnung nach Aufwand, teils gegen einen Retainer ----------

function ExistingCustomers({ customers, today }: { customers: ExistingCustomerBilling[]; today: Date }) {
  if (customers.length === 0) return <WidgetEmpty text="Keine Abrechnungen im laufenden Jahr" />

  // Kunden mit Retainer zuerst (am stärksten ausgeschöpft oben), danach nach abgerechnetem Betrag.
  const sorted = [...customers].sort((a, b) => {
    if (a.retainer && b.retainer) return b.retainer.used / b.retainer.amount - a.retainer.used / a.retainer.amount
    if (a.retainer) return -1
    if (b.retainer) return 1
    return billedTotal(b) - billedTotal(a)
  })
  const total = customers.reduce((sum, customer) => sum + billedTotal(customer), 0)
  const retainers = customers.flatMap((customer) => (customer.retainer ? [customer.retainer] : []))
  const retainerUsed = retainers.reduce((sum, retainer) => sum + retainer.used, 0)
  const retainerAmount = retainers.reduce((sum, retainer) => sum + retainer.amount, 0)

  return (
    <>
      <p className="budget-summary">
        Abgerechnet {today.getFullYear()}: <strong>{formatCurrency(total)}</strong>
        {retainers.length > 0 && (
          <>
            {' · '}Retainer ({retainers.length}): <strong>{formatCurrency(retainerUsed)}</strong> von {formatCurrency(retainerAmount)} genutzt
          </>
        )}
      </p>
      <ul className="rows">
        {sorted.map((customer) => {
          const { retainer } = customer
          const expectedShare = retainer ? periodShare(new Date(retainer.periodStart), new Date(retainer.periodEnd), today) : null
          return (
            <Row
              key={customer.customer}
              urgency={retainer ? urgencyFor(retainer.used, retainer.amount, expectedShare) : 'normal'}
              title={customer.customer}
              meta={customer.positions.map((position) => `${position.count} × ${position.kind}`).join(' · ')}
              aside={<span className="amount">{formatCurrency(billedTotal(customer))}</span>}
              details={
                retainer ? (
                  <BudgetMeter
                    label={`Retainer ${formatDate(retainer.periodStart)}–${formatDate(retainer.periodEnd)}`}
                    used={retainer.used}
                    budget={retainer.amount}
                    expectedShare={expectedShare}
                    formatValue={formatCurrency}
                  />
                ) : (
                  <span className="budget-note">Ohne Budget · Abrechnung nach Aufwand</span>
                )
              }
            />
          )
        })}
      </ul>
    </>
  )
}

// ---------- Neukundenprojekte: Abgerechnetes gegen das Budget, verteilt auf die Laufzeit ----------

interface ProjectTimeline {
  points: LinePoint[]
  /** Index des aktuellen Monats, -1 außerhalb der Laufzeit */
  todayIndex: number
  billed: number
  expectedShare: number
  period: string
}

function projectTimeline(project: NewCustomerProject, today: Date): ProjectTimeline {
  const [year, month] = project.start.split('-').map(Number)
  const months = Array.from({ length: project.months }, (_, index) => new Date(year, month - 1 + index, 1))
  const end = new Date(year, month - 1 + project.months, 1)
  const todayIndex = months.findIndex((date) => date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth())
  const lastBilledIndex = today >= end ? months.length - 1 : todayIndex
  const label = (date: Date) => date.toLocaleDateString('de-DE', { month: '2-digit', year: '2-digit' })

  let plan = 0
  let billed = 0
  const points = months.map((date, index) => {
    // Budget gleichmäßig auf die Laufzeit verteilt; Abgerechnetes nur bis zum aktuellen Monat.
    plan += project.budget / project.months
    billed += project.invoices[monthKey(date)] ?? 0
    return {
      key: monthKey(date),
      label: label(date),
      detail: date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
      values: { plan: Math.round(plan), billed: index <= lastBilledIndex ? billed : null },
    }
  })

  return {
    points,
    todayIndex,
    billed: Object.values(project.invoices).reduce((sum, amount) => sum + amount, 0),
    expectedShare: periodShare(months[0], end, today),
    period: months.length > 0 ? `${label(months[0])}–${label(months[months.length - 1])}` : '',
  }
}

function NewProjects({
  projects,
  today,
  selectedId,
  onSelect,
}: {
  projects: NewCustomerProject[]
  today: Date
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  if (projects.length === 0) return <WidgetEmpty text="Keine laufenden Neukundenprojekte" />

  const entries = projects.map((project) => ({ project, timeline: projectTimeline(project, today) }))
  const { project, timeline } = entries.find((entry) => entry.project.id === selectedId) ?? entries[0]
  const expected = project.budget * timeline.expectedShare

  return (
    <div className="budget-split">
      <ul className="budget-projects" aria-label="Neukundenprojekte">
        {entries.map((entry) => {
          const selected = entry.project.id === project.id
          return (
            <li key={entry.project.id}>
              <button type="button" className={`budget-project${selected ? ' is-selected' : ''}`} aria-pressed={selected} onClick={() => onSelect(entry.project.id)}>
                <span className="budget-project-title">
                  {entry.project.customer} · {entry.project.name}
                </span>
                <span className="budget-project-meta">Laufzeit {entry.timeline.period}</span>
                <BudgetMeter
                  label="Abgerechnet"
                  used={entry.timeline.billed}
                  budget={entry.project.budget}
                  expectedShare={entry.timeline.expectedShare}
                  formatValue={formatCompactCurrency}
                />
              </button>
            </li>
          )
        })}
      </ul>

      <div className="budget-chart">
        <div className="budget-chart-head">
          <strong>
            {project.customer} · {project.name}
          </strong>
          <span>
            Budget {formatCurrency(project.budget)} · Laufzeit {timeline.period}
          </span>
        </div>
        <ChartFrame
          legend={PROJECT_SERIES}
          caption={`Abgerechnet ${formatCurrency(timeline.billed)} · Soll heute ${formatCurrency(expected)}`}
          table={{
            columns: ['Monat', 'Budget nach Laufzeit', 'Abgerechnet'],
            rows: timeline.points.map((point) => ({
              key: point.key,
              cells: [point.detail, formatCurrency(point.values.plan), point.values.billed === null ? '–' : formatCurrency(point.values.billed)],
            })),
          }}
        >
          <LineChart
            series={PROJECT_SERIES}
            points={timeline.points}
            formatValue={formatCurrency}
            formatTick={formatCompactCurrency}
            marker={timeline.todayIndex >= 0 ? { index: timeline.todayIndex, label: 'heute' } : undefined}
            ariaLabel={`Abgerechnet gegenüber dem Budget nach Laufzeit: ${project.customer} · ${project.name}`}
          />
        </ChartFrame>
      </div>
    </div>
  )
}

// ERP-Widget für die Projektleitung: Budgetausschöpfung je Kunde bzw. Projekt aus Business Central (derzeit Beispieldaten).
export default function ProjektbudgetsWidget(props: WidgetProps) {
  const [tab, setTab] = useState<BudgetTab>('existing')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const data = useAsyncData(loadErpBudgets)

  return (
    <WidgetFrame
      {...props}
      badge={
        ERP_SAMPLE_DATA ? (
          <Pill tone="neutral" title="Business Central ist noch nicht angebunden - die Zahlen sind erfunden">
            Beispieldaten
          </Pill>
        ) : undefined
      }
      toolbar={<TabSwitch label="Kundenart" options={TABS} value={tab} onChange={setTab} />}
    >
      {data.status === 'loading' ? (
        <WidgetSkeleton />
      ) : data.status === 'error' ? (
        <WidgetNotice kind="offline" text={data.error} onRetry={data.reload} />
      ) : tab === 'existing' ? (
        <ExistingCustomers customers={data.data.existingCustomers} today={data.data.today} />
      ) : (
        <NewProjects projects={data.data.newProjects} today={data.data.today} selectedId={selectedProjectId} onSelect={setSelectedProjectId} />
      )}
    </WidgetFrame>
  )
}
