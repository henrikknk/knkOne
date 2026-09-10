import { useEffect, useState } from 'react'
import { ChartFrame, ColumnChart, type ChartColumn, type ChartSeries } from '../components/charts'
import { ChartToggle, PagedRows, Pill, Row, WidgetEmpty, WidgetFrame, WidgetNotice, WidgetSkeleton } from '../components/Widget'
import type { WidgetProps } from '../components/widgetTypes'
import { useAsyncData } from '../hooks/useAsyncData'
import { usePagedList, type PageLoader } from '../hooks/usePagedList'
import { monthOffset, startOfDay } from '../lib/chartData'
import { daysBetween, formatCompactCurrency, formatCurrency, formatDate, toCalendarDate, type Urgency } from '../lib/format'
import {
  listOwnOpenLeads,
  listOwnOpenOpportunities,
  loadLeadsPage,
  loadOpportunitiesPage,
  loadSalesTotals,
  type SalesCursor,
  type SalesKind,
  type SalesRow,
  type SalesTotals,
} from '../services/sales'

interface SalesItem extends SalesRow {
  /** Tage bis zum geschätzten Abschluss bzw. zur Aktivität, zum Ladezeitpunkt berechnet */
  closeInDays: number | null
  activityInDays: number | null
}

function withDayOffsets(loadPage: PageLoader<SalesRow, SalesCursor>): PageLoader<SalesItem, SalesCursor> {
  return async (cursor) => {
    const page = await loadPage(cursor)
    const today = new Date()
    const offset = (value: string | null) => {
      const date = toCalendarDate(value)
      return date ? daysBetween(today, date) : null
    }
    return { ...page, items: page.items.map((row) => ({ ...row, closeInDays: offset(row.closeDate), activityInDays: offset(row.activityDue) })) }
  }
}

const LOADERS: Record<SalesKind, PageLoader<SalesItem, SalesCursor>> = {
  lead: withDayOffsets(loadLeadsPage),
  opportunity: withDayOffsets(loadOpportunitiesPage),
}

const TABS: Array<{ kind: SalesKind; label: string }> = [
  { kind: 'opportunity', label: 'Verkaufschancen' },
  { kind: 'lead', label: 'Leads' },
]

function salesUrgency(row: SalesItem): Urgency {
  if ((row.closeInDays !== null && row.closeInDays < 0) || (row.activityInDays !== null && row.activityInDays < 0)) return 'critical'
  if (row.closeInDays !== null && row.closeInDays <= 14) return 'warning'
  return 'normal'
}

function SalesList({ kind }: { kind: SalesKind }) {
  const list = usePagedList(LOADERS[kind])
  return (
    <PagedRows
      list={list}
      empty={kind === 'lead' ? 'Keine eigenen offenen Leads' : 'Keine eigenen offenen Verkaufschancen'}
      renderItem={(row) => (
        <Row
          key={row.id}
          urgency={salesUrgency(row)}
          title={row.title}
          href={row.url}
          meta={`${row.customer} · ${row.status}`}
          tags={
            <>
              {row.closeInDays !== null && (
                <Pill tone={row.closeInDays < 0 ? 'critical' : row.closeInDays <= 14 ? 'warning' : 'neutral'}>
                  {row.closeInDays < 0 ? 'Abschluss überfällig' : 'Abschluss'} {formatDate(row.closeDate)}
                </Pill>
              )}
              {row.activityInDays !== null ? (
                <Pill tone={row.activityInDays < 0 ? 'critical' : 'neutral'}>
                  {row.activityInDays < 0 ? 'Aktivität überfällig' : 'Aktivität fällig'} {formatDate(row.activityDue)}
                </Pill>
              ) : (
                <Pill tone="neutral">keine Aktivität</Pill>
              )}
            </>
          }
          aside={<span className="amount">{formatCurrency(row.value)}</span>}
        />
      )}
    />
  )
}

// Dieselben Farben wie im Auslastungsverlauf: Verkaufschancen orange, Leads aqua.
const SALES_SERIES: ChartSeries[] = [
  { id: 'opportunity', label: 'Verkaufschancen', color: 'var(--series-2)' },
  { id: 'lead', label: 'Leads', color: 'var(--series-3)' },
]
const MONTHS_AHEAD = 6

async function loadOpenSales() {
  const [opportunities, leads] = await Promise.all([listOwnOpenOpportunities(), listOwnOpenLeads()])
  return { rows: [...opportunities, ...leads], today: startOfDay(new Date()) }
}

function monthName(date: Date) {
  return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
}

/** Geschätzter Umsatz je erwartetem Abschlussmonat; Überfälliges, Späteres und Undatiertes in eigenen Säulen. */
function salesColumns(rows: SalesRow[], today: Date): ChartColumn[] {
  const bucket = (key: string, label: string, detail: string) => ({
    key,
    label,
    detail,
    values: { opportunity: 0, lead: 0 },
    counts: { opportunity: 0, lead: 0 },
  })
  const overdue = bucket('overdue', 'Überf.', 'Abschluss überfällig')
  const months = Array.from({ length: MONTHS_AHEAD }, (_, index) => {
    const month = new Date(today.getFullYear(), today.getMonth() + index, 1)
    return bucket(`month-${index}`, month.toLocaleDateString('de-DE', { month: 'short' }), `Abschluss ${monthName(month)}`)
  })
  const later = bucket('later', 'Später', `Abschluss ab ${monthName(new Date(today.getFullYear(), today.getMonth() + MONTHS_AHEAD, 1))}`)
  const undated = bucket('undated', 'o. D.', 'Ohne geschätztes Abschlussdatum')

  for (const row of rows) {
    const close = toCalendarDate(row.closeDate)
    const target = !close ? undated : close < today ? overdue : monthOffset(today, close) < MONTHS_AHEAD ? months[monthOffset(today, close)] : later
    target.values[row.kind] += row.value ?? 0
    target.counts[row.kind] += 1
  }

  return [overdue, ...months, later, undated]
    .filter((column) => column.key.startsWith('month-') || column.counts.opportunity + column.counts.lead > 0)
    .map(({ counts, ...column }) => ({ ...column, notes: [`${counts.opportunity} Verkaufschancen · ${counts.lead} Leads`] }))
}

// Diagramm: eigene offene Vorgänge als gestapelte Säulen nach erwartetem Abschlussmonat.
function SalesChart() {
  const data = useAsyncData(loadOpenSales)

  if (data.status === 'loading') return <WidgetSkeleton />
  if (data.status === 'error') return <WidgetNotice kind="offline" text={data.error} onRetry={data.reload} />
  if (data.data.rows.length === 0) return <WidgetEmpty text="Keine eigenen offenen Leads oder Verkaufschancen" />

  const columns = salesColumns(data.data.rows, data.data.today)
  return (
    <ChartFrame
      legend={SALES_SERIES}
      legendShape="rect"
      caption="Geschätzter Umsatz nach erwartetem Abschluss"
      table={{
        columns: ['Abschluss', 'Verkaufschancen', 'Leads', 'Summe'],
        rows: columns.map((column) => ({
          key: column.key,
          cells: [
            column.detail,
            formatCurrency(column.values.opportunity),
            formatCurrency(column.values.lead),
            formatCurrency(column.values.opportunity + column.values.lead),
          ],
        })),
      }}
    >
      <ColumnChart
        series={SALES_SERIES}
        columns={columns}
        formatValue={formatCurrency}
        formatTick={formatCompactCurrency}
        ariaLabel="Geschätzter Umsatz der eigenen offenen Vorgänge nach Abschlussmonat"
      />
    </ChartFrame>
  )
}

// Live-Widget: eigene offene Leads und Verkaufschancen aus Dataverse, mit Gesamtsummen je Kategorie.
export default function VertriebsvorgaengeWidget(props: WidgetProps) {
  const [activeKind, setActiveKind] = useState<SalesKind>('opportunity')
  const [showChart, setShowChart] = useState(false)
  const [totals, setTotals] = useState<Record<SalesKind, SalesTotals> | null>(null)

  useEffect(() => {
    let cancelled = false
    loadSalesTotals()
      .then((result) => {
        if (!cancelled) setTotals(result)
      })
      .catch((error: unknown) => console.error('Vertriebsvorgänge: Summen konnten nicht geladen werden', error))
    return () => {
      cancelled = true
    }
  }, [])

  const overall = totals ? totals.lead.amount + totals.opportunity.amount : null

  return (
    <WidgetFrame
      {...props}
      actions={<ChartToggle active={showChart} onToggle={() => setShowChart((value) => !value)} />}
      badge={
        overall !== null ? (
          <span className="total" title="Summe der geschätzten Umsätze aller eigenen offenen Leads und Verkaufschancen">
            <span className="total-label">Gesamt</span>
            <span className="amount">{formatCurrency(overall)}</span>
          </span>
        ) : undefined
      }
      toolbar={
        showChart ? undefined : (
          <div className="tabs" role="tablist" aria-label="Kategorie">
            {TABS.map((tab) => (
              <button
                key={tab.kind}
                type="button"
                role="tab"
                aria-selected={activeKind === tab.kind}
                className={`tab${activeKind === tab.kind ? ' is-active' : ''}`}
                onClick={() => setActiveKind(tab.kind)}
              >
                <span>{tab.label}</span>
                {totals && (
                  <span className="tab-meta">
                    {totals[tab.kind].count} · {formatCurrency(totals[tab.kind].amount)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )
      }
    >
      {/* key: beim Umschalten neu mounten, damit jede Kategorie ihre eigenen Stapel lädt */}
      {showChart ? <SalesChart /> : <SalesList key={activeKind} kind={activeKind} />}
    </WidgetFrame>
  )
}
