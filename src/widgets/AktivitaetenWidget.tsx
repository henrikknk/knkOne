import { useState } from 'react'
import { ChartFrame, ColumnChart, type ChartColumn, type ChartSeries } from '../components/charts'
import { ChartToggle, PagedRows, Pill, Row, TabSwitch, WidgetEmpty, WidgetFrame, WidgetNotice, WidgetSkeleton } from '../components/Widget'
import type { WidgetProps } from '../components/widgetTypes'
import { useAsyncData } from '../hooks/useAsyncData'
import { pagesFromAll, usePagedList } from '../hooks/usePagedList'
import { formatShortDate, startOfDay } from '../lib/chartData'
import { daysBetween, formatDate, toCalendarDate, type Urgency } from '../lib/format'
import { loadCrmTaskMatcher, type CrmReference } from '../services/crmTasks'
import { listMyPlannerTasks, type PlannerTaskRow } from '../services/planner'
import { listMyOpenTodos, type TodoRow } from '../services/todo'

type TaskTab = 'myday' | 'todo' | 'planner'

const TABS: Array<{ value: TaskTab; label: string }> = [
  { value: 'myday', label: 'Mein Tag' },
  { value: 'todo', label: 'Aufgaben' },
  { value: 'planner', label: 'Mir zugewiesen' },
]

interface DueInfo {
  dueDate: string | null
  /** Tage bis zur Fälligkeit, zum Ladezeitpunkt berechnet */
  dueInDays: number | null
}

type TodoItem = TodoRow &
  DueInfo & {
    source: 'todo'
    /** Tage bis zur Erinnerung, zum Ladezeitpunkt berechnet */
    reminderInDays: number | null
    /** CRM-Datensatz, an dem die per Exchange synchronisierte Aufgabe hängt */
    crm: CrmReference | null
  }
type PlannerItem = PlannerTaskRow & DueInfo & { source: 'planner' }
type TaskItem = TodoItem | PlannerItem

function offsetFromToday(value: string | null) {
  const date = toCalendarDate(value)
  return date ? daysBetween(new Date(), date) : null
}

async function loadTodoItems(): Promise<TodoItem[]> {
  const [rows, matcher] = await Promise.all([
    listMyOpenTodos(),
    // Ohne CRM-Zugriff fehlen nur die Bezüge - die Aufgaben trotzdem anzeigen.
    loadCrmTaskMatcher().catch((error: unknown) => {
      console.error('Aufgaben: CRM-Bezüge konnten nicht geladen werden', error)
      return null
    }),
  ])
  return rows.map((row) => ({
    ...row,
    source: 'todo' as const,
    dueInDays: offsetFromToday(row.dueDate),
    reminderInDays: offsetFromToday(row.reminder),
    // Exchange synchronisiert CRM-Aufgaben nur in die Standardliste.
    crm: matcher && row.defaultList ? matcher(row) : null,
  }))
}

async function loadPlannerItems(): Promise<PlannerItem[]> {
  return (await listMyPlannerTasks()).map((row) => ({ ...row, source: 'planner' as const, dueInDays: offsetFromToday(row.dueDate) }))
}

// „Mein Tag“ selbst gibt die Schnittstelle nicht her - angenähert wie die Vorschläge in To Do:
// heute fällig, überfällig oder mit Erinnerung für heute.
function belongsToMyDay(item: TaskItem) {
  return (item.dueInDays !== null && item.dueInDays <= 0) || (item.source === 'todo' && item.reminderInDays === 0)
}

// Überfälliges zuerst (älteste oben), dann heute Fälliges, zuletzt Aufgaben, die nur eine Erinnerung für heute haben.
function compareMyDay(a: TaskItem, b: TaskItem) {
  if (a.dueInDays !== null && b.dueInDays !== null) return a.dueInDays - b.dueInDays || a.title.localeCompare(b.title, 'de')
  if (a.dueInDays !== null) return -1
  if (b.dueInDays !== null) return 1
  return a.title.localeCompare(b.title, 'de')
}

async function loadMyDayItems(): Promise<TaskItem[]> {
  const [todos, planner] = await Promise.allSettled([loadTodoItems(), loadPlannerItems()])
  if (todos.status === 'rejected' && planner.status === 'rejected') throw todos.reason
  if (todos.status === 'rejected') console.error('Mein Tag: To-Do nicht verfügbar', todos.reason)
  if (planner.status === 'rejected') console.error('Mein Tag: Planner nicht verfügbar', planner.reason)
  const items: TaskItem[] = [...(todos.status === 'fulfilled' ? todos.value : []), ...(planner.status === 'fulfilled' ? planner.value : [])]
  return items.filter(belongsToMyDay).sort(compareMyDay)
}

// Weder To-Do noch Planner können blättern - einmal laden, stapelweise anzeigen.
const loadMyDay = pagesFromAll(loadMyDayItems, 10)
const loadTodos = pagesFromAll(loadTodoItems, 10)
const loadPlannerTasks = pagesFromAll(loadPlannerItems, 10)

function dueUrgency(item: DueInfo, important = false): Urgency {
  if (item.dueInDays !== null && item.dueInDays < 0) return 'critical'
  if (item.dueInDays === 0 || important) return 'warning'
  return 'normal'
}

function DueLabel({ item }: { item: TaskItem }) {
  if (item.dueInDays === null) return item.source === 'todo' && item.reminderInDays === 0 ? <Pill tone="info">Erinnerung heute</Pill> : null
  if (item.dueInDays < 0) return <Pill tone="critical">überfällig · {formatDate(item.dueDate)}</Pill>
  if (item.dueInDays === 0) return <Pill tone="warning">heute fällig</Pill>
  return <Pill tone="neutral">fällig {formatDate(item.dueDate)}</Pill>
}

function CrmLink({ reference }: { reference: CrmReference }) {
  const content = (
    <>
      <span className="crm-ref-type">{reference.entityLabel}</span>
      <span className="crm-ref-name">{reference.name}</span>
    </>
  )
  return reference.url ? (
    <a className="crm-ref" href={reference.url} target="_blank" rel="noopener noreferrer" title={`${reference.entityLabel} im CRM öffnen`}>
      {content}
    </a>
  ) : (
    <span className="crm-ref">{content}</span>
  )
}

/** Eine Aufgabe aus To-Do oder Planner; `showSource` kennzeichnet Planner-Aufgaben in der gemischten Liste „Mein Tag“. */
function TaskRow({ item, showSource = false }: { item: TaskItem; showSource?: boolean }) {
  if (item.source === 'planner') {
    return (
      <Row
        urgency={dueUrgency(item)}
        title={item.title}
        meta={
          <>
            <strong>{item.plan}</strong> · {item.statusLabel}
          </>
        }
        tags={showSource ? <Pill tone="neutral">Mir zugewiesen</Pill> : undefined}
        aside={<DueLabel item={item} />}
      />
    )
  }
  const important = item.importance === 'high'
  return (
    <Row
      urgency={dueUrgency(item, important)}
      title={item.title}
      meta={`${item.list} · ${item.statusLabel}`}
      tags={
        important || item.crm ? (
          <>
            {important && <Pill tone="critical">Wichtig</Pill>}
            {item.crm && <CrmLink reference={item.crm} />}
          </>
        ) : undefined
      }
      aside={<DueLabel item={item} />}
    />
  )
}

// ---------- Diagramm: offene Aufgaben nach Fälligkeit, relativ zu heute ----------

type DueRange = 'all' | 'month' | 'week'
type TaskSource = 'todo' | 'planner'

const DUE_RANGES: Array<{ value: DueRange; label: string }> = [
  { value: 'all', label: 'Gesamtzeitraum' },
  { value: 'month', label: 'Monat' },
  { value: 'week', label: 'Woche' },
]

// Aufgaben in derselben Farbe wie im Auslastungsverlauf, zugewiesene Planner-Aufgaben in der nächsten Serienfarbe.
const TASK_SERIES: ChartSeries[] = [
  { id: 'todo', label: 'Aufgaben', color: 'var(--series-4)' },
  { id: 'planner', label: 'Mir zugewiesen', color: 'var(--series-5)' },
]
const MAX_TITLES = 3

interface DatedTask {
  title: string
  source: TaskSource
  /** Tage von heute bis zur Fälligkeit, negativ = überfällig */
  offset: number
}

async function loadDueTasks() {
  const today = startOfDay(new Date())
  const [todos, planner] = await Promise.allSettled([listMyOpenTodos(), listMyPlannerTasks()])
  if (todos.status === 'rejected' && planner.status === 'rejected') throw todos.reason

  const tasks: DatedTask[] = []
  const unavailable: string[] = []
  let undated = 0
  const collect = (source: TaskSource, rows: Array<{ title: string; dueDate: string | null }>) => {
    for (const row of rows) {
      const due = toCalendarDate(row.dueDate)
      if (due) tasks.push({ title: row.title, source, offset: daysBetween(today, due) })
      else undated += 1
    }
  }
  if (todos.status === 'fulfilled') collect('todo', todos.value)
  else unavailable.push('To-Do')
  if (planner.status === 'fulfilled') collect('planner', planner.value)
  else unavailable.push('Planner')
  return { tasks, undated, unavailable, today }
}

function formatOffset(days: number) {
  if (days === 0) return 'Heute'
  const sign = days < 0 ? '−' : '+'
  const abs = Math.abs(days)
  if (abs < 14) return `${sign}${abs} T`
  if (abs < 60) return `${sign}${Math.round(abs / 7)} W`
  if (abs < 730) return `${sign}${Math.round(abs / 30)} M`
  return `${sign}${Math.round(abs / 365)} J`
}

function dayCount(days: number) {
  return `${days} ${days === 1 ? 'Tag' : 'Tagen'}`
}

function describeBucket(from: number, to: number, today: Date) {
  const date = (offset: number) => formatShortDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset))
  const dates = from === to ? date(from) : `${date(from)}–${date(to)}`
  if (to < 0) return from === to ? `Seit ${dayCount(-from)} überfällig (${dates})` : `Seit ${-to}–${dayCount(-from)} überfällig (${dates})`
  if (from === 0) return to === 0 ? `Heute fällig (${dates})` : `Heute bis in ${dayCount(to)} fällig (${dates})`
  return from === to ? `In ${dayCount(from)} fällig (${dates})` : `In ${from}–${dayCount(to)} fällig (${dates})`
}

/**
 * Säulenbreite und Bereich je Zeitraum. Säulen beginnen immer an einem Vielfachen der Breite ab heute,
 * damit die Heute-Markierung genau zwischen Überfälligem und Anstehendem liegt.
 */
function bucketLayout(range: DueRange, offsets: number[]) {
  if (range === 'week') return { size: 1, first: -7, last: 7, edges: true }
  if (range === 'month') return { size: 7, first: -4, last: 4, edges: true }
  const min = Math.min(0, ...offsets)
  const max = Math.max(0, ...offsets)
  const size = [1, 7, 14, 30, 60, 90, 180, 365].find((candidate) => Math.floor(max / candidate) - Math.floor(min / candidate) < 14) ?? 730
  return { size, first: Math.floor(min / size), last: Math.floor(max / size), edges: false }
}

interface DueBucket {
  key: string
  label: string
  detail: string
  values: Record<TaskSource, number>
  /** Titel, früheste Fälligkeit zuerst */
  titles: string[]
  startsToday: boolean
}

function dueBuckets(tasks: DatedTask[], range: DueRange, today: Date): DueBucket[] {
  const { size, first, last, edges } = bucketLayout(range, tasks.map((task) => task.offset))
  const bucket = (key: string, label: string, detail: string, startsToday = false): DueBucket => ({
    key,
    label,
    detail,
    values: { todo: 0, planner: 0 },
    titles: [],
    startsToday,
  })
  const regular = Array.from({ length: last - first + 1 }, (_, index) => {
    const from = (first + index) * size
    return bucket(`bucket-${first + index}`, formatOffset(from), describeBucket(from, from + size - 1, today), from === 0)
  })
  // Bei Woche und Monat fällt nichts weg: Aufgaben außerhalb landen in „Älter“ bzw. „Später“.
  const older = bucket('older', 'Älter', `Seit mehr als ${dayCount(-first * size)} überfällig`)
  const later = bucket('later', 'Später', `In mehr als ${dayCount((last + 1) * size - 1)} fällig`)

  for (const task of [...tasks].sort((a, b) => a.offset - b.offset)) {
    const index = Math.floor(task.offset / size) - first
    const target = index < 0 ? older : index >= regular.length ? later : regular[index]
    target.values[task.source] += 1
    target.titles.push(task.title)
  }

  const hasTasks = (entry: DueBucket) => entry.values.todo + entry.values.planner > 0
  return [...(edges && hasTasks(older) ? [older] : []), ...regular, ...(edges && hasTasks(later) ? [later] : [])]
}

function titleNotes(titles: string[]) {
  const shown = titles.slice(0, MAX_TITLES).map((title) => `• ${title}`)
  return titles.length > MAX_TITLES ? [...shown, `+ ${titles.length - MAX_TITLES} weitere`] : shown
}

function TasksDueChart() {
  const data = useAsyncData(loadDueTasks)
  const [range, setRange] = useState<DueRange>('all')

  if (data.status === 'loading') return <WidgetSkeleton />
  if (data.status === 'error') return <WidgetNotice kind="offline" text={data.error} onRetry={data.reload} />

  const { tasks, undated, unavailable, today } = data.data
  if (tasks.length === 0) {
    return <WidgetEmpty text={undated > 0 ? `Keine offenen Aufgaben mit Fälligkeitsdatum (${undated} ohne)` : 'Keine offenen Aufgaben'} />
  }

  const buckets = dueBuckets(tasks, range, today)
  const columns: ChartColumn[] = buckets.map((entry) => ({
    key: entry.key,
    label: entry.label,
    detail: entry.detail,
    values: entry.values,
    notes: titleNotes(entry.titles),
  }))
  const todayIndex = buckets.findIndex((entry) => entry.startsToday)
  const overdue = tasks.filter((task) => task.offset < 0).length
  const caption = [
    `${overdue} überfällig, ${tasks.length - overdue} anstehend`,
    undated > 0 ? `${undated} ohne Fälligkeit` : '',
    unavailable.length > 0 ? `nicht verfügbar: ${unavailable.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <ChartFrame
      controls={<TabSwitch label="Zeitraum" options={DUE_RANGES} value={range} onChange={setRange} />}
      legend={TASK_SERIES}
      legendShape="rect"
      caption={caption}
      table={{
        columns: ['Fällig', 'Aufgaben', 'Mir zugewiesen', 'Summe'],
        rows: buckets.map((entry) => ({
          key: entry.key,
          cells: [entry.detail, entry.values.todo, entry.values.planner, entry.values.todo + entry.values.planner],
        })),
      }}
    >
      <ColumnChart
        series={TASK_SERIES}
        columns={columns}
        integer
        marker={todayIndex >= 0 ? { beforeIndex: todayIndex, before: 'überfällig', after: 'fällig' } : undefined}
        ariaLabel="Offene Aufgaben nach Fälligkeit relativ zu heute"
      />
    </ChartFrame>
  )
}

// Live-Widget: „Mein Tag“, eigene offene To-Do-Aufgaben (mit CRM-Bezug) und mir zugewiesene Planner-Aufgaben.
export default function AktivitaetenWidget(props: WidgetProps) {
  const [tab, setTab] = useState<TaskTab>('myday')
  const [showChart, setShowChart] = useState(false)
  // Alle Listen laden sofort, damit das Umschalten ohne Wartezeit geht; die Abfragen dahinter werden geteilt.
  const myDay = usePagedList(loadMyDay)
  const todos = usePagedList(loadTodos)
  const plannerTasks = usePagedList(loadPlannerTasks)

  const active = tab === 'myday' ? myDay : tab === 'todo' ? todos : plannerTasks
  const overdue = (active.items as DueInfo[]).filter((item) => item.dueInDays !== null && item.dueInDays < 0).length

  return (
    <WidgetFrame
      {...props}
      actions={<ChartToggle active={showChart} onToggle={() => setShowChart((value) => !value)} />}
      badge={active.status === 'ready' && overdue > 0 ? <Pill tone="critical">{overdue} überfällig</Pill> : undefined}
      toolbar={showChart ? undefined : <TabSwitch label="Aufgabenart" options={TABS} value={tab} onChange={setTab} />}
    >
      {showChart ? (
        <TasksDueChart />
      ) : tab === 'myday' ? (
        <PagedRows
          list={myDay}
          empty="Nichts für heute fällig und nichts überfällig"
          renderItem={(item) => <TaskRow key={`${item.source}-${item.id}`} item={item} showSource />}
        />
      ) : tab === 'todo' ? (
        <PagedRows list={todos} empty="Keine offenen Aufgaben" renderItem={(item) => <TaskRow key={item.id} item={item} />} />
      ) : (
        <PagedRows
          list={plannerTasks}
          empty="Keine offenen Planner-Aufgaben, die dir zugewiesen sind"
          renderItem={(item) => <TaskRow key={item.id} item={item} />}
        />
      )}
    </WidgetFrame>
  )
}
