import { useState } from 'react'
import { ChartFrame, LineChart, type ChartSeries, type LinePoint } from '../components/charts'
import { Pill, TabSwitch, WidgetFrame, WidgetNotice, WidgetSkeleton } from '../components/Widget'
import type { WidgetProps } from '../components/widgetTypes'
import { useAsyncData } from '../hooks/useAsyncData'
import { formatShortDate, openAt, recentWeeks, startOfWeek, type TimelineItem } from '../lib/chartData'
import { listMyIssueTimeline } from '../services/jira'
import { listMyPlannerTimeline } from '../services/planner'
import { listSalesTimeline } from '../services/sales'
import { listMyTodoTimeline } from '../services/todo'

const RANGES = [
  { value: 4, label: '4 Wochen' },
  { value: 12, label: '12 Wochen' },
  { value: 26, label: '6 Monate' },
]
const MAX_WEEKS = 26

// Feste Reihenfolge und Farbe je Datenart - dieselben Farben wie in den Diagrammen der anderen Widgets.
const SERIES: ChartSeries[] = [
  { id: 'tickets', label: 'Tickets', color: 'var(--series-1)' },
  { id: 'opportunities', label: 'Verkaufschancen', color: 'var(--series-2)' },
  { id: 'leads', label: 'Leads', color: 'var(--series-3)' },
  { id: 'tasks', label: 'Aufgaben', color: 'var(--series-4)' },
]

interface WorkloadData {
  items: Partial<Record<string, TimelineItem[]>>
  unavailable: string[]
  loadedAt: Date
}

function valueOrNull<T>(result: PromiseSettledResult<T>, source: string, unavailable: string[]): T | null {
  if (result.status === 'fulfilled') return result.value
  console.error(`Auslastung: ${source} nicht verfügbar`, result.reason)
  unavailable.push(source)
  return null
}

// Jede Quelle einzeln: fällt eine aus, zeigt das Diagramm die übrigen und nennt die fehlende.
async function loadWorkload(): Promise<WorkloadData> {
  const loadedAt = new Date()
  const currentWeek = startOfWeek(loadedAt)
  const since = new Date(currentWeek.getFullYear(), currentWeek.getMonth(), currentWeek.getDate() - (MAX_WEEKS - 1) * 7)
  const [tickets, sales, todos, planner] = await Promise.allSettled([
    listMyIssueTimeline(since),
    listSalesTimeline(since),
    listMyTodoTimeline(),
    listMyPlannerTimeline(),
  ])

  const unavailable: string[] = []
  const items: WorkloadData['items'] = {}
  const ticketItems = valueOrNull(tickets, 'Jira', unavailable)
  if (ticketItems) items.tickets = ticketItems
  const salesItems = valueOrNull(sales, 'Dynamics 365', unavailable)
  if (salesItems) {
    items.opportunities = salesItems.opportunity
    items.leads = salesItems.lead
  }
  const todoItems = valueOrNull(todos, 'To-Do', unavailable)
  const plannerItems = valueOrNull(planner, 'Planner', unavailable)
  if (todoItems || plannerItems) items.tasks = [...(todoItems ?? []), ...(plannerItems ?? [])]

  if (Object.keys(items).length === 0) throw new Error('Keine der Datenquellen für die Auslastung ist erreichbar')
  return { items, unavailable, loadedAt }
}

// Live-Widget: wie viele Tickets, Verkaufschancen, Leads und Aufgaben Woche für Woche offen waren.
export default function AuslastungWidget(props: WidgetProps) {
  const data = useAsyncData(loadWorkload)
  const [weeks, setWeeks] = useState(12)

  const toolbar = <TabSwitch label="Zeitraum" options={RANGES} value={weeks} onChange={setWeeks} />

  if (data.status !== 'ready') {
    return (
      <WidgetFrame {...props} toolbar={toolbar}>
        {data.status === 'loading' ? <WidgetSkeleton /> : <WidgetNotice kind="offline" text={data.error} onRetry={data.reload} />}
      </WidgetFrame>
    )
  }

  const { items, unavailable, loadedAt } = data.data
  const visible = SERIES.filter((series) => items[series.id])
  const weekList = recentWeeks(weeks, loadedAt)
  const points: LinePoint[] = weekList.map((week, index) => ({
    key: week.start.toISOString(),
    label: formatShortDate(week.start),
    detail:
      index === weekList.length - 1
        ? `KW ${week.number} · ab ${formatShortDate(week.start)} (Stand heute)`
        : `KW ${week.number} · ${formatShortDate(week.start)}–${formatShortDate(week.lastDay)}`,
    values: Object.fromEntries(visible.map((series) => [series.id, openAt(items[series.id] ?? [], week.end)])),
  }))
  const latest = points[points.length - 1]
  const openNow = visible.reduce((sum, series) => sum + (latest?.values[series.id] ?? 0), 0)
  const caption = [
    'Offene Einträge je Kalenderwoche, jeweils zum Wochenende',
    unavailable.length > 0 ? `nicht verfügbar: ${unavailable.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <WidgetFrame {...props} toolbar={toolbar} badge={<Pill tone="info">{openNow} offen</Pill>}>
      <ChartFrame
        legend={visible}
        caption={caption}
        table={{
          columns: ['Woche', ...visible.map((series) => series.label)],
          rows: points.map((point) => ({ key: point.key, cells: [point.detail, ...visible.map((series) => point.values[series.id] ?? 0)] })),
        }}
      >
        <LineChart series={visible} points={points} ariaLabel={`Offene Einträge der letzten ${weeks} Wochen`} />
      </ChartFrame>
    </WidgetFrame>
  )
}
