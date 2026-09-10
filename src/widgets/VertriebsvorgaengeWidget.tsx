import { useEffect, useState } from 'react'
import { PagedRows, Pill, Row, WidgetFrame } from '../components/Widget'
import type { WidgetProps } from '../components/widgetTypes'
import { usePagedList, type PageLoader } from '../hooks/usePagedList'
import { daysBetween, formatCurrency, formatDate, toCalendarDate, type Urgency } from '../lib/format'
import {
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
  { kind: 'lead', label: 'Leads' },
  { kind: 'opportunity', label: 'Verkaufschancen' },
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

// Live-Widget: eigene offene Leads und Verkaufschancen aus Dataverse, mit Gesamtsummen je Kategorie.
export default function VertriebsvorgaengeWidget(props: WidgetProps) {
  const [activeKind, setActiveKind] = useState<SalesKind>('lead')
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
      badge={
        overall !== null ? (
          <span className="total" title="Summe der geschätzten Umsätze aller eigenen offenen Leads und Verkaufschancen">
            <span className="total-label">Gesamt</span>
            <span className="amount">{formatCurrency(overall)}</span>
          </span>
        ) : undefined
      }
      toolbar={
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
      }
    >
      {/* key: beim Umschalten neu mounten, damit jede Kategorie ihre eigenen Stapel lädt */}
      <SalesList key={activeKind} kind={activeKind} />
    </WidgetFrame>
  )
}
